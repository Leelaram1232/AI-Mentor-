'use client';
import { useState } from 'react';
import { generateExam, analyzeExamPerformance } from '@/utils/groqApi';
import { addXP, logLearningActivity, awardBadge } from '@/utils/authClient';

export default function InlineExam({ topic, userId, onComplete }) {
  const [state, setState] = useState('idle'); // idle, loading, taking, results
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [mentorFeedback, setMentorFeedback] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const startExam = async () => {
    setState('loading');
    try {
      const qs = await generateExam(topic, 'intermediate', 10);
      setQuestions(qs);
      setAnswers({});
      setQIdx(0);
      setScore(0);
      setState('taking');
    } catch (e) {
      console.error(e);
      setState('idle');
    }
  };

  const submitExam = async () => {
    let s = 0;
    const resultDetails = questions.map((q, i) => {
      const correct = answers[i] === q.correctIndex;
      if (correct) s++;
      return { 
        question: q.question, 
        isCorrect: correct, 
        explanation: q.explanation 
      };
    });
    
    setScore(s);
    setState('results');
    setAnalyzing(true);

    try {
      // Get AI Mentor's deep analysis
      const feedback = await analyzeExamPerformance(topic, s, questions.length, resultDetails);
      setMentorFeedback(feedback || 'Great job completing the exam! Focus on the concepts where you made mistakes to improve further.');
      setAnalyzing(false);

      const xp = s * 10;
      if (xp > 0) {
        await addXP(userId, xp);
        await logLearningActivity(userId, 15, `Exam: ${topic}`);
      }
      if (s === questions.length) {
        await awardBadge(userId, { badge_name: 'Perfect Scorer', badge_icon: '🎯', badge_description: `Perfect on ${topic}` });
      }
      if (onComplete) onComplete(s, questions.length);
    } catch (e) { 
      console.error(e); 
      setAnalyzing(false);
    }
  };

  if (state === 'idle') {
    return (
      <div className="glass-panel" style={{ borderRadius: 16, padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>📝 Topic Assessment</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>10 AI-generated questions • 60% to pass • Earn up to 100 XP</div>
          </div>
          <span className="meta-badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem' }}>⚡ Required</span>
        </div>
        <button onClick={startExam} className="btn-ce btn-ce-primary"
          style={{ width: '100%', padding: '0.85rem', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          📝 Take Test
        </button>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 16, textAlign: 'center' }}>
        <div className="ai-loader" style={{ width: 50, height: 50, margin: '0 auto 1rem' }}>
          <div className="ai-ring"></div><div className="ai-ring"></div>
          <span className="ai-brain" style={{ fontSize: '1rem' }}>📝</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Generating Your Exam...</div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>AI is crafting questions on {topic}</p>
      </div>
    );
  }

  if (state === 'taking' && questions.length > 0) {
    const q = questions[qIdx];
    const sel = answers[qIdx];
    const isLast = qIdx === questions.length - 1;
    const answeredAll = Object.keys(answers).length === questions.length;

    return (
      <div className="glass-panel fade-in-up" style={{ borderRadius: 16, padding: '1.5rem', border: '2px solid var(--primary-blue)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="meta-badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary-blue)', fontWeight: 700 }}>📝 Exam: {topic.length > 25 ? topic.substring(0, 25) + '...' : topic}</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="meta-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600, fontSize: '0.7rem' }}>60% to pass</span>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Q{qIdx + 1}/{questions.length}</span>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i === qIdx ? 'var(--primary-blue)' : answers[i] !== undefined ? 'var(--success-green)' : 'var(--border-color)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', lineHeight: 1.5 }}>{q.question}</h4>

        <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {q.options.map((opt, i) => (
            <div key={i} onClick={() => setAnswers(prev => ({ ...prev, [qIdx]: i }))}
              style={{
                padding: '0.85rem 1rem', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${sel === i ? 'var(--primary-blue)' : 'var(--border-color)'}`,
                background: sel === i ? 'rgba(59,130,246,0.06)' : 'var(--input-bg)',
                display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', fontWeight: 500
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${sel === i ? 'var(--primary-blue)' : 'var(--text-secondary)'}`,
                background: sel === i ? 'var(--primary-blue)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {sel === i && <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }}></span>}
              </div>
              <span style={{ fontSize: '0.95rem' }}>{opt}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button className="btn-ce btn-ce-secondary" onClick={() => setQIdx(p => p - 1)} disabled={qIdx === 0}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 10, fontWeight: 600 }}>← Prev</button>
          {isLast ? (
            <button className="btn-ce" onClick={submitExam} disabled={sel === undefined}
              style={{ background: answeredAll ? 'var(--success-green)' : 'var(--primary-blue)', color: '#fff', border: 'none', fontWeight: 700, padding: '0.6rem 1.5rem', borderRadius: 10 }}>
              Submit Exam 🚀
            </button>
          ) : (
            <button className="btn-ce btn-ce-primary" onClick={() => setQIdx(p => p + 1)} disabled={sel === undefined}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 10, fontWeight: 600 }}>Next →</button>
          )}
        </div>
      </div>
    );
  }

  if (state === 'results') {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 60;

    return (
      <div className="fade-in-up" style={{ borderRadius: 16, padding: '1.5rem', border: `2px solid ${passed ? 'var(--success-green)' : 'var(--error-red)'}`, position: 'relative' }}>
        
        {/* Immersive AI Mentor Overlay (Transparent Chat Box + Blur) */}
        {mentorFeedback && !analyzing && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', 
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            padding: '2rem'
          }}>
            <div className="glass-panel fade-in-right" style={{ 
              width: '100%', maxWidth: '500px', maxHeight: '85vh', 
              borderRadius: 32, padding: '2.5rem', border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary-blue), #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🧠</div>
                <div>
                  <h4 style={{ fontWeight: 800, margin: 0, color: 'var(--primary-blue)', fontSize: '1.2rem' }}>AI Career Mentor</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Analysis by Leela Ram Samavedam (2026)</div>
                </div>
              </div>

              <div style={{ 
                flex: 1, overflowY: 'auto', paddingRight: '1rem', fontSize: '1rem', 
                lineHeight: '1.7', color: 'white', whiteSpace: 'pre-wrap' 
              }}>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 16, background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${passed ? 'var(--success-green)' : 'var(--error-red)'}` }}>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: passed ? 'var(--success-green)' : 'var(--error-red)' }}>{pct}% - {passed ? 'Passed!' : 'Try Again'}</div>
                  <div style={{ fontSize: '0.85rem' }}>{score}/{questions.length} correct concepts mastered</div>
                </div>
                {mentorFeedback}
              </div>

              <button className="btn-ce btn-ce-primary" onClick={() => setMentorFeedback('')} style={{ 
                marginTop: '1.5rem', width: '100%', padding: '1rem', borderRadius: 16, 
                fontWeight: 800, fontSize: '1rem', boxShadow: '0 10px 20px -5px rgba(59,130,246,0.3)' 
              }}>
                🚀 Got it, Mentor! Review Detailed Answers
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {analyzing && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', zIndex: 10, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="ai-loader" style={{ width: 50, height: 50, marginBottom: '1rem' }}><div className="ai-ring"></div></div>
            <div style={{ fontWeight: 800, color: 'var(--primary-blue)' }}>AI Mentor is analyzing your performance...</div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Question Review</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review each question to master the topic</p>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <div key={i} className="glass-panel" style={{ padding: '1rem', borderRadius: 12, border: `1px solid ${correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{correct ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>{q.question}</div>
                    <div style={{ fontSize: '0.85rem' }}>
                       {!correct && <div style={{ color: 'var(--error-red)', fontWeight: 600, marginBottom: 4 }}>Your answer: {q.options[answers[i]]}</div>}
                       <div style={{ color: 'var(--success-green)', fontWeight: 700 }}>Correct: {q.options[q.correctIndex]}</div>
                       <div style={{ marginTop: 8, padding: '0.75rem', borderRadius: 8, background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>💡 {q.explanation}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn-ce btn-ce-primary" onClick={startExam} style={{ borderRadius: 10, fontWeight: 600 }}>🔄 Retake Exam</button>
          <button className="btn-ce btn-ce-secondary" onClick={() => { setState('idle'); setMentorFeedback(''); }} style={{ borderRadius: 10, fontWeight: 600 }}>Back to Roadmap</button>
        </div>
      </div>
    );
  }

  return null;
}
