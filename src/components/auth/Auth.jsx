import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Mail, Lock, ArrowRight, Sparkles, UserPlus, LogIn, Key } from 'lucide-react';
import './Auth.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'forgot'
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
        
        // Supabase identity check: if user already exists, it successfully returns user but with empty identities
        if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
          throw new Error('This email has already been used to sign up. Please try signing in instead or use a different email.');
        }
        
        setShowSignUpSuccess(true);
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setShowForgotSuccess(true);
      }
      } catch (err) {
      console.error("Auth error details:", err);
      let friendlyMessage = err.message;
      const lowerMsg = friendlyMessage.toLowerCase();
      if (
        lowerMsg.includes('already registered') || 
        lowerMsg.includes('already exists') || 
        lowerMsg.includes('already in use') ||
        lowerMsg.includes('user_already_exists')
      ) {
        friendlyMessage = 'This email has already been used to sign up. Please try signing in instead or use a different email.';
      } else if (
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('60 seconds') ||
        lowerMsg.includes('rate_limit')
      ) {
        friendlyMessage = 'For security, Supabase limits how often you can request emails. Please wait 60 seconds before trying again.';
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
        <div className="auth-header">
          <div className="auth-logo">
            {mode === 'signup' ? <UserPlus size={24} /> : mode === 'forgot' ? <Key size={24} /> : <LogIn size={24} />}
          </div>
          <h1>{mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome'}</h1>
          <p>{mode === 'signup' ? 'Sign up to start building with AI' : mode === 'forgot' ? 'Enter your email to receive a password reset link' : 'Sign in to access your chats'}</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
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
                <label htmlFor="password">Password</label>
                {mode === 'signin' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setError(null);
                      setMode('forgot');
                    }} 
                    className="text-btn" 
                    style={{ padding: 0, fontSize: '0.75rem', fontWeight: 550, color: 'var(--primary, #005cba)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
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
            {loading ? 'Processing...' : (mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In')}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'forgot' ? (
            <button onClick={() => { setError(null); setMode('signin'); }} className="text-btn">
              Back to Sign In
            </button>
          ) : (
            <button onClick={() => { setError(null); setMode(isSignUp ? 'signin' : 'signup'); }} className="text-btn">
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          )}
          <div style={{ width: '100%', height: '1px', background: 'var(--outline-variant, #c1c6d5)', opacity: 0.5 }}></div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('continue-as-guest'))} 
            className="text-btn guest-btn" 
          >
            Continue as Guest
          </button>
        </div>
      </div>

      {showSignUpSuccess && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card" style={{ maxWidth: '360px' }}>
            <div className="custom-modal-header">
              <div className="custom-modal-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>📧</div>
              <h2 style={{ fontSize: '1.2rem' }}>Check Your Email</h2>
            </div>
            <div className="custom-modal-content" style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              <p>Supabase has sent an email verification link. Please check your email inbox and confirm your account. Once verified, come back here to sign in and access the website.</p>
            </div>
            <button 
              className="custom-modal-btn" 
              style={{ background: '#8b5cf6', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)' }}
              onClick={() => {
                setShowSignUpSuccess(false);
                setMode('signin'); // Redirect to sign in page
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showForgotSuccess && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card" style={{ maxWidth: '360px' }}>
            <div className="custom-modal-header">
              <div className="custom-modal-icon" style={{ background: 'rgba(0, 92, 186, 0.1)', color: '#005cba' }}>📧</div>
              <h2 style={{ fontSize: '1.2rem' }}>Reset Link Sent</h2>
            </div>
            <div className="custom-modal-content" style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              <p>We've sent a password reset link to your email inbox. Please check your email to continue resetting your password.</p>
            </div>
            <button 
              className="custom-modal-btn" 
              onClick={() => {
                setShowForgotSuccess(false);
                setMode('signin'); // Redirect back to sign in page
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
