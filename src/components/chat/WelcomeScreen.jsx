import React from 'react';

export default function WelcomeScreen({ setIsSettingsOpen, setInput }) {
  return (
    <>
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
          <div className="bento-item" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsSettingsOpen(true)}>
            <div style={{ fontSize: '0.95rem', marginBottom: '4px' }}>🛠️</div>
            <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Settings</span>
          </div>
          <div className="bento-item" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => alert("Privacy & Security\n\nYour chats and canvases are encrypted and protected by Row Level Security in Supabase. Only you can access your data.")}>
            <div style={{ fontSize: '0.95rem', marginBottom: '4px' }}>🔒</div>
            <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Privacy</span>
          </div>
        </div>
      </div>
    </>
  );
}
