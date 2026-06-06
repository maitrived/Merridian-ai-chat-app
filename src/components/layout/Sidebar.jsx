import React from 'react';
import { MessageSquarePlus, Bot, X, Trash2, FileText, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  createNewChat,
  sessions,
  currentSessionId,
  loadSession,
  deleteSession,
  documents,
  setDocumentTitle,
  setDocumentContent,
  setIsDocumentOpen,
  isCanvasOpen,
  deleteDocument,
  session,
  setIsGuest,
  setIsSettingsOpen
}) {
  if (!isSidebarOpen) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="logo-icon">
            <Bot size={14} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em' }}>Merridian</span>
        </div>
        <button className="icon-btn" onClick={() => setIsSidebarOpen(false)} title="Close Sidebar" style={{ padding: '4px' }}>
          <X size={14} />
        </button>
      </div>
      
      <button className="new-chat-btn" onClick={createNewChat}>
        <MessageSquarePlus size={14} />
        New Chat
      </button>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div className="history-list">
          <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Chats</div>
          {sessions.map(s => (
            <div 
              key={s.id} 
              className={`history-item ${currentSessionId === s.id ? 'active' : ''}`}
              onClick={() => loadSession(s.id)}
            >
              <span className="history-item-title">{s.title}</span>
              <button className="delete-btn" onClick={(e) => deleteSession(e, s.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="history-list" style={{ marginTop: '1rem' }}>
          <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documents</div>
          <div style={{ padding: '0 0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', color: 'var(--on-surface-variant)', opacity: 0.9, lineHeight: 1.4 }}>
            Attach documents and use <strong style={{ color: 'var(--primary)', background: 'var(--surface-container-high)', padding: '0 4px', borderRadius: '4px' }}>@</strong> in the chat to tag them for instant context.
          </div>
          {documents.length === 0 && (
            <div style={{ padding: '0 0.5rem', fontSize: '0.7rem', color: 'var(--on-surface-variant)', opacity: 0.8, fontStyle: 'italic', lineHeight: 1.4 }}>
              No documents added.<br/>Click the 📎 icon in the chat to upload documents to use as reference.
            </div>
          )}
          {documents.map(doc => (
            <div 
              key={doc.id} 
              className="history-item"
              onClick={() => {
                setDocumentTitle(doc.title);
                setDocumentContent(doc.content);
                setIsDocumentOpen(true);
              }}
            >
              <span className="history-item-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={10} style={{ opacity: 0.7 }} />
                {doc.title}
              </span>
              <button className="delete-btn" onClick={async (e) => {
                const wasActive = await deleteDocument(e, doc.id);
                if (wasActive && documentTitle === doc.title) {
                  setDocumentTitle('');
                  setDocumentContent('');
                  setIsDocumentOpen(false);
                }
              }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--outline-variant)' }}>
        {session ? (
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>
              {session.user.email[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</div>
              <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', padding: 0, cursor: 'pointer' }}>Sign Out</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
            <button 
              onClick={() => setIsGuest(false)} 
              className="new-chat-btn"
              style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
            >
              Sign In to Save
            </button>
          </div>
        )}
        <button 
          className="icon-btn" 
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem', padding: '0 0.5rem' }}
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings size={16} />
          <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>Settings</span>
        </button>

        <div style={{ padding: '0.6rem 0.5rem 0.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', opacity: 0.85 }}>
            Built by <a href="https://www.linkedin.com/in/maitri-ved/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Maitri Ved</a>
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <a href="https://www.linkedin.com/in/maitri-ved/" target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ color: 'var(--on-surface-variant)', opacity: 0.55, display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0.55}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="https://github.com/maitrived" target="_blank" rel="noopener noreferrer" title="GitHub" style={{ color: 'var(--on-surface-variant)', opacity: 0.55, display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0.55}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
