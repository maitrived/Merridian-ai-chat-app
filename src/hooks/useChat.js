import { useState, useCallback, useEffect } from 'react';
import { storage } from '../lib/storage';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(session) {
  const email = session?.user?.email?.toLowerCase();
  return !!email && ADMIN_EMAILS.includes(email);
}

// Messages shown to the developer/admin — technical, mention your own API usage.
function adminError(status) {
  switch (status) {
    case 503:
      return "**[Admin] Gemini is overloaded (503).**\n\nGoogle's shared servers are at capacity. This is not caused by your API usage or quota. Retried 3 times automatically. Try again in a few minutes, or switch to a less busy model.";
    case 429:
      return "**[Admin] Your Gemini quota is exhausted (429).**\n\nYour API key has hit its per-minute or daily limit. Wait for the reset, or upgrade the plan in Google AI Studio.";
    case 401:
    case 403:
      return "**[Admin] Gemini rejected your API key.**\n\nCheck that `GEMINI_API_KEY` is set correctly in Vercel → Settings → Environment Variables, then redeploy.";
    case 500:
      return "**[Admin] Server error (500).**\n\nCheck Vercel → Logs for details. If the message is 'Gemini API Key not configured', set `GEMINI_API_KEY` in Vercel.";
    default:
      return `**[Admin] Request failed${status ? ` (${status})` : ''}.**\n\nThe /api/chat function couldn't be reached. Check the Vercel deployment status and logs.`;
  }
}

// Messages shown to all other users — no internal details.
function userError(status) {
  switch (status) {
    case 503:
      return "**Merridian is experiencing high demand right now.**\n\nPlease try again in a few minutes. If this keeps happening, please contact the admin.";
    case 429:
      return "**Merridian has reached its usage limit for now.**\n\nPlease try again later. If this keeps happening, please contact the admin.";
    default:
      return "**Something went wrong while generating a response.**\n\nPlease try again shortly. If the problem continues, please contact the admin.";
  }
}

function explainError(status, session) {
  return isAdmin(session) ? adminError(status) : userError(status);
}

export function useChat(session, isGuest) {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    if (!session && !isGuest) return;
    async function fetchSessions() {
      try {
        const sessionData = await storage.getSessions(session);
        if (sessionData) {
          setSessions(sessionData);
          // Restore the last active session after a page reload
          const savedId = localStorage.getItem('merridian_active_session_id');
          if (savedId) {
            const found = sessionData.find(s => s.id === savedId);
            if (found) {
              setMessages(found.messages);
              setCurrentSessionId(found.id);
            }
          }
        }
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
    localStorage.removeItem('merridian_active_session_id');
  }, []);

  const loadSession = useCallback((id) => {
    const s = sessions.find(s => s.id === id);
    if (s) {
      setMessages(s.messages);
      setCurrentSessionId(id);
      localStorage.setItem('merridian_active_session_id', id);
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
    let success = false;

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
        const err = new Error(`Server returned ${response.status}: ${errText}`);
        err.status = response.status;
        throw err;
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
                   content: fullAssistantMessage 
                };
                return msgs;
              });
            }
          } catch (e) {
            // ignore partial JSON
          }
        }
      }

      if (fullAssistantMessage) {
        success = true;
      }
    } catch (apiError) {
      console.error("API Error:", apiError);
      setMessages(prev => {
        const msgs = [...prev];
        const lastIdx = msgs.length - 1;
        msgs[lastIdx] = {
           ...msgs[lastIdx],
           content: (msgs[lastIdx].content ? msgs[lastIdx].content + "\n\n" : "") + explainError(apiError.status, session)
        };
        return msgs;
      });
    } finally {
      setIsGenerating(false);
    }
    return { success, assistantMessage: fullAssistantMessage };
  }, [session]);

  const handleSend = useCallback(async (userText, documents, isDocumentOpen, documentContent, documentTitle) => {
    if (!session && messages.length >= 10) {
      alert("Guest Mode Limit Reached. Please sign up to continue chatting!");
      return;
    }

    let sessionId = currentSessionId;
    let isNewSession = false;
    
    try {
      if (!sessionId) {
        const title = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
        const newSess = await storage.createSession(session, title);
        if (newSess) {
          sessionId = newSess.id;
          isNewSession = true;
          setCurrentSessionId(sessionId);
          localStorage.setItem('merridian_active_session_id', sessionId);
          setSessions(prev => [{ ...newSess, messages: [] }, ...prev]);
        }
      }

      const hasDoc = isDocumentOpen && documentContent;
      const displayUserText = hasDoc ? `${userText}\n\n*[📄 Document "${documentTitle || 'Untitled'}" has been loaded into your system context]*` : userText;
      
      const newMessages = [...messages, { role: 'user', content: displayUserText }];
      setMessages(newMessages);
      
      const { success, assistantMessage } = await fetchAiResponse(newMessages, sessionId, documents, isDocumentOpen, documentContent, documentTitle);

      // Only persist to storage if the AI responded successfully
      if (success && sessionId) {
        await storage.saveMessage(session, sessionId, 'user', displayUserText);
        await storage.saveMessage(session, sessionId, 'assistant', assistantMessage);
      } else if (!success && isNewSession && sessionId) {
        // Roll back the newly created empty session so it doesn't clutter the sidebar
        await storage.deleteSession(session, sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setCurrentSessionId(null);
        localStorage.removeItem('merridian_active_session_id');
      }
      
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
    
    const { success, assistantMessage } = await fetchAiResponse(msgList, currentSessionId, documents, isDocumentOpen, documentContent, documentTitle);
    if (success && currentSessionId) {
      await storage.saveMessage(session, currentSessionId, 'assistant', assistantMessage);
    }
  }, [isGenerating, messages, currentSessionId, fetchAiResponse, session]);

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
