'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Auth/AuthProvider';
import { uploadResume } from '@/utils/authClient';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    education_level: '', current_job_role: '', career_goal: '',
    interests: '', experience_level: '', skills: '',
    preferred_language: 'English', course_duration_days: '30',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validateResumeFile = (file) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) { setError('Only PDF and DOCX files are allowed.'); return false; }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be under 5MB.'); return false; }
    return true;
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && validateResumeFile(file)) { setResumeFile(file); setError(''); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && validateResumeFile(file)) { setResumeFile(file); setError(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        metadata: {
          education_level: form.education_level,
          current_job_role: form.current_job_role,
          career_goal: form.career_goal,
          interests: form.interests,
          experience_level: form.experience_level,
          skills: form.skills,
          preferred_language: form.preferred_language,
          course_duration_days: parseInt(form.course_duration_days) || 30,
        },
      });

      // Upload resume after signup if provided
      if (resumeFile && result.user) {
        try { await uploadResume(result.user.id, resumeFile); } catch (e) { console.warn('Resume upload skipped:', e.message); }
      }

      // Check if we got a session (email confirmation is OFF) or not (email confirmation is ON)
      if (result.session) {
        // Immediate login — redirect to dashboard
        router.push('/dashboard');
      } else if (result.user) {
        // User created but needs email confirmation
        setError('');
        alert('✅ Account created! Please check your email to confirm, then login. If you want instant signup, disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email.');
        router.push('/auth/login');
      }
    } catch (err) {
      setError(err?.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try { await signInWithGoogle(); } catch (err) { setError(err?.message || 'Google sign-in failed.'); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <main className="glass-panel" style={{ width: '100%', maxWidth: 880, margin: '2rem', padding: '2.5rem', borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Create your account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)' }}>
            Sign up to save your progress and personalized roadmap
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 12, marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error-red)', fontSize: '0.9rem', textAlign: 'center', maxWidth: 440, margin: '0 auto 1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 440, margin: '0 auto', width: '100%' }}>
          <FloatingInput label="Full Name" value={form.fullName} onChange={v => handleChange('fullName', v)} required autoComplete="name" />
          <FloatingInput label="Email Address" value={form.email} onChange={v => handleChange('email', v)} type="email" required autoComplete="email" />
          <FloatingInput label="Password" value={form.password} onChange={v => handleChange('password', v)} type="password" required autoComplete="new-password" minLength={6} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Career Info</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          </div>

          <FloatingInput label="Education level" value={form.education_level} onChange={v => handleChange('education_level', v)} />
          <FloatingInput label="Current or previous role" value={form.current_job_role} onChange={v => handleChange('current_job_role', v)} />
          <FloatingInput label="Career goal" value={form.career_goal} onChange={v => handleChange('career_goal', v)} />
          <FloatingInput label="Interests" value={form.interests} onChange={v => handleChange('interests', v)} placeholder="e.g. web development, AI, cybersecurity" />

          <div className="input-group-ce">
            <select className="custom-input-ce" value={form.experience_level} onChange={e => handleChange('experience_level', e.target.value)} style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="">Experience level</option>
              <option value="fresher">Fresher / Student</option>
              <option value="junior">Junior (0-2 years)</option>
              <option value="mid">Mid-level (2-5 years)</option>
              <option value="senior">Senior (5+ years)</option>
            </select>
          </div>

          <FloatingInput label="Skills you already have" value={form.skills} onChange={v => handleChange('skills', v)} placeholder="e.g. JavaScript, React, Python" />

          {/* Learning Preferences */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>🎓 Learning Plan</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          </div>

          <div className="input-group-ce">
            <select className="custom-input-ce" value={form.preferred_language} onChange={e => handleChange('preferred_language', e.target.value)} style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="English">🌐 English</option>
              <option value="Hindi">🇮🇳 Hindi</option>
              <option value="Telugu">🇮🇳 Telugu</option>
              <option value="Tamil">🇮🇳 Tamil</option>
              <option value="Kannada">🇮🇳 Kannada</option>
              <option value="Bengali">🇮🇳 Bengali</option>
              <option value="Marathi">🇮🇳 Marathi</option>
              <option value="Gujarati">🇮🇳 Gujarati</option>
              <option value="Malayalam">🇮🇳 Malayalam</option>
              <option value="Spanish">🇪🇸 Spanish</option>
              <option value="French">🇫🇷 French</option>
              <option value="German">🇩🇪 German</option>
              <option value="Japanese">🇯🇵 Japanese</option>
            </select>
          </div>

          <div className="input-group-ce">
            <select className="custom-input-ce" value={form.course_duration_days} onChange={e => handleChange('course_duration_days', e.target.value)} style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="7">⚡ 7 Days — Speed Sprint</option>
              <option value="14">🏃 14 Days — Quick Start</option>
              <option value="30">📅 30 Days — Standard Plan</option>
              <option value="60">📚 60 Days — Deep Dive</option>
              <option value="90">🎯 90 Days — Mastery Program</option>
            </select>
          </div>

          {/* Resume Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.25rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>📄 Resume (Optional)</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '1.5rem', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
              border: `2px dashed ${dragOver ? 'var(--primary-blue)' : resumeFile ? 'var(--success-green)' : 'var(--border-color)'}`,
              background: dragOver ? 'var(--primary-blue-light)' : resumeFile ? 'rgba(16, 185, 129, 0.05)' : 'var(--input-bg)',
              transition: 'all 0.2s ease',
            }}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx" style={{ display: 'none' }} />
            {resumeFile ? (
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>✅</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--success-green)' }}>{resumeFile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{(resumeFile.size / 1024).toFixed(0)} KB • Click to replace</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>📤</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Upload Resume</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Drag & drop or click • PDF, DOCX • Max 5MB</div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-ce btn-ce-primary btn-ce-large btn-ce-full" disabled={loading || !form.email.trim() || !form.password} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating...' : 'Create account & get started'}
          </button>
        </form>

        <div style={{ textAlign: 'center', maxWidth: 440, margin: '1.25rem auto 0', width: '100%' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '1rem' }}>or continue with</span>
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
          <div style={{ marginTop: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Already have an account? </span>
            <button onClick={() => router.push('/auth/login')} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit' }}>Login</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function FloatingInput({ label, value, onChange, type = 'text', required, autoComplete, minLength, placeholder }) {
  return (
    <div className="input-group-ce">
      <input type={type} className="custom-input-ce" placeholder={placeholder || ' '} value={value}
        onChange={e => onChange(e.target.value)} required={required} autoComplete={autoComplete} minLength={minLength} />
      <label className={`floating-label-ce ${value ? 'active' : ''}`}>{label}</label>
    </div>
  );
}
