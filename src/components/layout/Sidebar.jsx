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
      </div>
    </aside>
  );
}
