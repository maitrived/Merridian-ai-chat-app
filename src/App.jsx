import { useState, useRef, useEffect, useCallback } from 'react';
import { PanelLeft, Network, Menu } from 'lucide-react';
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

function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

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
  } = useDocuments(session);

  // Chat State
  const {
    messages, setMessages,
    isGenerating, sessions,
    currentSessionId, setCurrentSessionId,
    createNewChat, loadSession, deleteSession,
    handleSend: rawHandleSend, handleRegenerate: rawHandleRegenerate
  } = useChat(session);

  // Canvas State (Base)
  const [globalCanvasId, setGlobalCanvasId] = useState(null);
  const [canvasNodes, setCanvasNodes, onNodesChange] = useNodesState([]);
  const [canvasEdges, setCanvasEdges, onEdgesChange] = useEdgesState([]);

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

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        setIsGuest(false);
        await storage.migrateGuestData(session);
      }
    });

    const handleGuest = () => setIsGuest(true);
    window.addEventListener('continue-as-guest', handleGuest);

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
          setGlobalCanvasId(canvasData.id);
          setCanvasNodes(canvasData.nodes || []);
          setCanvasEdges(canvasData.edges || []);
        } else {
          const newCanvas = await storage.createInitialCanvas(session);
          if (newCanvas) setGlobalCanvasId(newCanvas.id);
        }
      } catch (err) {
        console.error("Storage Error:", err);
      }
    }
    initCanvas();
  }, [session, isGuest, setCanvasNodes, setCanvasEdges]);

  // Save canvas to storage (debounced)
  useEffect(() => {
    if (!globalCanvasId || canvasNodes.length === 0) return;
    const timeoutId = setTimeout(() => {
      storage.updateCanvas(session, globalCanvasId, { nodes: canvasNodes });
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [canvasNodes, globalCanvasId, session]);

  useEffect(() => {
    if (!globalCanvasId || canvasEdges.length === 0) return;
    const timeoutId = setTimeout(() => {
      storage.updateCanvas(session, globalCanvasId, { edges: canvasEdges });
    }, 1000);
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

  if (!session && !isGuest) {
    return <Auth />;
  }

  return (
    <div className="app-container">
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
          <DocumentPanel 
            documentTitle={documentTitle}
            setDocumentTitle={setDocumentTitle}
            documentContent={documentContent}
            setDocumentContent={setDocumentContent}
            downloadDocument={downloadDocument}
            handleToggleDocument={handleToggleDocument}
          />
        )}

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
