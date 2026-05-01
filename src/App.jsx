import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquarePlus, PanelLeft, Settings, Send, Paperclip, ChevronDown, Network, ArrowUpRight, User, Bot, Trash2, X, FileText, Download, Sparkles, MessageSquare } from 'lucide-react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import mammoth from 'mammoth';
import CanvasPanel from './CanvasPanel';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama3');
  
  // History state
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Document state
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');

  // Canvas state
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [globalCanvasId, setGlobalCanvasId] = useState(null);
  
  const [canvasNodes, setCanvasNodes, onNodesChange] = useNodesState([]);
  const [canvasEdges, setCanvasEdges, onEdgesChange] = useEdgesState([]);

  // Fetch initial data from Supabase
  useEffect(() => {
    async function initData() {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, title, messages(id, role, content, created_at)')
        .order('created_at', { ascending: false });
        
      if (sessionData) {
        setSessions(sessionData.map(s => ({
          ...s,
          messages: s.messages ? s.messages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at)) : []
        })));
      }
      
      const { data: canvasData } = await supabase.from('canvases').select('*').limit(1).single();
      if (canvasData) {
        setGlobalCanvasId(canvasData.id);
        setCanvasNodes(canvasData.nodes || []);
        setCanvasEdges(canvasData.edges || []);
      } else {
        const { data: newCanvas } = await supabase.from('canvases').insert([{ nodes: [], edges: [] }]).select().single();
        if (newCanvas) setGlobalCanvasId(newCanvas.id);
      }
    }
    initData();
  }, []);

  // Save to Supabase (debounced)
  useEffect(() => {
    if (!globalCanvasId || canvasNodes.length === 0) return;
    const timeoutId = setTimeout(() => {
      supabase.from('canvases').update({ nodes: canvasNodes }).eq('id', globalCanvasId).then();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [canvasNodes, globalCanvasId]);

  useEffect(() => {
    if (!globalCanvasId || canvasEdges.length === 0) return;
    const timeoutId = setTimeout(() => {
      supabase.from('canvases').update({ edges: canvasEdges }).eq('id', globalCanvasId).then();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [canvasEdges, globalCanvasId]);

  // 6.2 Undo / Redo State
  const past = useRef([]);
  const future = useRef([]);

  const saveHistory = useCallback(() => {
    past.current.push({ nodes: canvasNodes, edges: canvasEdges });
    if (past.current.length > 50) past.current.shift();
    future.current = [];
  }, [canvasNodes, canvasEdges]);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const previous = past.current.pop();
    future.current.push({ nodes: canvasNodes, edges: canvasEdges });
    setCanvasNodes(previous.nodes);
    setCanvasEdges(previous.edges);
  }, [canvasNodes, canvasEdges, setCanvasNodes, setCanvasEdges]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop();
    past.current.push({ nodes: canvasNodes, edges: canvasEdges });
    setCanvasNodes(next.nodes);
    setCanvasEdges(next.edges);
  }, [canvasNodes, canvasEdges, setCanvasNodes, setCanvasEdges]);

  // Track spawn position so nodes don't stack on top of each other
  const nodeSpawnOffset = useRef({ x: 60, y: 60 });

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Update local session state to keep sidebar in sync
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages } : s));
    }
  }, [messages, currentSessionId]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const createNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  const loadSession = (id) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(id);
    }
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) createNewChat();
    await supabase.from('sessions').delete().eq('id', id);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if DOCX
    if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const arrayBuffer = evt.target.result;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          setDocumentContent(result.value);
          setDocumentTitle(file.name);
          setIsDocumentOpen(true);
        } catch (error) {
          console.error("Error parsing DOCX:", error);
          alert("Could not extract text from this Word document.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setDocumentContent(evt.target.result);
        setDocumentTitle(file.name);
        setIsDocumentOpen(true);
      };
      reader.readAsText(file);
    }
    e.target.value = null; // reset
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    const userText = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    let sessionId = currentSessionId;
    
    // Create session if it doesn't exist
    if (!sessionId) {
      const title = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
      const { data: newSession } = await supabase.from('sessions').insert([{ title }]).select().single();
      if (newSession) {
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        setSessions(prev => [{ id: sessionId, title, messages: [] }, ...prev]);
      }
    }

    // Save user message to Supabase
    if (sessionId) {
      await supabase.from('messages').insert([{ session_id: sessionId, role: 'user', content: userText }]);
    }
    
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsGenerating(true);
    
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    let fullAssistantMessage = '';

    try {
      // Inject document contents invisibly into the system prompt if present
      let apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      if (isDocumentOpen && documentContent) {
         apiMessages = [
           { role: 'system', content: `The user has an opened document named "${documentTitle}". Its contents are:\n\n${documentContent}\n\nWhen helping the user, you may refer to this document content.` },
           ...apiMessages
         ];
      }

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
              fullAssistantMessage += parsed.message.content;
              setMessages(prev => {
                const msgs = [...prev];
                const lastIdx = msgs.length - 1;
                msgs[lastIdx] = { 
                   ...msgs[lastIdx], 
                   content: msgs[lastIdx].content + parsed.message.content 
                };
                return msgs;
              });
            }
          } catch (e) {
            console.warn('Skipped line parse:', line);
          }
        }
      }

      // Save assistant message to Supabase
      if (sessionId && fullAssistantMessage) {
        await supabase.from('messages').insert([{ session_id: sessionId, role: 'assistant', content: fullAssistantMessage }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const msgs = [...prev];
        const lastIdx = msgs.length - 1;
        msgs[lastIdx] = {
           ...msgs[lastIdx],
           content: msgs[lastIdx].content + "\n\n*(Error connecting to local AI. Ensure Ollama is running)*"
        };
        return msgs;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const downloadDocument = () => {
    const blob = new Blob([documentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = documentTitle || 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * 5.1 Send to Chat Implementation
   * Takes content from a node and injects it into the conversation as system context.
   */
  const sendToChat = useCallback(async (content) => {
    const sysMsg = `Context from Thinking Canvas:\n\n${content}`;
    setMessages((prev) => [
      ...prev,
      { role: 'system', content: sysMsg }
    ]);
    
    if (currentSessionId) {
      await supabase.from('messages').insert([{ session_id: currentSessionId, role: 'system', content: sysMsg }]);
    }
  }, [setMessages, currentSessionId]);

  /**
   * 5.3 Summarize Cluster Implementation
   * Takes an array of strings, summarizes them via AI, and sends to chat.
   */
  const summarizeSelection = useCallback(async (contents) => {
    if (!contents || contents.length === 0) return;

    const prompt = `I have the following related notes from a thinking canvas:
    ${contents.map((c, i) => `${i+1}. "${c}"`).join('\n')}
    
    Please provide a concise (2-3 sentence) synthesis or summary that connects these ideas. 
    Focus on the main "big picture" takeaway.`;

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('AI Summary error');
      const data = await response.json();
      const summary = data.message.content.trim();
      
      sendToChat(`**Synthesis of ${contents.length} notes:**\n\n${summary}`);
    } catch (err) {
      console.error("Summarization failed:", err);
    }
  }, [selectedModel, sendToChat]);

  /**
   * 3.5 Collapse Cluster Implementation
   * Synthesizes multiple nodes into a single summary node and remaps their edges.
   */
  const collapseCluster = useCallback(async (selectedNodeIds) => {
    if (!selectedNodeIds || selectedNodeIds.length < 2) return;
    
    saveHistory(); // Save before major structural change

    const contents = selectedNodeIds
      .map(id => canvasNodes.find(n => n.id === id)?.data.content)
      .filter(Boolean);

    const prompt = `Synthesize the following points into a single, concise summary point (max 2 sentences):\n` + contents.map(c => `- ${c}`).join('\n');
    
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('AI Collapse error');
      const data = await response.json();
      const summaryText = data.message.content.trim();

      const newId = `node-summary-${Date.now()}`;
      
      const selectedNodesObjs = canvasNodes.filter(n => selectedNodeIds.includes(n.id));
      const cx = selectedNodesObjs.reduce((sum, n) => sum + n.position.x, 0) / selectedNodesObjs.length;
      const cy = selectedNodesObjs.reduce((sum, n) => sum + n.position.y, 0) / selectedNodesObjs.length;

      const newNode = {
        id: newId,
        type: 'textNode',
        position: { x: cx, y: cy },
        data: { 
          id: newId, 
          nodeType: 'idea', 
          content: `**Cluster Summary**\n${summaryText}`, 
          color: '#f5a623',
          sendToChat 
        }
      };

      const newEdges = canvasEdges.map(e => {
        let { source, target } = e;
        if (selectedNodeIds.includes(source)) source = newId;
        if (selectedNodeIds.includes(target)) target = newId;
        return { ...e, source, target };
      }).filter(e => e.source !== e.target); // Remove internal edges

      setCanvasNodes(nds => [...nds.filter(n => !selectedNodeIds.includes(n.id)), newNode]);
      setCanvasEdges(newEdges);

    } catch (err) {
      console.error("Collapse failed:", err);
    }
  }, [canvasNodes, canvasEdges, selectedModel, sendToChat, setCanvasNodes, setCanvasEdges, saveHistory]);

  /**
   * 4.5/4.6 Helper to stream an AI response directly into a new canvas node.
   */
  const streamToNode = useCallback(async (sourceNodeId, prompt, type, edgeType, offset = {x: 300, y: 0}) => {
    saveHistory();
    const newId = `node-stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    setCanvasNodes(nds => {
      const sourceNode = nds.find(n => n.id === sourceNodeId);
      if (!sourceNode) return nds;
      
      const newNode = {
        id: newId,
        type: 'textNode',
        position: { x: sourceNode.position.x + offset.x, y: sourceNode.position.y + offset.y },
        data: {
          id: newId,
          nodeType: type,
          content: '',
          isGenerating: true,
        }
      };
      return [...nds, newNode];
    });

    setCanvasEdges(eds => [
      ...eds,
      {
        id: `edge-${sourceNodeId}-${newId}`,
        source: sourceNodeId,
        target: newId,
        type: 'labeled',
        animated: true,
        data: { edgeType }
      }
    ]);

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullContent += parsed.message.content;
              setCanvasNodes(nds => nds.map(n => 
                n.id === newId ? { ...n, data: { ...n.data, content: fullContent } } : n
              ));
            }
          } catch (e) {
            // ignore partial JSON parse errors
          }
        }
      }

      setCanvasNodes(nds => nds.map(n => 
        n.id === newId ? { ...n, data: { ...n.data, isGenerating: false } } : n
      ));
    } catch (e) {
      console.error(e);
      setCanvasNodes(nds => nds.map(n => 
        n.id === newId ? { ...n, data: { ...n.data, isGenerating: false, content: (n.data.content || '') + '\n[Error: Connection interrupted]' } } : n
      ));
    }
  }, [selectedModel, setCanvasNodes, setCanvasEdges, saveHistory]);

  /**
   * 4.2 Branching: "What if the opposite?"
   */
  const branchOpposite = useCallback((nodeId, content) => {
    const prompt = `Consider the following thought: "${content}". What is the complete opposite or best counter-argument to this idea? Be concise.`;
    streamToNode(nodeId, prompt, 'response', 'conflict', {x: 350, y: 0});
  }, [streamToNode]);

  /**
   * 4.3 Fan Out: Generate 3 distinct next steps/ideas
   */
  const fanOut = useCallback((nodeId, content) => {
    // We launch 3 streams concurrently
    streamToNode(nodeId, `Provide a logical, direct next step or consequence for this thought: "${content}". Be concise.`, 'idea', 'directed', {x: 350, y: -160});
    streamToNode(nodeId, `Provide a completely alternative, lateral perspective based on this thought: "${content}". Be concise.`, 'idea', 'directed', {x: 350, y: 0});
    streamToNode(nodeId, `Provide an unexpected wildcard or highly creative next step following this thought: "${content}". Be concise.`, 'idea', 'directed', {x: 350, y: 160});
  }, [streamToNode]);

  /**
   * 4.1 Fill the Gap AI Implementation
   * Takes an edge, asks AI for bridging steps, and inserts new nodes.
   */
  const fillGap = useCallback(async (edgeId) => {
    const edge = canvasEdges.find((e) => e.id === edgeId);
    if (!edge) return;

    saveHistory();

    const sourceNode = canvasNodes.find((n) => n.id === edge.source);
    const targetNode = canvasNodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    // UI Feedback: Set edge label to loading state
    const originalLabel = edge.data?.label || '';
    setCanvasEdges(eds => eds.map(e => e.id === edgeId ? { ...e, data: { ...e.data, label: '✨ Thinking...' } } : e));

    const prompt = `Act as a logical reasoning engine for a thinking canvas. 
    Idea 1: "${sourceNode.data.content}"
    Idea 2: "${targetNode.data.content}"
    
    Identify the conceptual gap between these two points. Provide 2 highly logical, substantial intermediate steps (max 20 words each) that form a clear bridge of reasoning between Idea 1 and Idea 2.
    
    Respond ONLY with a valid JSON array of strings.
    Example: ["Intermediate reasoning step A", "Intermediate reasoning step B"]`;

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          options: {
            temperature: 0.3, // Lower temp for more structured response
          }
        }),
      });

      if (!response.ok) throw new Error('AI Bridge error');
      const data = await response.json();
      
      let steps = [];
      try {
        let content = data.message.content.trim();
        // Remove markdown JSON blocks if present
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        
        // More robust JSON extraction
        const start = content.indexOf('[');
        const end = content.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          steps = JSON.parse(content.substring(start, end + 1));
        } else {
          throw new Error("No JSON array found");
        }
      } catch (e) {
        console.error("Failed to parse bridge steps:", e, data.message.content);
        // Reset edge label on error
        setCanvasEdges(eds => eds.map(e => e.id === edgeId ? { ...e, data: { ...e.data, label: '⚠️ Parsing failed' } } : e));
        setTimeout(() => {
          setCanvasEdges(eds => eds.map(e => e.id === edgeId ? { ...e, data: { ...e.data, label: originalLabel } } : e));
        }, 2000);
        return;
      }

      if (!Array.isArray(steps) || steps.length === 0) {
        setCanvasEdges(eds => eds.map(e => e.id === edgeId ? { ...e, data: { ...e.data, label: originalLabel } } : e));
        return;
      }

      // Calculate positions for the new nodes
      const sx = sourceNode.position.x;
      const sy = sourceNode.position.y;
      const tx = targetNode.position.x;
      const ty = targetNode.position.y;

      const newNodes = steps.map((step, i) => {
        const ratio = (i + 1) / (steps.length + 1);
        const nid = `node-bridge-${Date.now()}-${i}`;
        return {
          id: nid,
          type: 'textNode',
          position: {
            x: sx + (tx - sx) * ratio,
            y: sy + (ty - sy) * ratio,
          },
          data: { 
            id: nid,
            content: step, 
            nodeType: 'response',
            sendToChat // Ensure these are passed so buttons work
          },
        };
      });

      // Create new edges
      const newEdges = [];
      // Edge from source to first bridge
      newEdges.push({
        id: `edge-${sourceNode.id}-${newNodes[0].id}`,
        source: sourceNode.id,
        target: newNodes[0].id,
        type: 'labeled',
        animated: true,
      });
      // Edges between bridges
      for (let i = 0; i < newNodes.length - 1; i++) {
        newEdges.push({
          id: `edge-${newNodes[i].id}-${newNodes[i+1].id}`,
          source: newNodes[i].id,
          target: newNodes[i+1].id,
          type: 'labeled',
          animated: true,
        });
      }
      // Edge from last bridge to target
      newEdges.push({
        id: `edge-${newNodes[newNodes.length-1].id}-${targetNode.id}`,
        source: newNodes[newNodes.length-1].id,
        target: targetNode.id,
        type: 'labeled',
        animated: true,
      });

      // Update state: remove old edge, add new nodes and edges
      setCanvasNodes((prev) => [...prev, ...newNodes]);
      setCanvasEdges((prev) => [
        ...prev.filter((e) => e.id !== edgeId),
        ...newEdges,
      ]);

    } catch (err) {
      console.error("AI Fill Gap failed:", err);
    }
  }, [canvasNodes, canvasEdges, selectedModel, setCanvasNodes, setCanvasEdges, saveHistory]);

  /**
   * 2.1 CanvasNode shape: { id, type, content, position: {x, y}, nodeType }
   * Creates a new ReactFlow node from an AI message and appends it to the canvas.
   */
  const sendToCanvas = useCallback((content, nodeType = 'response') => {
    const id = `node-${Date.now()}`;
    // Cascade spawn position so nodes don't overlap
    const pos = { ...nodeSpawnOffset.current };
    nodeSpawnOffset.current = {
      x: (pos.x + 280) % 820,
      y: pos.y + (nodeSpawnOffset.current.x + 280 >= 820 ? 160 : 0),
    };

    /** @type {import('@xyflow/react').Node} */
    const newNode = {
      id,
      type: 'textNode',          // maps to the TextNode component
      position: pos,
      data: {
        id,
        nodeType,                 // 'response' | 'prompt' | 'idea'
        content,
        color: nodeType === 'response' ? '#5b8dee' : nodeType === 'prompt' ? '#9b6dff' : '#f5a623',
        sendToChat,
      },
    };

    setCanvasNodes((prev) => [...prev, newNode]);
    // Auto-open canvas so user sees the node appear
    setIsCanvasOpen(true);
  }, [setCanvasNodes, sendToChat]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <Bot size={14} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em' }}>Nexus</span>
        </div>
        
        <button className="new-chat-btn" onClick={createNewChat}>
          <MessageSquarePlus size={14} />
          New Chat
        </button>

        <div className="history-list">
          <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Chats</div>
          {sessions.map(session => (
            <div 
              key={session.id} 
              className={`history-item ${currentSessionId === session.id ? 'active' : ''}`}
              onClick={() => loadSession(session.id)}
            >
              <span className="history-item-title">{session.title}</span>
              <button className="delete-btn" onClick={(e) => deleteSession(e, session.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--outline-variant)' }}>
          <button className="icon-btn" style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem', padding: '0 0.5rem' }}>
            <Settings size={16} />
            <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Split Area */}
      <div className="main-wrapper">
        <main className="main-content">
          <header className="top-nav">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="icon-btn" onClick={() => setIsDocumentOpen(!isDocumentOpen)} title="Toggle Document Panel">
                <PanelLeft size={16} />
              </button>
              <button
                className={`icon-btn canvas-toggle-btn ${isCanvasOpen ? 'active' : ''}`}
                onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                title="Toggle Thinking Canvas"
              >
                <Network size={16} />
              </button>
              <span className="chat-title-text" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : 'New Session'}
              </span>
            </div>
            
            <div className="model-selector-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', padding: '2px 10px' }}>
              <Bot size={12} style={{ marginRight: '4px', color: 'var(--primary)' }} />
              <select 
                style={{
                  background: 'transparent', border: 'none', outline: 'none', 
                  color: 'var(--on-surface)', fontFamily: 'inherit', fontWeight: 600,
                  fontSize: '0.7rem', cursor: 'pointer', padding: '4px 0', appearance: 'none'
                }}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="llama3">Llama 3 (8B)</option>
                <option value="phi3">Phi-3 (Mini)</option>
                <option value="mistral">Mistral (7B)</option>
              </select>
              <ChevronDown size={12} style={{ marginLeft: '3px', opacity: 0.5 }} />
            </div>
          </header>

          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                <h1>Ready to build?</h1>
                <p>I'm your local AI assistant. I can help with coding, analysis, or just a chat.</p>
                
                <div className="bento-grid">
                  <div className="bento-item large">
                    <div className="icon" style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>⚡</div>
                    <div>
                      <h3 style={{ fontSize: '0.85rem', marginBottom: '0.15rem' }}>Local Inference</h3>
                      <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Running 100% locally on your machine via Ollama. Private and secure.</p>
                    </div>
                  </div>
                  <div className="bento-item medium">
                    <h3 style={{ fontSize: '0.8rem', marginBottom: '0.15rem' }}>Docs Context</h3>
                    <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Attach documents to give me context for our conversation.</p>
                  </div>
                  <div className="bento-item">
                    <div style={{ fontSize: '0.95rem' }}>🛠️</div>
                  </div>
                  <div className="bento-item">
                    <div style={{ fontSize: '0.95rem' }}>🔒</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="messages-list" style={{ width: '100%', maxWidth: '600px' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message-wrapper ${msg.role}`}>
                    {msg.role !== 'system' && (
                      <div className={`avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                    )}
                    <div className="message-bubble">
                      {msg.role === 'user' ? (
                        <div style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </div>
                      ) : msg.role === 'assistant' ? (
                        <div className="markdown-body">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {(isGenerating && idx === messages.length - 1) && <span className="blinking-cursor" />}
                        </div>
                      ) : (
                        <div className="system-context-note">
                          <Network size={10} />
                          <span>Canvas Context Added</span>
                          <div className="system-context-preview">{msg.content.replace('Context from Thinking Canvas:', '').trim()}</div>
                        </div>
                      )}
                    </div>
                    {/* Send to Canvas button — for all user/assistant messages */}
                    {msg.role !== 'system' && msg.content && !(msg.role === 'assistant' && isGenerating && idx === messages.length - 1) && (
                      <button
                        className="send-to-canvas-btn"
                        onClick={() => sendToCanvas(msg.content, msg.role === 'user' ? 'prompt' : 'response')}
                        title="Send to Thinking Canvas"
                      >
                        <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <div className="input-container">
            {messages.length === 0 && (
               <div className="suggested-prompts">
                <button className="prompt-chip" onClick={() => setInput("Explain quantum computing in simple terms")}>Explain Quantum</button>
                <button className="prompt-chip" onClick={() => setInput("Help me write a React hook for local storage")}>React Hook</button>
                <button className="prompt-chip" onClick={() => setInput("Summarize my document")}>Summarize Doc</button>
              </div>
            )}
            
            <div className="input-box">
              <div className="action-buttons">
                <input 
                  type="file" 
                  id="file-upload"
                  accept=".txt,.md,.json,.csv,.docx"
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
                <label htmlFor="file-upload" className="icon-btn" title="Upload specific file context">
                  <Paperclip size={16} />
                </label>
              </div>
              
              <div className="textarea-wrapper">
                <textarea 
                  className="chat-input-area"
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Nexus..."
                  rows={1}
                />
              </div>

              <div className="action-buttons">
                <button 
                  className={`icon-btn send-btn`}
                  onClick={handleSend}
                  disabled={isGenerating || !input.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.6rem', color: 'var(--on-surface-variant)', opacity: 0.6 }}>
               Nexus Local AI may provide inaccurate information. Verify critical data.
            </div>
          </div>
        </main>

        {/* Right Side Document Panel */}
        {isDocumentOpen && (
          <aside className="document-panel">
            <div className="document-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <FileText size={16} color="var(--primary)" />
                <input 
                  className="document-title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Document Title"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button className="icon-btn" onClick={downloadDocument} title="Download Document">
                  <Download size={14} />
                </button>
                <button className="icon-btn" onClick={() => setIsDocumentOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="document-editor-wrapper">
              <textarea 
                className="document-textarea"
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Start typing or upload a text file..."
              />
            </div>
          </aside>
        )}

        {/* Thinking Canvas Panel */}
        {isCanvasOpen && (
          <CanvasPanel
            nodes={canvasNodes}
            edges={canvasEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setEdges={setCanvasEdges}
            fillGap={fillGap}
            sendToChat={sendToChat}
            summarizeSelection={summarizeSelection}
            collapseCluster={collapseCluster}
            addIdeaNode={() => sendToCanvas('New Idea...', 'idea')}
            branchOpposite={branchOpposite}
            fanOut={fanOut}
            undo={undo}
            redo={redo}
            canUndo={past.current.length > 0}
            canRedo={future.current.length > 0}
            saveHistory={saveHistory}
          />
        )}
      </div>
    </div>
  );
}

export default App;
