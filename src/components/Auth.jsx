import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Sparkles } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles className="text-primary" size={24} />
          </div>
          <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isSignUp ? 'Sign up to start building with AI' : 'Sign in to access your chats'}</p>
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

          <div className="input-group">
            <label htmlFor="password">Password</label>
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

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="social-auth">
          <button className="social-btn">
            <Github size={20} />
          </button>
          <button className="social-btn">
            <Chrome size={20} />
          </button>
        </div>

        <div className="auth-footer">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-btn">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          <div style={{ margin: '1rem 0', height: '1px', background: 'var(--outline-variant)', opacity: 0.5 }}></div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('continue-as-guest'))}
            className="text-btn"
            style={{ opacity: 0.7, fontSize: '0.8rem' }}
          >
            Continue as Guest
          </button>
        </div>
      </div>

      <style jsx>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 10, 12, 0.8);
          backdrop-filter: blur(8px);
          z-index: 1000;
          padding: 1rem;
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--surface-container);
          border: 1px solid var(--outline-variant);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          width: 48px;
          height: 48px;
          background: var(--primary-container);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .auth-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--on-surface);
        }

        .auth-header p {
          font-size: 0.9rem;
          color: var(--on-surface-variant);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--on-surface-variant);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--on-surface-variant);
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          background: var(--surface-container-high);
          border: 1px solid var(--outline-variant);
          border-radius: 12px;
          color: var(--on-surface);
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: var(--primary);
          background: var(--surface-container-highest);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
        }

        .auth-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--primary);
          color: var(--on-primary);
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.2s;
          margin-top: 0.5rem;
        }

        .auth-submit:hover {
          opacity: 0.9;
        }

        .auth-submit:active {
          transform: scale(0.98);
        }

        .auth-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-error {
          background: rgba(255, 82, 82, 0.1);
          border: 1px solid rgba(255, 82, 82, 0.2);
          color: #ff5252;
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          gap: 1rem;
        }

        .auth-divider::before, .auth-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--outline-variant);
        }

        .auth-divider span {
          font-size: 0.75rem;
          color: var(--on-surface-variant);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .social-auth {
          display: flex;
          gap: 1rem;
        }

        .social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          background: var(--surface-container-high);
          border: 1px solid var(--outline-variant);
          border-radius: 12px;
          color: var(--on-surface);
          cursor: pointer;
          transition: background 0.2s;
        }

        .social-btn:hover {
          background: var(--surface-container-highest);
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
        }

        .text-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
        }

        .text-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
