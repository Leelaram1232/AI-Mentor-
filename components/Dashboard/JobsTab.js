'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { getJobListings, applyToJob, getApplications, saveOpportunity, getSavedOpportunities, removeSavedOpportunity, getDefaultResume, calculateMatchScore, hasApplied, isJobSaved, scrapeJobs } from '@/utils/authClient';

const JOB_TYPES = ['all', 'internship', 'full-time', 'remote', 'part-time', 'contract'];
const STATUS_COLORS = {
  applied: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: '📤 Applied' },
  under_review: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: '🔍 Under Review' },
  interview_scheduled: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', label: '📅 Interview' },
  accepted: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: '✅ Accepted' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: '❌ Rejected' },
  withdrawn: { bg: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', label: '↩️ Withdrawn' },
};

export default function JobsTab() {
  const { user, profile } = useAuth();
  const [section, setSection] = useState('discover');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', search: '' });
  const [applyingTo, setApplyingTo] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [scraping, setScraping] = useState(false);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [j, a, s, r] = await Promise.allSettled([
        getJobListings(), getApplications(user.id), getSavedOpportunities(user.id), getDefaultResume(user.id),
      ]);
      setJobs(j.status === 'fulfilled' ? j.value : []);
      setApplications(a.status === 'fulfilled' ? a.value : []);
      setSavedJobs(s.status === 'fulfilled' ? s.value : []);
      setResume(r.status === 'fulfilled' ? r.value : null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredJobs = jobs.filter(j => {
    if (filter.type !== 'all' && j.job_type !== filter.type) return false;
    if (filter.search && !`${j.title} ${j.company_name} ${j.required_skills}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  }).map(j => ({ ...j, matchScore: calculateMatchScore(profile, j) }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const appliedIds = new Set(applications.map(a => a.job_id));
  const savedIds = new Set(savedJobs.map(s => s.job_id));

  const handleApply = async (job) => {
    try {
      const score = calculateMatchScore(profile, job);
      await applyToJob(user.id, job.id, {
        resumeUrl: resume?.file_url || profile?.resume_url || '',
        coverLetter,
        portfolioUrl: profile?.portfolio_url || '',
        matchScore: score,
      });
      setCoverLetter('');
      setApplyingTo(null);
      await loadData();
    } catch (e) {
      if (e.code === '23505') alert('You have already applied to this job.');
      else console.error(e);
    }
  };

  const handleSave = async (jobId) => {
    try {
      if (savedIds.has(jobId)) await removeSavedOpportunity(user.id, jobId);
      else await saveOpportunity(user.id, jobId);
      await loadData();
    } catch (e) { console.error(e); }
  };

  const handleScrape = async () => {
    if (!filter.search) { alert("Please enter a job title or keyword in the search bar first."); return; }
    setScraping(true);
    try {
      await scrapeJobs(filter.search, profile?.location || 'India', 5);
      alert(`Scraping triggered for "${filter.search}". Refresh in a few seconds.`);
      setTimeout(loadData, 3000); 
    } catch (e) {
      alert("Failed to trigger scraping. Is the Python backend running?");
    }
    setScraping(false);
  };

  const sections = [
    { id: 'discover', l: '🔍 Discover' }, { id: 'saved', l: '🔖 Saved' },
    { id: 'applications', l: '📋 Applications' }, { id: 'internships', l: '🎓 Internships' },
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <div className="ai-loader" style={{ width: 60, height: 60, margin: '0 auto' }}>
        <div className="ai-ring"></div><div className="ai-ring"></div><div className="ai-ring"></div>
        <span className="ai-brain" style={{ fontSize: '1.2rem' }}>💼</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 2 }}>💼 Jobs & Internships</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          {jobs.length} opportunities • {applications.length} applied • {savedJobs.length} saved
        </p>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <span key={s.id} className={`skill-pill ${section === s.id ? 'selected' : ''}`}
            onClick={() => setSection(s.id)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>{s.l}</span>
        ))}
      </div>

      {/* ────── DISCOVER ────── */}
      {section === 'discover' && (
        <>
          {/* Filters */}
          <div className="glass-card" style={{ borderRadius: 14, padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="custom-input-ce"
              placeholder="🔍 Search jobs, skills, companies..."
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              style={{ flex: 1, minWidth: 200, padding: '0.65rem 1rem', fontSize: '0.9rem' }}
            />
            <button 
              className="btn-ce btn-ce-primary" 
              onClick={handleScrape} 
              disabled={scraping}
              style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            >
              {scraping ? '⏳ Scraping...' : '🕷️ Scrape Real Jobs'}
            </button>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {JOB_TYPES.map(t => (
                <span key={t} className={`skill-pill ${filter.type === t ? 'selected' : ''}`}
                  onClick={() => setFilter(f => ({ ...f, type: t }))}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
                  {t === 'all' ? '🌐 All' : t}
                </span>
              ))}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="glass-card" style={{ borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
              <p style={{ color: 'var(--text-secondary)' }}>No jobs match your criteria. Try adjusting filters.</p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <JobCard key={job.id} job={job} applied={appliedIds.has(job.id)} saved={savedIds.has(job.id)}
                onApply={() => {
                  if (resume || profile?.resume_url) handleApply(job);
                  else setApplyingTo(job);
                }}
                onSave={() => handleSave(job.id)} />
            ))
          )}
        </>
      )}

      {/* ────── SAVED ────── */}
      {section === 'saved' && (
        savedJobs.length === 0 ? (
          <div className="glass-card" style={{ borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔖</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Saved Opportunities</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Save jobs you're interested in to review later.</p>
          </div>
        ) : savedJobs.map(s => (
          <JobCard key={s.id} job={s.job_listings} saved={true} applied={appliedIds.has(s.job_id)}
            onApply={() => {
              if (resume || profile?.resume_url) handleApply(s.job_listings);
              else setApplyingTo(s.job_listings);
            }}
            onSave={() => handleSave(s.job_id)} />
        ))
      )}

      {/* ────── APPLICATIONS ────── */}
      {section === 'applications' && (
        applications.length === 0 ? (
          <div className="glass-card" style={{ borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Applications Yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Apply to jobs to start tracking your applications.</p>
          </div>
        ) : (
          <>
            {/* Status Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
              {Object.entries(STATUS_COLORS).map(([key, val]) => {
                const count = applications.filter(a => a.status === key).length;
                if (count === 0) return null;
                return (
                  <div key={key} style={{ padding: '0.75rem', borderRadius: 12, background: val.bg, textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: val.color }}>{count}</div>
                    <div style={{ fontSize: '0.7rem', color: val.color }}>{val.label}</div>
                  </div>
                );
              })}
            </div>

            {applications.map(app => {
              const job = app.job_listings;
              const status = STATUS_COLORS[app.status] || STATUS_COLORS.applied;
              return (
                <div key={app.id} className="glass-card" style={{ borderRadius: 14, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{job?.title || 'Unknown'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{job?.company_name} • {job?.location}</div>
                    </div>
                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: 8, background: status.bg, color: status.color, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    <span>📅 Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                    {app.match_score > 0 && <span>🎯 {app.match_score}% match</span>}
                    {app.resume_url && <span>📄 Resume attached</span>}
                  </div>
                </div>
              );
            })}
          </>
        )
      )}

      {/* ────── INTERNSHIPS ────── */}
      {section === 'internships' && (() => {
        const internships = jobs.filter(j => j.job_type === 'internship').map(j => ({ ...j, matchScore: calculateMatchScore(profile, j) })).sort((a, b) => b.matchScore - a.matchScore);
        return internships.length === 0 ? (
          <div className="glass-card" style={{ borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎓</div>
            <p style={{ color: 'var(--text-secondary)' }}>No internships available right now.</p>
          </div>
        ) : internships.map(job => (
          <JobCard key={job.id} job={job} applied={appliedIds.has(job.id)} saved={savedIds.has(job.id)}
            onApply={() => {
              if (resume || profile?.resume_url) handleApply(job);
              else setApplyingTo(job);
            }}
            onSave={() => handleSave(job.id)} />
        ));
      })()}

      {/* ────── APPLY MODAL ────── */}
      {applyingTo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 480, borderRadius: 20, padding: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Apply to {applyingTo.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{applyingTo.company_name}</p>

            {!resume && !profile?.resume_url && (
              <div style={{ padding: '1rem', borderRadius: 12, border: '2px dashed var(--border-color)', textAlign: 'center', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--warning-amber)', fontSize: '0.9rem', fontWeight: 600 }}>⚠️ No resume uploaded</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Upload a resume in your Profile to auto-attach it.</p>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Cover Letter (optional)</label>
              <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                placeholder="Why are you interested in this role?"
                rows={4} style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', resize: 'vertical', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-ce btn-ce-primary" style={{ flex: 1 }} onClick={() => handleApply(applyingTo)}>Submit Application</button>
              <button className="btn-ce btn-ce-secondary" onClick={() => { setApplyingTo(null); setCoverLetter(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── JOB CARD COMPONENT ──────────────────────────────────────────────────────

function JobCard({ job, applied, saved, onApply, onSave }) {
  if (!job) return null;
  const skills = (job.required_skills || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="glass-card" style={{ borderRadius: 16, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      {/* Match Score Badge */}
      {job.matchScore > 0 && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 44, height: 44, borderRadius: '50%',
          background: job.matchScore >= 70 ? 'linear-gradient(135deg, #10b981, #059669)' : job.matchScore >= 40 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6b7280, #4b5563)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '0.7rem',
        }}>
          {job.matchScore}%
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '2rem', flexShrink: 0 }}>{job.company_logo_url || '🏢'}</div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: job.matchScore > 0 ? '3rem' : 0 }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
            <span className={`meta-badge ${job.job_type === 'internship' ? 'beginner' : job.job_type === 'remote' ? 'intermediate' : 'advanced'}`} style={{ fontSize: '0.65rem' }}>
              {job.job_type}
            </span>
            {job.category && <span style={{ fontSize: '0.65rem', color: 'var(--primary-blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{job.category}</span>}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 2 }}>{job.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{job.company_name}</div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
            {job.location && <span>📍 {job.location}</span>}
            {job.salary_range && <span>💰 {job.salary_range}</span>}
            {job.experience_required && <span>📊 {job.experience_required}</span>}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {job.description}
          </p>

          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {skills.slice(0, 6).map((s, i) => (
                <span key={i} className="skill-pill" style={{ cursor: 'default', fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{s}</span>
              ))}
              {skills.length > 6 && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>+{skills.length - 6}</span>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {applied ? (
              <span style={{ padding: '0.4rem 0.85rem', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                ✅ Applied
              </span>
            ) : (
              <button className="btn-ce btn-ce-primary" onClick={onApply} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                Apply Now →
              </button>
            )}
            <button className="btn-ce btn-ce-secondary" onClick={onSave} style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', minWidth: 0 }}>
              {saved ? '❤️' : '🤍'}
            </button>
            {job.application_url && (
              <a href={job.application_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn-ce btn-ce-secondary" style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}>
                  🔗 Source
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
