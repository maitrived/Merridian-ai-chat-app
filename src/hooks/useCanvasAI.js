import { useCallback, useRef } from 'react';
import { storage } from '../lib/storage';

export function useCanvasAI(
  session,
  canvasNodes,
  setCanvasNodes,
  canvasEdges,
  setCanvasEdges,
  setMessages,
  currentSessionId,
  saveHistory,
  setIsCanvasOpen
) {
  const nodeSpawnOffset = useRef({ x: 60, y: 60 });

  const sendToChat = useCallback(async (content) => {
    const sysMsg = `Context from Thinking Canvas:\n\n${content}`;
    setMessages((prev) => [
      ...prev,
      { role: 'system', content: sysMsg }
    ]);
    
    if (currentSessionId) {
      await storage.saveMessage(session, currentSessionId, 'system', sysMsg);
    }
  }, [setMessages, currentSessionId, session]);

  const sendToCanvas = useCallback((content, nodeType = 'response') => {
    const id = `node-${Date.now()}`;
    const pos = { ...nodeSpawnOffset.current };
    nodeSpawnOffset.current = {
      x: (pos.x + 280) % 820,
      y: pos.y + (nodeSpawnOffset.current.x + 280 >= 820 ? 160 : 0),
    };

    const newNode = {
      id,
      type: 'textNode',
      position: pos,
      data: {
        id,
        nodeType,
        content,
        color: nodeType === 'response' ? '#5b8dee' : nodeType === 'prompt' ? '#9b6dff' : '#f5a623',
        sendToChat,
      },
    };

    setCanvasNodes((prev) => [...prev, newNode]);
    setIsCanvasOpen(true);
  }, [setCanvasNodes, sendToChat, setIsCanvasOpen]);

  const summarizeSelection = useCallback(async (contents) => {
    if (!contents || contents.length === 0) return;

    const prompt = `I have the following related notes from a thinking canvas:
    ${contents.map((c, i) => `${i+1}. "${c}"`).join('\n')}
    
    Please provide a concise (2-3 sentence) synthesis or summary that connects these ideas. 
    Focus on the main "big picture" takeaway.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('AI Summary error');
      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content?.trim() || '';
      
      sendToChat(`**Synthesis of ${contents.length} notes:**\n\n${summary}`);
    } catch (err) {
      console.error("Summarization failed:", err);
    }
  }, [sendToChat]);

  const collapseCluster = useCallback(async (selectedNodeIds) => {
    if (!selectedNodeIds || selectedNodeIds.length < 2) return;
    
    saveHistory();

    const contents = selectedNodeIds
      .map(id => canvasNodes.find(n => n.id === id)?.data.content)
      .filter(Boolean);

    const prompt = `Synthesize the following points into a single, concise summary point (max 2 sentences):\n` + contents.map(c => `- ${c}`).join('\n');
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('AI Collapse error');
      const data = await response.json();
      const summaryText = data.choices?.[0]?.message?.content?.trim() || '';

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
      }).filter(e => e.source !== e.target);

      setCanvasNodes(nds => [...nds.filter(n => !selectedNodeIds.includes(n.id)), newNode]);
      setCanvasEdges(newEdges);

    } catch (err) {
      console.error("Collapse failed:", err);
    }
  }, [canvasNodes, canvasEdges, sendToChat, setCanvasNodes, setCanvasEdges, saveHistory]);

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
          sendToChat
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          userId: session?.user?.id || 'guest'
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const cleanLine = line.replace(/^data: /, '').trim();
          if (!cleanLine || cleanLine === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(cleanLine);
            const chunk = parsed.choices?.[0]?.delta?.content || '';
            if (chunk) {
              fullContent += chunk;
              setCanvasNodes(nds => nds.map(n => 
                n.id === newId ? { ...n, data: { ...n.data, content: fullContent } } : n
              ));
            }
          } catch (e) {}
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
  }, [setCanvasNodes, setCanvasEdges, saveHistory, session, sendToChat]);

  const branchOpposite = useCallback((nodeId, content) => {
    const prompt = `Consider the following thought: "${content}". What is the complete opposite or best counter-argument to this idea? Be concise.`;
    streamToNode(nodeId, prompt, 'response', 'conflict', {x: 350, y: 0});
  }, [streamToNode]);

  const fanOut = useCallback((nodeId, content) => {
    streamToNode(nodeId, `Provide a logical, direct next step or consequence for this thought: "${content}". Be concise.`, 'idea', 'directed', {x: 350, y: -160});
    streamToNode(nodeId, `Provide a completely alternative, lateral perspective based on this thought: "${content}". Be concise.`, 'idea', 'directed', {x: 350, y: 0});
    streamToNode(nodeId, `Provide an unexpected wildcard or highly creative next step following this thought: "${content}". Be concise.`, 'idea', 'directed', {x: 350, y: 160});
  }, [streamToNode]);

  const fillGap = useCallback(async (edgeId) => {
    const edge = canvasEdges.find((e) => e.id === edgeId);
    if (!edge) return;

    saveHistory();

    const sourceNode = canvasNodes.find((n) => n.id === edge.source);
    const targetNode = canvasNodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const originalLabel = edge.data?.label || '';
    setCanvasEdges(eds => eds.map(e => e.id === edgeId ? { ...e, data: { ...e.data, label: '✨ Thinking...' } } : e));

    const prompt = `Act as a logical reasoning engine for a thinking canvas. 
    Idea 1: "${sourceNode.data.content}"
    Idea 2: "${targetNode.data.content}"
    
    1. Identify the conceptual gap between these two points.
    2. Provide a brief (1-2 sentence) explanation of this gap.
    3. Provide 2 highly logical, substantial intermediate steps (max 20 words each) that form a clear bridge of reasoning between Idea 1 and Idea 2.
    
    Respond ONLY with a valid JSON object in this format:
    {
      "explanation": "Brief explanation of the conceptual gap...",
      "steps": ["Step 1...", "Step 2..."]
    }`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          options: { temperature: 0.3 }
        }),
      });

      if (!response.ok) throw new Error('AI Bridge error');
      const data = await response.json();
      
      let steps = [];
      let explanation = '';

      try {
        let content = data.choices?.[0]?.message?.content?.trim() || '';
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          const parsed = JSON.parse(content.substring(start, end + 1));
          steps = parsed.steps || [];
          explanation = parsed.explanation || '';
        } else {
          throw new Error("No JSON object found");
        }
      } catch (e) {
        console.error("Failed to parse bridge steps:", e);
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

      if (explanation) {
        sendToChat(`**Conceptual Gap Analysis:**\n\n${explanation}`);
      }

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
            sendToChat
          },
        };
      });

      const newEdges = [];
      newEdges.push({
        id: `edge-${sourceNode.id}-${newNodes[0].id}`,
        source: sourceNode.id,
        target: newNodes[0].id,
        type: 'labeled',
        animated: true,
      });
      for (let i = 0; i < newNodes.length - 1; i++) {
        newEdges.push({
          id: `edge-${newNodes[i].id}-${newNodes[i+1].id}`,
          source: newNodes[i].id,
          target: newNodes[i+1].id,
          type: 'labeled',
          animated: true,
        });
      }
      newEdges.push({
        id: `edge-${newNodes[newNodes.length-1].id}-${targetNode.id}`,
        source: newNodes[newNodes.length-1].id,
        target: targetNode.id,
        type: 'labeled',
        animated: true,
      });

      setCanvasNodes((prev) => [...prev, ...newNodes]);
      setCanvasEdges((prev) => [
        ...prev.filter((e) => e.id !== edgeId),
        ...newEdges,
      ]);

    } catch (err) {
      console.error("AI Fill Gap failed:", err);
    }
  }, [canvasNodes, canvasEdges, setCanvasNodes, setCanvasEdges, saveHistory, sendToChat]);

  return {
    sendToChat,
    sendToCanvas,
    summarizeSelection,
    collapseCluster,
    streamToNode,
    branchOpposite,
    fanOut,
    fillGap
  };
}
