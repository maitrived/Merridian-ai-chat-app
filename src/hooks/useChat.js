import { useState, useCallback, useEffect } from 'react';
import { storage } from '../lib/storage';

export function useChat(session) {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    if (!session) return;
    async function fetchSessions() {
      try {
        const sessionData = await storage.getSessions(session);
        if (sessionData) setSessions(sessionData);
      } catch (err) {
        console.error("Storage Error fetching sessions:", err);
      }
    }
    fetchSessions();
  }, [session]);

  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages } : s));
    }
  }, [messages, currentSessionId]);

  const createNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
  }, []);

  const loadSession = useCallback((id) => {
    const s = sessions.find(s => s.id === id);
    if (s) {
      setMessages(s.messages);
      setCurrentSessionId(id);
    }
  }, [sessions]);

  const deleteSession = useCallback(async (e, id) => {
    e.stopPropagation();
    try {
      await storage.deleteSession(session, id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) createNewChat();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete session: " + err.message);
    }
  }, [session, currentSessionId, createNewChat]);

  const fetchAiResponse = useCallback(async (apiMsgList, sessionId, documents = [], isDocumentOpen = false, documentContent = '', documentTitle = '') => {
    setIsGenerating(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    let fullAssistantMessage = '';

    try {
      let apiMessages = apiMsgList.map(m => ({ role: m.role, content: m.content }));
      
      const lastUserMsg = apiMsgList[apiMsgList.length - 1];
      let mentionContexts = [];
      if (lastUserMsg && lastUserMsg.role === 'user') {
        const mentions = lastUserMsg.content.match(/@([a-zA-Z0-9_.-]+)/g) || [];
        for (const m of mentions) {
          const title = m.substring(1).replace(/_/g, ' '); 
          const doc = documents.find(d => 
            d.title.toLowerCase() === title.toLowerCase() || 
            d.title.replace(/\s+/g, '_').toLowerCase() === title.toLowerCase()
          );
          if (doc) {
            mentionContexts.push(`Document "${doc.title}":\n${doc.content}`);
          }
        }
      }

      let systemPrompt = '';
      if (isDocumentOpen && documentContent) {
         systemPrompt += `The user has an opened document named "${documentTitle}". Its contents are:\n\n${documentContent}\n\n`;
      }
      if (mentionContexts.length > 0) {
         systemPrompt += `The user explicitly referenced the following documents in their message using @ mentions:\n\n${mentionContexts.join('\n\n---\n\n')}\n\n`;
      }

      if (systemPrompt) {
         apiMessages = [
           { role: 'system', content: `${systemPrompt}When helping the user, you may refer to this document content.` },
           ...apiMessages
         ];
      }

      const fetchHeaders = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        fetchHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/chat', { 
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages: apiMessages,
          stream: true,
          userId: session?.user?.id || 'guest'
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errText}`);
      }

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
          const cleanLine = line.replace(/^data: /, '').trim();
          if (!cleanLine || cleanLine === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(cleanLine);
            const chunk = parsed.choices?.[0]?.delta?.content || '';
            if (chunk) {
              fullAssistantMessage += chunk;
              setMessages(prev => {
                const msgs = [...prev];
                const lastIdx = msgs.length - 1;
                msgs[lastIdx] = { 
                   ...msgs[lastIdx], 
                   content: msgs[lastIdx].content + chunk 
                };
                return msgs;
              });
            }
          } catch (e) {
            // ignore partial JSON
          }
        }
      }

      if (sessionId && fullAssistantMessage) {
        await storage.saveMessage(session, sessionId, 'assistant', fullAssistantMessage);
      }
    } catch (apiError) {
      console.error("API Error:", apiError);
      setMessages(prev => {
        const msgs = [...prev];
        const lastIdx = msgs.length - 1;
        msgs[lastIdx] = {
           ...msgs[lastIdx],
           content: msgs[lastIdx].content + "\n\n*(Error connecting to AI backend)*"
        };
        return msgs;
      });
    } finally {
      setIsGenerating(false);
    }
  }, [session]);

  const handleSend = useCallback(async (userText, documents, isDocumentOpen, documentContent, documentTitle) => {
    if (!session && messages.length >= 10) {
      alert("Guest Mode Limit Reached. Please sign up to continue chatting!");
      return;
    }

    let sessionId = currentSessionId;
    
    try {
      if (!sessionId) {
        const title = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
        const newSess = await storage.createSession(session, title);
        if (newSess) {
          sessionId = newSess.id;
          setCurrentSessionId(sessionId);
          setSessions(prev => [{ ...newSess, messages: [] }, ...prev]);
        }
      }

      const hasDoc = isDocumentOpen && documentContent;
      const displayUserText = hasDoc ? `${userText}\n\n*[📄 Attached Document: ${documentTitle || 'Untitled'}]*` : userText;

      if (sessionId) {
        await storage.saveMessage(session, sessionId, 'user', displayUserText);
      }
      
      const newMessages = [...messages, { role: 'user', content: displayUserText }];
      setMessages(newMessages);
      
      await fetchAiResponse(newMessages, sessionId, documents, isDocumentOpen, documentContent, documentTitle);
      
    } catch (dbError) {
      console.error("Database/Storage error:", dbError);
      alert(`Failed to save message: ${dbError.message}. If you just signed in, make sure you ran the Supabase SQL from HOSTING_GUIDE.md!`);
    }
  }, [currentSessionId, messages, fetchAiResponse, session]);

  const handleRegenerate = useCallback(async (index, documents, isDocumentOpen, documentContent, documentTitle) => {
    if (isGenerating) return;
    const userMsgIndex = index - 1;
    if (userMsgIndex < 0) return;
    
    const msgList = messages.slice(0, index);
    setMessages(msgList);
    
    await fetchAiResponse(msgList, currentSessionId, documents, isDocumentOpen, documentContent, documentTitle);
  }, [isGenerating, messages, currentSessionId, fetchAiResponse]);

  return {
    messages,
    setMessages,
    isGenerating,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat,
    loadSession,
    deleteSession,
    handleSend,
    handleRegenerate
  };
}
