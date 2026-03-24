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
            <div style={{ display: 'grid', gridTemplateColumns: feedback ? 'repeat(auto-fit, minmax(360px, 1fr))' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Left Column: Question & Answer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 14, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="meta-badge beginner">{interview.category}</span>
                    <span className={`meta-badge ${interview.difficulty === 'easy' ? 'beginner' : interview.difficulty === 'medium' ? 'intermediate' : 'advanced'}`}>{interview.difficulty}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.5 }}>{interview.question}</div>
                  {interview.hints?.length > 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>💡 {interview.hints.join(' • ')}</div>}
                </div>

                {!feedback ? (
                  <div>
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer here..." rows={6}
                      style={{ width: '100%', padding: '1rem', borderRadius: 12, border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', resize: 'vertical', outline: 'none', marginBottom: '1rem', transition: 'border-color 0.2s' }} 
                      onFocus={e => e.target.style.borderColor = 'var(--primary-blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button className="btn-ce btn-ce-primary" disabled={!answer.trim() || ld.feedback} onClick={async () => {
                        setL('feedback', true); 
                        try { 
                          const res = await evaluateInterviewAnswer(interview.question, answer, profile);
                          setFeedback(res); 
                          await addXP(user.id, 10); 
                          await refreshProfile(); 
                          
                          // Trigger TTS explanation
                          if (res?.spoken_explanation && window.speechSynthesis) {
                             window.speechSynthesis.cancel();
                             const utterance = new SpeechSynthesisUtterance(res.spoken_explanation);
                             utterance.rate = 1.0;
                             window.speechSynthesis.speak(utterance);
                          }
                        } catch (e) {
                          console.error(e);
                        } 
                        setL('feedback', false);
                      }}>{ld.feedback ? 'AI Evaluating...' : 'Submit Answer'}</button>
                      <button className="btn-ce btn-ce-secondary" disabled={ld.interview} onClick={async () => {
                        setL('interview', true); setFeedback(null); setAnswer('');
                        try { const q = await generateInterviewQuestion(profile, prevQs); setInterview(q); setPrevQs(p => [...p, q.question]); } catch (e) {}
                        setL('interview', false);
                      }}>Skip</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.25rem', background: 'var(--input-bg)', borderRadius: 14, border: '1px solid var(--border-color)', opacity: 0.8 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>YOUR ANSWER:</div>
                    <div style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      "{answer}"
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: AI Fixer Animated Feedback */}
              {feedback && (
                <div className="ai-fixer-pop fade-in-up" style={{
                  padding: '1.5rem', borderRadius: 20,
                  background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.1))',
                  border: '1px solid rgba(59, 130, 246, 0.3)', position: 'relative',
                  animation: 'popSide 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                  boxShadow: '0 8px 32px rgba(37, 99, 235, 0.1)',
                  opacity: 0,
                  transform: 'translateX(20px)'
                }}>
                  <div style={{ 
                    position: 'absolute', top: -18, right: 24,
                    background: 'linear-gradient(135deg, var(--primary-blue), var(--blob-2))', color: '#fff', padding: '6px 16px',
                    borderRadius: 20, fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                  }}>
                    <span style={{ fontSize: '1.2rem', animation: 'wave 2s infinite' }}>👨‍🏫</span> AI Mentor Review
                  </div>

                  <div style={{ display: 'grid', gap: '1.25rem', paddingTop: '0.5rem' }}>
                    
                    {/* Score Card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 16 }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: feedback.score >= 7 ? 'linear-gradient(135deg, #10b981, #059669)' : feedback.score >= 4 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.4rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>{feedback.score}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
                          {feedback.score >= 7 ? 'Passed! 🎉' : 'Needs Practice'} 
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>{feedback.score}/10 points • +10 XP</div>
                      </div>
                    </div>
                    
                    {/* Talking indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-blue)', fontSize: '0.8rem', fontWeight: 700 }}>
                       <span style={{ display: 'inline-flex', gap: 3 }}>
                         <span style={{ width: 3, height: 10, background: 'var(--primary-blue)', borderRadius: 2, animation: 'equalize 1s infinite ease-in-out' }}></span>
                         <span style={{ width: 3, height: 14, background: 'var(--primary-blue)', borderRadius: 2, animation: 'equalize 1.1s infinite ease-in-out 0.2s' }}></span>
                         <span style={{ width: 3, height: 8, background: 'var(--primary-blue)', borderRadius: 2, animation: 'equalize 0.9s infinite ease-in-out 0.4s' }}></span>
                       </span>
                       Listen to your mentor's feedback...
                    </div>

                    <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                      {feedback.feedback}
                    </p>
                    
                    {/* Fixers Section */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '1.1rem' }}>🔧</span> 
                        {feedback.score >= 7 ? 'Missing Fixers (to make it perfect):' : 'Fixes for Wrong Answers:'}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {feedback.improvements?.map((imp, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>{imp}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Ideal Answer Section */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '1.1rem' }}>💡</span> 
                        What I was looking for (Ideal Answer):
                      </div>
                      <div style={{ 
                        padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', 
                        borderLeft: '4px solid var(--success-green)', borderRadius: '0 12px 12px 0',
                        fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6
                      }}>
                        "{feedback.sample_answer}"
                      </div>
                    </div>

                    <button className="btn-ce btn-ce-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '1rem' }} onClick={async () => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setL('interview', true); setFeedback(null); setAnswer('');
                      try { const q = await generateInterviewQuestion(profile, prevQs); setInterview(q); setPrevQs(p => [...p, q.question]); } catch (e) {}
                      setL('interview', false);
                    }}>Ready for Next Question? →</button>
                  </div>
                </div>
              )}

              <style jsx>{`
                @keyframes popSide {
                  0% { opacity: 0; transform: translateX(30px) scale(0.95); }
                  100% { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes equalize {
                  0% { height: 6px; }
                  50% { height: 16px; }
                  100% { height: 6px; }
                }
                @keyframes wave {
                  0% { transform: rotate(0deg); }
                  20% { transform: rotate(15deg); }
                  40% { transform: rotate(-10deg); }
                  60% { transform: rotate(15deg); }
                  80% { transform: rotate(-10deg); }
                  100% { transform: rotate(0deg); }
                }
              `}</style>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
