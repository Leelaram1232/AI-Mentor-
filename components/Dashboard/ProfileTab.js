'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Auth/AuthProvider';
import { getBadges, getUserResumes, uploadResume, setDefaultResume, deleteResume } from '@/utils/authClient';

export default function ProfileTab() {
  const router = useRouter();
  const { user, profile, updateProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    full_name: '', bio: '', education_level: '', experience_level: '',
    skills: '', interests: '', career_goal: '', current_job_role: '',
    selected_career_path: '',
    location: '', linkedin_url: '', portfolio_url: '',
    preferred_language: 'English', course_duration_days: '30',
  });
  const [badges, setBadges] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name || '', bio: profile.bio || '',
      education_level: profile.education_level || '', experience_level: profile.experience_level || '',
      skills: profile.skills || '', interests: profile.interests || '',
      career_goal: profile.career_goal || '', current_job_role: profile.current_job_role || '',
      selected_career_path: profile.selected_career_path || '',
      location: profile.location || '', linkedin_url: profile.linkedin_url || '',
      portfolio_url: profile.portfolio_url || '',
      preferred_language: profile.preferred_language || 'English',
      course_duration_days: String(profile.course_duration_days || 30),
    });
  }, [profile]);

  useEffect(() => {
    if (user) {
      getBadges(user.id).then(setBadges).catch(() => {});
      getUserResumes(user.id).then(setResumes).catch(() => {});
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true); setMsg({ type: '', text: '' });
    try { 
      // Ensure numeric fields are cast correctly
      const dataToSave = {
        ...form,
        course_duration_days: parseInt(form.course_duration_days) || 30
      };
      
      await updateProfile(dataToSave); 
      setMsg({ type: 'success', text: 'Profile saved!' }); 
      setTimeout(() => setMsg({ type: '', text: '' }), 3000); 
    }
    catch (e) { setMsg({ type: 'error', text: e?.message || 'Failed to save' }); }
    finally { setSaving(false); }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) { setMsg({ type: 'error', text: 'Only PDF and DOCX files allowed' }); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: 'File must be under 5MB' }); return; }
    setUploading(true);
    try {
      await uploadResume(user.id, file);
      const updated = await getUserResumes(user.id);
      setResumes(updated);
      setMsg({ type: 'success', text: 'Resume uploaded!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (e) { setMsg({ type: 'error', text: e?.message || 'Upload failed' }); }
    finally { setUploading(false); }
  };

  const handleSetDefault = async (resumeId) => {
    try { await setDefaultResume(user.id, resumeId); setResumes(await getUserResumes(user.id)); } catch (e) { console.error(e); }
  };

  const handleDeleteResume = async (resume) => {
    try {
      const path = resume.file_url?.split('/resumes/')[1];
      await deleteResume(user.id, resume.id, path);
      setResumes(await getUserResumes(user.id));
    } catch (e) { console.error(e); }
  };

  const xpProgress = Math.round(((profile?.xp_points || 0) % 100) / 100 * 100);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>User Profile</h2>

      {/* Header Card */}
      <div className="glass-panel" style={{ borderRadius: 20, padding: '2rem 2.5rem', background: 'linear-gradient(135deg, var(--glass-bg), rgba(37, 99, 235, 0.05))' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-blue), var(--blob-2))',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1.5rem', boxShadow: '0 4px 14px var(--primary-blue-glow)',
          }}>
            {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{profile?.full_name || user?.email}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="dashboard-tag" style={{ fontSize: '0.75rem' }}>Level {profile?.level || 1}</span>
              <span className="dashboard-tag tag-secondary" style={{ fontSize: '0.75rem' }}>{profile?.xp_points || 0} XP</span>
              {profile?.career_goal && <span className="dashboard-tag tag-secondary" style={{ fontSize: '0.75rem' }}>{profile.career_goal}</span>}
              {profile?.selected_career_path && profile.selected_career_path !== profile.career_goal && (
                <span className="dashboard-tag tag-secondary" style={{ fontSize: '0.75rem' }} title="Focus from career map">{profile.selected_career_path}</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Progress to Level {(profile?.level || 1) + 1}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{(profile?.xp_points || 0) % 100}/100 XP</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--border-color)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${xpProgress}%`, background: 'linear-gradient(90deg, var(--primary-blue), var(--success-green))', borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🏆 My Badges ({badges.length})</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {badges.map(b => <span key={b.id} className="skill-pill" style={{ cursor: 'default', fontSize: '0.85rem' }}>{b.badge_icon} {b.badge_name}</span>)}
          </div>
        </div>
      )}

      {/* Resume Management */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 700 }}>📄 Resume Management</div>
          <button className="btn-ce btn-ce-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            {uploading ? 'Uploading...' : '+ Upload'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleResumeUpload} accept=".pdf,.doc,.docx" style={{ display: 'none' }} />
        </div>

        {resumes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: 12 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>📤</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No resume uploaded</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Upload PDF or DOCX (max 5MB)</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {resumes.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 12, border: '1px solid var(--border-color)', background: r.is_default ? 'var(--primary-blue-light)' : 'transparent' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.file_name}</span>
                    {r.is_default && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: 6, background: 'var(--primary-blue)', color: '#fff', fontWeight: 700 }}>Default</span>}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                    {r.file_type?.toUpperCase()} • {(r.file_size / 1024).toFixed(0)} KB • {new Date(r.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => window.open(r.file_url, '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem', color: 'var(--primary-blue)' }}>📥</button>
                  {!r.is_default && <button onClick={() => handleSetDefault(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem', color: 'var(--text-secondary)' }}>⭐</button>}
                  <button onClick={() => handleDeleteResume(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem', color: 'var(--error-red)' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '1.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Edit Profile</div>

        {msg.text && (
          <div style={{
            padding: '0.65rem 1rem', borderRadius: 12, marginBottom: '0.75rem',
            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: msg.type === 'success' ? 'var(--success-green)' : 'var(--error-red)', fontSize: '0.9rem',
          }}>{msg.text}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { l: 'Full Name', k: 'full_name' },
            { l: 'Career Goal', k: 'career_goal', p: 'e.g. Full-Stack Developer' },
            { l: 'Career map focus', k: 'selected_career_path', p: 'Role highlighted in your career graph' },
            { l: 'Current Role', k: 'current_job_role', p: 'e.g. Student, Junior Dev' },
            { l: 'Education', k: 'education_level', p: 'e.g. B.Tech, Bootcamp, Self-taught' },
            { l: 'Skills', k: 'skills', p: 'Comma-separated' },
            { l: 'Interests', k: 'interests', p: 'Comma-separated' },
            { l: 'Location', k: 'location', p: 'e.g. Bangalore, India' },
            { l: 'LinkedIn URL', k: 'linkedin_url', p: 'https://linkedin.com/in/...' },
            { l: 'Portfolio URL', k: 'portfolio_url', p: 'https://...' },
          ].map(f => (
            <div key={f.k} className="input-group-ce">
              <input className="custom-input-ce" placeholder={f.p || ' '} value={form[f.k]}
                onChange={e => setForm(prev => ({ ...prev, [f.k]: e.target.value }))} />
              <label className={`floating-label-ce ${form[f.k] ? 'active' : ''}`}>{f.l}</label>
            </div>
          ))}
          <div className="input-group-ce">
            <select className="custom-input-ce" value={form.experience_level} onChange={e => setForm(p => ({ ...p, experience_level: e.target.value }))} style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="">Experience level</option>
              <option value="fresher">Fresher / Student</option>
              <option value="junior">Junior (0-2 years)</option>
              <option value="mid">Mid-level (2-5 years)</option>
              <option value="senior">Senior (5+ years)</option>
            </select>
          </div>
          <div className="input-group-ce">
            <textarea className="custom-input-ce" placeholder=" " value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={4} style={{ resize: 'vertical' }} />
            <label className={`floating-label-ce ${form.bio ? 'active' : ''}`}>About you (from onboarding)</label>
          </div>

          {/* Learning Preferences */}
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>🎓 Learning Preferences</div>
          <div className="input-group-ce">
            <select className="custom-input-ce" value={form.preferred_language} onChange={e => setForm(p => ({ ...p, preferred_language: e.target.value }))} style={{ appearance: 'none', cursor: 'pointer' }}>
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
            <select className="custom-input-ce" value={form.course_duration_days} onChange={e => setForm(p => ({ ...p, course_duration_days: e.target.value }))} style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="7">⚡ 7 Days — Speed Sprint</option>
              <option value="14">🏃 14 Days — Quick Start</option>
              <option value="30">📅 30 Days — Standard Plan</option>
              <option value="60">📚 60 Days — Deep Dive</option>
              <option value="90">🎯 90 Days — Mastery Program</option>
            </select>
          </div>

          <button className="btn-ce btn-ce-primary btn-ce-full" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
      {/* Logout */}
      <button 
        className="btn-ce btn-ce-secondary btn-ce-full" 
        onClick={async () => { 
          try {
            await signOut();
            window.location.href = '/'; // Hard redirect to clear all states/cache
          } catch (e) {
            console.error('Logout error:', e);
            window.location.href = '/'; // Redirect anyway
          }
        }}
        style={{ color: 'var(--error-red)', borderColor: 'var(--error-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout Account
      </button>
    </div>
  );
}
