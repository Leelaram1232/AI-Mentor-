'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Auth/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (user && !authLoading) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Login attempt started for:', email);
    const startTime = Date.now();
    try {
      await signIn({ email, password });
      console.log(`Login successful in ${Date.now() - startTime}ms. Redirecting...`);
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try { await signInWithGoogle(); } catch (err) { setError(err?.message || 'Google sign-in failed.'); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <main
        className="glass-panel"
        style={{
          width: '100%', maxWidth: 880, minHeight: 480,
          margin: '2rem', padding: '2.5rem',
          borderRadius: 24, position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)' }}>
            Login to continue your learning journey
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: 12, marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--error-red)', fontSize: '0.9rem', textAlign: 'center', maxWidth: 440, width: '100%',
          }}>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 440, width: '100%' }}
        >
          <div className="input-group-ce">
            <input
              type="email" className="custom-input-ce" placeholder=" "
              value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
            />
            <label className={`floating-label-ce ${email ? 'active' : ''}`}>Email Address</label>
          </div>

          <div className="input-group-ce">
            <input
              type={showPassword ? 'text' : 'password'} className="custom-input-ce" placeholder=" "
              value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
            />
            <label className={`floating-label-ce ${password ? 'active' : ''}`}>Password</label>
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>

          <button
            type="submit"
            className="btn-ce btn-ce-primary btn-ce-large btn-ce-full"
            disabled={loading || !email.trim() || !password}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', maxWidth: 440, width: '100%', marginTop: '1.25rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '1rem' }}>
            or continue with
          </span>
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button className="btn-ce-social" onClick={handleGoogleSignIn} type="button">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Don't have an account? </span>
            <button onClick={() => router.push('/onboarding')} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit' }}>
              Sign up
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
