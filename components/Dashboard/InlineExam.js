'use client';
import { useState } from 'react';
import { generateExam } from '@/utils/groqApi';
import { addXP, logLearningActivity, awardBadge } from '@/utils/authClient';

export default function InlineExam({ topic, userId, onComplete }) {
  const [state, setState] = useState('idle'); // idle, loading, taking, results
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);

  const startExam = async () => {
    setState('loading');
    try {
      const qs = await generateExam(topic, 'intermediate', 5);
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
    questions.forEach((q, i) => { if (answers[i] === q.correctIndex) s++; });
    setScore(s);
    setState('results');
    try {
      const xp = s * 10;
      if (xp > 0) {
        await addXP(userId, xp);
        await logLearningActivity(userId, 15, `Exam: ${topic}`);
      }
      if (s === questions.length) {
        await awardBadge(userId, { badge_name: 'Perfect Scorer', badge_icon: '🎯', badge_description: `Perfect on ${topic}` });
      }
      if (onComplete) onComplete(s, questions.length);
    } catch (e) { console.error(e); }
  };

  if (state === 'idle') {
    return (
      <button onClick={startExam} className="btn-ce btn-ce-primary"
        style={{ width: '100%', padding: '1rem', borderRadius: 14, fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        📝 Take Test on {topic.length > 30 ? topic.substring(0, 30) + '...' : topic}
      </button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span className="meta-badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary-blue)', fontWeight: 700 }}>📝 Exam: {topic.length > 25 ? topic.substring(0, 25) + '...' : topic}</span>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Q{qIdx + 1}/{questions.length}</span>
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
      <div className="glass-panel fade-in-up" style={{ borderRadius: 16, padding: '1.5rem', border: `2px solid ${passed ? 'var(--success-green)' : 'var(--error-red)'}` }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%', margin: '0 auto 1rem',
            background: passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `5px solid ${passed ? 'var(--success-green)' : 'var(--error-red)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: passed ? 'var(--success-green)' : 'var(--error-red)' }}>{pct}%</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: passed ? 'var(--success-green)' : 'var(--error-red)' }}>
            {passed ? 'Exam Passed! 🎉' : 'Needs Review'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {score}/{questions.length} correct (+{score * 10} XP)
          </p>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <div key={i} style={{ padding: '1rem', borderRadius: 12,
                border: `1px solid ${correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                background: correct ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span>{correct ? '✅' : '❌'}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.question}</span>
                </div>
                <div style={{ paddingLeft: '1.6rem', fontSize: '0.85rem' }}>
                  {!correct && <div style={{ color: 'var(--error-red)', fontWeight: 500 }}>Your answer: {q.options[answers[i]]}</div>}
                  <div style={{ color: 'var(--success-green)', fontWeight: 600 }}>Correct: {q.options[q.correctIndex]}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 4, background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: 6 }}>💡 {q.explanation}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn-ce btn-ce-primary" onClick={startExam} style={{ borderRadius: 10, fontWeight: 600 }}>🔄 Retake</button>
          <button className="btn-ce btn-ce-secondary" onClick={() => setState('idle')} style={{ borderRadius: 10, fontWeight: 600 }}>Close</button>
        </div>
      </div>
    );
  }

  return null;
}
