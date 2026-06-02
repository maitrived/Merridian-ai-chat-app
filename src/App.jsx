import { useState, useRef, useEffect, useCallback } from 'react';
import { PanelLeft, Network, Menu, Lock, Key, ArrowRight } from 'lucide-react';
import { useNodesState, useEdgesState } from '@xyflow/react';

// Components
import CanvasPanel from './components/canvas/CanvasPanel';
import Auth from './components/auth/Auth';
import Sidebar from './components/layout/Sidebar';
import SettingsModal from './components/settings/SettingsModal';
import DocumentPanel from './components/document/DocumentPanel';
import ChatInterface from './components/chat/ChatInterface';

// Hooks
import { useAppLayout } from './hooks/useAppLayout';
import { useDocuments } from './hooks/useDocuments';
import { useChat } from './hooks/useChat';
import { useCanvasAI } from './hooks/useCanvasAI';

// Lib
import { storage } from './lib/storage';
import { supabase } from './lib/supabaseClient';

import './App.css';

function ResetPasswordModal({ onClose }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      await supabase.auth.signOut();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-overlay signin-mode">
        <div className="custom-modal-card" style={{ maxWidth: '360px' }}>
          <div className="custom-modal-header">
            <div className="custom-modal-icon" style={{ background: 'rgba(0, 92, 186, 0.1)', color: '#005cba' }}>✨</div>
            <h2>Password Updated!</h2>
          </div>
          <div className="custom-modal-content">
            <p>Your password has been updated successfully! You can now sign in with your new credentials.</p>
          </div>
          <button 
            className="custom-modal-btn" 
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay signin-mode">
      <div className="auth-card" style={{ maxWidth: '360px', padding: '2.5rem 2rem' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ background: 'var(--primary, #0066cc)' }}>
            <Key size={24} style={{ color: 'white' }} />
          </div>
          <h1>New Password</h1>
          <p>Create a secure new password for your account</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="new-password">New Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);



  // App Layout State
  const {
    isSidebarOpen, setIsSidebarOpen,
    isSettingsOpen, setIsSettingsOpen,
    toastMessage, showToast,
    isDocumentOpen, setIsDocumentOpen,
    isCanvasOpen, setIsCanvasOpen,
    handleToggleSidebar, handleToggleDocument, handleToggleCanvas
  } = useAppLayout();

  // Documents State
  const {
    documents, setDocuments,
    documentTitle, setDocumentTitle,
    documentContent, setDocumentContent,
    handleFileUpload, downloadDocument, deleteDocument
  } = useDocuments(session, isGuest);

  // Chat State
  const {
    messages, setMessages,
    isGenerating, sessions,
    currentSessionId, setCurrentSessionId,
    createNewChat, loadSession, deleteSession,
    handleSend: rawHandleSend, handleRegenerate: rawHandleRegenerate
  } = useChat(session, isGuest);

  // Canvas State (Base)
  const [globalCanvasId, setGlobalCanvasId] = useState(null);
  const [canvasNodes, setCanvasNodes, onNodesChange] = useNodesState([]);
  const [canvasEdges, setCanvasEdges, onEdgesChange] = useEdgesState([]);
  const skipNextSave = useRef(false);

  // Undo / Redo State
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

  const clearCanvas = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the entire canvas? This cannot be undone.")) {
      saveHistory();
      setCanvasNodes([]);
      setCanvasEdges([]);
      if (globalCanvasId) {
        storage.updateCanvas(session, globalCanvasId, { nodes: [], edges: [] });
      }
    }
  }, [saveHistory, setCanvasNodes, setCanvasEdges, globalCanvasId, session]);

  const onNodesChangeWrapped = useCallback((changes) => {
    // Save history only if a node is being removed
    if (changes.some(c => c.type === 'remove')) {
      saveHistory();
    }
    onNodesChange(changes);
  }, [onNodesChange, saveHistory]);

  const onEdgesChangeWrapped = useCallback((changes) => {
    if (changes.some(c => c.type === 'remove')) {
      saveHistory();
    }
    onEdgesChange(changes);
  }, [onEdgesChange, saveHistory]);

  const [docWidth, setDocWidth] = useState(() => {
    const saved = localStorage.getItem('merridian_doc_width');
    return saved !== null ? JSON.parse(saved) : 380;
  });
  const [canvasWidth, setCanvasWidth] = useState(() => {
    const saved = localStorage.getItem('merridian_canvas_width');
    return saved !== null ? JSON.parse(saved) : 600;
  });
  const isResizingDoc = useRef(false);
  const isResizingCanvas = useRef(false);

  useEffect(() => {
    localStorage.setItem('merridian_doc_width', JSON.stringify(docWidth));
  }, [docWidth]);

  useEffect(() => {
    localStorage.setItem('merridian_canvas_width', JSON.stringify(canvasWidth));
  }, [canvasWidth]);

  const stopResizing = useCallback(() => {
    isResizingDoc.current = false;
    isResizingCanvas.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isResizingDoc.current) {
      const newWidth = window.innerWidth - e.clientX - (isCanvasOpen ? canvasWidth : 0);
      if (newWidth > 200 && newWidth < 800) setDocWidth(newWidth);
    }
    if (isResizingCanvas.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < window.innerWidth * 0.8) setCanvasWidth(newWidth);
    }
  }, [isCanvasOpen, canvasWidth]);

  const startResizingDoc = useCallback((e) => {
    isResizingDoc.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }, [handleMouseMove, stopResizing]);

  const startResizingCanvas = useCallback((e) => {
    isResizingCanvas.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }, [handleMouseMove, stopResizing]);

  useEffect(() => {
    return () => stopResizing();
  }, [stopResizing]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('recovery_token')) {
        setShowResetPasswordModal(true);
      }
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('recovery_token')))
      ) {
        // Clear recovery hash/search now that Supabase client has successfully established the session!
        window.history.replaceState(null, '', window.location.pathname);
        setShowResetPasswordModal(true);
        setSession(session);
        return;
      }

      if (event === 'SIGNED_IN') {
        // Check if they arrived via signup verification redirect
        if (hash.includes('type=signup') || search.includes('type=signup') || hash.includes('confirm') || search.includes('confirm')) {
          // Clear confirmation hash/search
          window.history.replaceState(null, '', window.location.pathname);
          setShowVerifiedMessage(true);
          supabase.auth.signOut();
          return;
        }
      }

      setSession(session);
      if (session) {
        setIsGuest(false);
        await storage.migrateGuestData(session);
      } else {
        // Clear all state on sign out
        setMessages([]);
        setSessions([]);
        setDocuments([]);
        setCanvasNodes([]);
        setCanvasEdges([]);
        setCurrentSessionId(null);
        setGlobalCanvasId(null);
      }
    });

    const handleGuest = () => setIsGuest(true);
    window.addEventListener('continue-as-guest', handleGuest);

    // Responsive: auto-close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('continue-as-guest', handleGuest);
    };
  }, []);

  // Fetch initial canvas data
  useEffect(() => {
    if (!session && !isGuest) return;
    async function initCanvas() {
      try {
        const canvasData = await storage.getCanvas(session);
        if (canvasData) {
          skipNextSave.current = true;
          setGlobalCanvasId(canvasData.id);
          setCanvasNodes(canvasData.nodes || []);
          setCanvasEdges(canvasData.edges || []);
        } else {
          const newCanvas = await storage.createInitialCanvas(session);
          if (newCanvas) {
            skipNextSave.current = true;
            setGlobalCanvasId(newCanvas.id);
          }
        }
      } catch (err) {
        console.error("Storage Error:", err);
      }
    }
    initCanvas();
  }, [session, isGuest, setCanvasNodes, setCanvasEdges]);

  // Save canvas to storage (debounced)
  useEffect(() => {
    if (!globalCanvasId) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      storage.updateCanvas(session, globalCanvasId, { nodes: canvasNodes });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [canvasNodes, globalCanvasId, session]);

  useEffect(() => {
    if (!globalCanvasId) return;
    const timeoutId = setTimeout(() => {
      storage.updateCanvas(session, globalCanvasId, { edges: canvasEdges });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [canvasEdges, globalCanvasId, session]);

  // Canvas AI
  const {
    sendToChat,
    sendToCanvas,
    summarizeSelection,
    collapseCluster,
    streamToNode,
    branchOpposite,
    fanOut,
    fillGap
  } = useCanvasAI(
    session,
    canvasNodes, setCanvasNodes,
    canvasEdges, setCanvasEdges,
    setMessages, currentSessionId,
    saveHistory, setIsCanvasOpen
  );

  // Bind Chat context to Chat hook
  const handleSendBound = (text) => rawHandleSend(text, documents, isDocumentOpen, documentContent, documentTitle);
  const handleRegenerateBound = (idx) => rawHandleRegenerate(idx, documents, isDocumentOpen, documentContent, documentTitle);
  const handleFileUploadBound = (e) => handleFileUpload(e, () => {
    setIsDocumentOpen(true);
    if (isSidebarOpen && isCanvasOpen) setIsSidebarOpen(false);
  });

  if (showResetPasswordModal) {
    return <ResetPasswordModal onClose={() => setShowResetPasswordModal(false)} />;
  }

  if (showVerifiedMessage) {
    return (
      <div className="auth-overlay signin-mode">
        <div className="custom-modal-card" style={{ maxWidth: '380px' }}>
          <div className="custom-modal-header">
            <div className="custom-modal-icon" style={{ background: 'rgba(0, 92, 186, 0.1)', color: '#005cba' }}>✨</div>
            <h2>Email Verified!</h2>
          </div>
          <div className="custom-modal-content">
            <p>Your email has been verified successfully! Now you can sign in and access the website.</p>
          </div>
          <button 
            className="custom-modal-btn" 
            onClick={() => setShowVerifiedMessage(false)}
          >
            Proceed to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!session && !isGuest) {
    return <Auth />;
  }

  return (
    <div className="app-container" key={session?.user?.id || (isGuest ? 'guest' : 'auth')}>
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        createNewChat={createNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        loadSession={loadSession}
        deleteSession={deleteSession}
        documents={documents}
        setDocumentTitle={setDocumentTitle}
        setDocumentContent={setDocumentContent}
        setIsDocumentOpen={setIsDocumentOpen}
        isCanvasOpen={isCanvasOpen}
        deleteDocument={deleteDocument}
        session={session}
        setIsGuest={setIsGuest}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      <div className="main-wrapper">
        <main className="main-content">
          <header className="top-nav">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {!isSidebarOpen && (
                <button className="icon-btn" onClick={handleToggleSidebar} title="Open Sidebar">
                  <Menu size={16} />
                </button>
              )}
              <button className="icon-btn" onClick={handleToggleDocument} title="Toggle Document Panel">
                <PanelLeft size={16} />
              </button>
              <button
                className={`icon-btn canvas-toggle-btn ${isCanvasOpen ? 'active' : ''}`}
                onClick={handleToggleCanvas}
                title="Toggle Thinking Canvas"
              >
                <Network size={16} />
              </button>
              <span className="chat-title-text" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : 'New Session'}
              </span>
            </div>
          </header>

          <ChatInterface 
            messages={messages}
            isGenerating={isGenerating}
            handleSend={handleSendBound}
            handleRegenerate={handleRegenerateBound}
            sendToCanvas={sendToCanvas}
            setIsSettingsOpen={setIsSettingsOpen}
            handleFileUpload={handleFileUploadBound}
            documents={documents}
          />
        </main>

        {isDocumentOpen && (
          <>
            <div className="resize-handle vertical" onMouseDown={startResizingDoc} />
            <DocumentPanel 
              width={docWidth}
              documentTitle={documentTitle}
              setDocumentTitle={setDocumentTitle}
              documentContent={documentContent}
              setDocumentContent={setDocumentContent}
              downloadDocument={downloadDocument}
              handleToggleDocument={handleToggleDocument}
            />
          </>
        )}

        {isCanvasOpen && (
          <>
            <div className="resize-handle vertical" onMouseDown={startResizingCanvas} />
            <CanvasPanel
              width={canvasWidth}
              handleToggleCanvas={handleToggleCanvas}
              nodes={canvasNodes}
              edges={canvasEdges}
              onNodesChange={onNodesChangeWrapped}
              onEdgesChange={onEdgesChangeWrapped}
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
              clearCanvas={clearCanvas}
            />
          </>
        )}
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          session={session}
          setIsGuest={setIsGuest}
          setIsSettingsOpen={setIsSettingsOpen}
        />
      )}

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--on-surface)',
          color: 'var(--surface-container)',
          padding: '12px 24px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
