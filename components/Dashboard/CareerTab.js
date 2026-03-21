'use client';

import { useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { addXP } from '@/utils/authClient';
import { generateResume, generateInterviewQuestion, evaluateInterviewAnswer, getProjectRecommendations, getJobRecommendations, getCareerInsights } from '@/utils/groqApi';

export default function CareerTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [section, setSection] = useState('insights');
  const [insights, setInsights] = useState(null);
  const [resume, setResume] = useState(null);
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [interview, setInterview] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [prevQs, setPrevQs] = useState([]);
  const [ld, setLd] = useState({});
  const setL = (k, v) => setLd(p => ({ ...p, [k]: v }));

  const sections = [
    { id: 'insights', l: '📊 Insights' }, { id: 'resume', l: '📝 Resume' },
    { id: 'projects', l: '🛠️ Projects' }, { id: 'jobs', l: '💼 Jobs' }, { id: 'interview', l: '🎯 Interview' },
  ];

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>💼 Career</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <span key={s.id} className={`skill-pill ${section === s.id ? 'selected' : ''}`}
            onClick={() => setSection(s.id)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>{s.l}</span>
        ))}
      </div>

      {/* Insights */}
      {section === 'insights' && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '2rem' }}>
          {!insights ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📊</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Career Insights</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1rem' }}>AI-powered insights about salary, demand, and technologies.</p>
              <button className="btn-ce btn-ce-primary" disabled={ld.insights} onClick={async () => { setL('insights', true); try { setInsights(await getCareerInsights(profile?.career_goal)); } catch (e) {} setL('insights', false); }}>
                {ld.insights ? 'Loading...' : 'Load Insights'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[{ i: '📈', l: 'Demand', v: insights.demand_level?.toUpperCase() }, { i: '🚀', l: 'Growth', v: insights.growth_rate }, { i: '🏠', l: 'Remote', v: insights.remote_friendly ? 'Yes' : 'No' }].map((c, i) => (
                  <div key={i} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 2 }}>{c.i}</div>
                    <div style={{ fontWeight: 800 }}>{c.v}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{c.l}</div>
                  </div>
                ))}
              </div>
              {insights.trending_technologies?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>🔥 Trending</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {insights.trending_technologies.map((t, i) => <span key={i} className="skill-pill" style={{ cursor: 'default', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>{t}</span>)}
                  </div>
                </div>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{insights.industry_outlook}</p>
            </div>
          )}
        </div>
      )}

      {/* Resume */}
      {section === 'resume' && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '2rem' }}>
          {!resume ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📝</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Smart Resume Builder</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1rem' }}>AI generates a professional resume from your profile.</p>
              <button className="btn-ce btn-ce-primary" disabled={ld.resume} onClick={async () => { setL('resume', true); try { setResume(await generateResume(profile)); await addXP(user.id, 25); await refreshProfile(); } catch (e) {} setL('resume', false); }}>
                {ld.resume ? 'Building...' : '✨ Build My Resume'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', border: '2px solid var(--border-color)', borderRadius: 16, background: 'var(--input-bg)' }}>
              <h2 style={{ fontWeight: 800, marginBottom: 2, fontSize: '1.5rem' }}>{resume.name}</h2>
              <div style={{ color: 'var(--primary-blue)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>{resume.title}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>{resume.summary}</p>
              {resume.skills?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>Skills</div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {resume.skills.map((s, i) => <span key={i} className="skill-pill" style={{ cursor: 'default', fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>{s}</span>)}
                  </div>
                </div>
              )}
              {resume.projects?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>Projects</div>
                  {resume.projects.map((p, i) => (
                    <div key={i} style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {section === 'projects' && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '2rem' }}>
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛠️</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Project Ideas</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1rem' }}>Project recommendations aligned with your career path.</p>
              <button className="btn-ce btn-ce-primary" disabled={ld.projects} onClick={async () => { setL('projects', true); try { setProjects(await getProjectRecommendations(profile)); } catch (e) {} setL('projects', false); }}>
                {ld.projects ? 'Loading...' : 'Get Projects'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {projects.map((p, i) => (
                <div key={i} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.title}</span>
                    <span className={`meta-badge ${p.difficulty}`}>{p.difficulty}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{p.description}</div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {p.technologies?.map((t, j) => <span key={j} className="skill-pill" style={{ cursor: 'default', fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{t}</span>)}
                  </div>
                </div>
              ))}
              <button className="btn-ce btn-ce-secondary" disabled={ld.projects} onClick={async () => { setL('projects', true); try { setProjects(await getProjectRecommendations(profile)); } catch (e) {} setL('projects', false); }}>🔄 Refresh</button>
            </div>
          )}
        </div>
      )}

      {/* Jobs */}
      {section === 'jobs' && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '2rem' }}>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💼</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Jobs & Internships</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1rem' }}>Discover opportunities matched to your skills.</p>
              <button className="btn-ce btn-ce-primary" disabled={ld.jobs} onClick={async () => { setL('jobs', true); try { setJobs(await getJobRecommendations(profile)); } catch (e) {} setL('jobs', false); }}>
                {ld.jobs ? 'Loading...' : 'Find Opportunities'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {jobs.map((j, i) => (
                <div key={i} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{j.title}</span>
                    <span className={`meta-badge ${j.type === 'internship' ? 'beginner' : j.type === 'full-time' ? 'intermediate' : 'advanced'}`}>{j.type}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>{j.description}</div>
                  {j.tips?.length > 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>💡 {j.tips[0]}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mock Interview */}
      {section === 'interview' && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '2rem' }}>
          {!interview ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎯</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>AI Mock Interview</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1rem' }}>Practice with AI-generated questions and get scored feedback.</p>
              <button className="btn-ce btn-ce-primary" disabled={ld.interview} onClick={async () => {
                setL('interview', true); setFeedback(null); setAnswer('');
                try { const q = await generateInterviewQuestion(profile, prevQs); setInterview(q); setPrevQs(p => [...p, q.question]); } catch (e) {}
                setL('interview', false);
              }}>
                {ld.interview ? 'Generating...' : 'Start Interview'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1.25rem', background: 'var(--input-bg)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="meta-badge beginner">{interview.category}</span>
                  <span className={`meta-badge ${interview.difficulty === 'easy' ? 'beginner' : interview.difficulty === 'medium' ? 'intermediate' : 'advanced'}`}>{interview.difficulty}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.5 }}>{interview.question}</div>
                {interview.hints?.length > 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>💡 {interview.hints.join(' • ')}</div>}
              </div>
              {!feedback ? (
                <div>
                  <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer here..." rows={5}
                    style={{ width: '100%', padding: '1rem', borderRadius: 12, border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', resize: 'vertical', outline: 'none', marginBottom: '0.5rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-ce btn-ce-primary" disabled={!answer.trim() || ld.feedback} onClick={async () => {
                      setL('feedback', true); try { setFeedback(await evaluateInterviewAnswer(interview.question, answer, profile)); await addXP(user.id, 10); await refreshProfile(); } catch (e) {} setL('feedback', false);
                    }}>{ld.feedback ? 'Evaluating...' : 'Submit Answer'}</button>
                    <button className="btn-ce btn-ce-secondary" disabled={ld.interview} onClick={async () => {
                      setL('interview', true); setFeedback(null); setAnswer('');
                      try { const q = await generateInterviewQuestion(profile, prevQs); setInterview(q); setPrevQs(p => [...p, q.question]); } catch (e) {}
                      setL('interview', false);
                    }}>Skip</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: feedback.score >= 7 ? 'linear-gradient(135deg, #10b981, #059669)' : feedback.score >= 4 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem',
                    }}>{feedback.score}</div>
                    <div><div style={{ fontWeight: 800 }}>Score: {feedback.score}/10</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>+10 XP earned</div></div>
                  </div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{feedback.feedback}</p>
                  <button className="btn-ce btn-ce-primary" onClick={async () => {
                    setL('interview', true); setFeedback(null); setAnswer('');
                    try { const q = await generateInterviewQuestion(profile, prevQs); setInterview(q); setPrevQs(p => [...p, q.question]); } catch (e) {}
                    setL('interview', false);
                  }}>Next Question →</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
