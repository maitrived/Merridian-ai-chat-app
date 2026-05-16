import React from 'react';
import { Settings } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SettingsModal({ session, setIsGuest, setIsSettingsOpen }) {
  return (
    <div className="auth-overlay" onClick={() => setIsSettingsOpen(false)}>
      <div className="auth-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px' }}>
        <div className="auth-header">
          <div className="auth-logo" style={{ background: 'var(--surface-container-high)', width: '40px', height: '40px' }}>
            <Settings size={20} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem' }}>Settings</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ background: 'var(--surface-container-high)', padding: '1rem', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--on-surface)' }}>Account & Data</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
              {session ? `Logged in as ${session.user.email}` : 'Playing as Guest'}
            </p>
            {session ? (
              <button className="auth-submit" style={{ width: '100%', background: 'var(--surface-container-highest)', color: 'var(--on-surface)' }} onClick={() => { supabase.auth.signOut(); setIsSettingsOpen(false); }}>
                Sign Out
              </button>
            ) : (
              <button className="auth-submit" style={{ width: '100%' }} onClick={() => { setIsGuest(false); setIsSettingsOpen(false); }}>
                Sign In
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button className="text-btn" onClick={() => setIsSettingsOpen(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}
