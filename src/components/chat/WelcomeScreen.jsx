import React, { useState } from 'react';

export default function WelcomeScreen({ setIsSettingsOpen, setInput }) {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <div className="welcome-screen">
        <h1>Ready to build?</h1>
        <p>I'm your AI assistant. I can help with coding, analysis, or just a chat.</p>
        
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
            <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Attach documents to give the AI instant context for your conversation.</p>
          </div>
          <div className="bento-item" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsSettingsOpen(true)}>
            <div style={{ fontSize: '0.95rem', marginBottom: '4px' }}>🛠️</div>
            <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Settings</span>
          </div>
          <div className="bento-item" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsPrivacyOpen(true)}>
            <div style={{ fontSize: '0.95rem', marginBottom: '4px' }}>🔒</div>
            <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Privacy</span>
          </div>
        </div>
      </div>

      {isPrivacyOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsPrivacyOpen(false)}>
          <div className="custom-modal-card" onClick={e => e.stopPropagation()}>
            <div className="custom-modal-header">
              <div className="custom-modal-icon">🔒</div>
              <h2>Privacy & Security</h2>
            </div>
            <div className="custom-modal-content">
              <p>Your chats and canvases are encrypted and protected by Row Level Security in Supabase. Only you can access your data.</p>
            </div>
            <button className="custom-modal-btn" onClick={() => setIsPrivacyOpen(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
