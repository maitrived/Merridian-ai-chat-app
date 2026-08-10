/**
 * Auth.jsx — Drop-in Login / Sign-Up / Forgot Password component
 *
 * REQUIREMENTS
 * ────────────
 *  npm install @supabase/supabase-js lucide-react
 *
 * USAGE
 * ─────
 *  import Auth from './auth-module/components/Auth';
 *
 *  // Render when the user is not signed in:
 *  if (!session) return <Auth />;
 *
 * GUEST MODE
 * ──────────
 *  The component fires a CustomEvent 'continue-as-guest' on window.
 *  Listen for it in your app root to enter guest mode:
 *
 *    window.addEventListener('continue-as-guest', () => setIsGuest(true));
 *
 * ENVIRONMENT VARIABLES  (.env / .env.local)
 * ────────────────────────────────────────────
 *  VITE_SUPABASE_URL=https://your-project.supabase.co
 *  VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 *  For CRA / Next.js replace VITE_ prefix with REACT_APP_ / NEXT_PUBLIC_
 *  and update lib/supabaseClient.js accordingly.
 */

import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, ArrowRight, UserPlus, LogIn, Key } from 'lucide-react';
import './Auth.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showSignUpSuccess, setShowSignUpSuccess] = useState(false);
  const [showForgotSuccess, setShowForgotSuccess] = useState(false);
  const submitting = useRef(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;

        // Supabase identity check: if user already exists it returns a user
        // with empty identities array instead of an error.
        if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
          throw new Error(
            'This email has already been used to sign up. Please try signing in instead or use a different email.'
          );
        }

        setShowSignUpSuccess(true);

      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setShowForgotSuccess(true);
      }

    } catch (err) {
      console.error('[Auth] error:', err);
      let friendlyMessage = err.message;
      const lowerMsg = friendlyMessage.toLowerCase();

      if (
        lowerMsg.includes('already registered') ||
        lowerMsg.includes('already exists') ||
        lowerMsg.includes('already in use') ||
        lowerMsg.includes('user_already_exists')
      ) {
        friendlyMessage =
          'This email has already been used to sign up. Please try signing in instead or use a different email.';
      } else if (
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('60 seconds') ||
        lowerMsg.includes('rate_limit')
      ) {
        friendlyMessage =
          'For security, Supabase limits how often you can request emails. Please wait 60 seconds before trying again.';
      }

      setError(friendlyMessage);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const isSignUp = mode === 'signup';

  return (
    <div className={`auth-overlay ${isSignUp ? 'signup-mode' : 'signin-mode'}`}>
      <div className="auth-card">
        {/* ── Header ── */}
        <div className="auth-header">
          <div className="auth-logo">
            {mode === 'signup' ? (
              <UserPlus size={24} />
            ) : mode === 'forgot' ? (
              <Key size={24} />
            ) : (
              <LogIn size={24} />
            )}
          </div>
          <h1>
            {mode === 'signup'
              ? 'Create Account'
              : mode === 'forgot'
              ? 'Reset Password'
              : 'Welcome'}
          </h1>
          <p>
            {mode === 'signup'
              ? 'Sign up to get started'
              : mode === 'forgot'
              ? 'Enter your email to receive a password reset link'
              : 'Sign in to access your account'}
          </p>
        </div>

        {/* ── Error banner ── */}
        {error && <div className="auth-error">{error}</div>}

        {/* ── Form ── */}
        <form onSubmit={handleAuth} className="auth-form">
          <div className="input-group">
            <label htmlFor="am-email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="am-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="am-password">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setError(null); setMode('forgot'); }}
                    className="text-btn"
                    style={{ padding: 0, fontSize: '0.75rem', fontWeight: 550, color: '#005cba', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="am-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? 'Processing...'
              : mode === 'signup'
              ? 'Sign Up'
              : mode === 'forgot'
              ? 'Send Reset Link'
              : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* ── Footer links ── */}
        <div className="auth-footer">
          {mode === 'forgot' ? (
            <button onClick={() => { setError(null); setMode('signin'); }} className="text-btn">
              Back to Sign In
            </button>
          ) : (
            <button
              onClick={() => { setError(null); setMode(isSignUp ? 'signin' : 'signup'); }}
              className="text-btn"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          )}

          <div style={{ width: '100%', height: '1px', background: '#c1c6d5', opacity: 0.5 }} />

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('continue-as-guest'))}
            className="text-btn guest-btn"
          >
            Continue as Guest
          </button>
        </div>
      </div>

      {/* ── Sign-up success modal ── */}
      {showSignUpSuccess && (
        <div className="am-modal-overlay">
          <div className="am-modal-card">
            <div className="am-modal-header">
              <div className="am-modal-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                📧
              </div>
              <h2>Check Your Email</h2>
            </div>
            <div className="am-modal-content">
              <p>
                A verification link has been sent to your inbox. Please confirm your account, then come
                back here to sign in.
              </p>
            </div>
            <button
              className="am-modal-btn"
              style={{ background: '#8b5cf6', boxShadow: '0 4px 14px rgba(139,92,246,0.25)' }}
              onClick={() => { setShowSignUpSuccess(false); setMode('signin'); }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ── Forgot-password success modal ── */}
      {showForgotSuccess && (
        <div className="am-modal-overlay">
          <div className="am-modal-card">
            <div className="am-modal-header">
              <div className="am-modal-icon" style={{ background: 'rgba(0,92,186,0.1)', color: '#005cba' }}>
                📧
              </div>
              <h2>Reset Link Sent</h2>
            </div>
            <div className="am-modal-content">
              <p>
                We've sent a password reset link to your email inbox. Please check your email to
                continue resetting your password.
              </p>
            </div>
            <button
              className="am-modal-btn"
              onClick={() => { setShowForgotSuccess(false); setMode('signin'); }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
