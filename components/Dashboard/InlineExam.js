'use client';
import { useState, useEffect, useRef } from 'react';
import { generateExam, analyzeExamPerformance } from '@/utils/groqApi';
import { addXP, logLearningActivity, awardBadge } from '@/utils/authClient';

export default function InlineExam({ topic, userId, language = 'English', onComplete }) {
  const [state, setState] = useState('idle'); // idle, loading, taking, results
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [mentorFeedback, setMentorFeedback] = useState(null); // { english_text, speech_text }
  const [analyzing, setAnalyzing] = useState(false);
  const [pos, setPos] = useState({ x: 20, y: 150 }); 
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
      // Set to floating pos
      if (typeof window !== 'undefined') {
        const x = Math.max(20, window.innerWidth - 480);
        setPos({ x, y: 150 });
      }

      // Get AI Mentor's dual-language analysis
      const feedbackObj = await analyzeExamPerformance(topic, s, questions.length, resultDetails, language);
      setMentorFeedback(feedbackObj);
      setAnalyzing(false);

      // Speak feedback in user's language
      if (feedbackObj?.speech_text) {
        speakFeedback(feedbackObj.speech_text, language);
      }

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

  const speakFeedback = (text, langPref = 'English') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set correct language code
      const isTelugu = langPref.toLowerCase() === 'telugu';
      utterance.lang = isTelugu ? 'te-IN' : 'en-US';

      // Try to find a better human-sounding voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Filter for Telugu voices if needed, or premium English voices
        const targetVoice = voices.find(v => v.lang.includes(isTelugu ? 'te' : 'en') && (v.name.includes('Google') || v.name.includes('Premium')));
        if (targetVoice) utterance.voice = targetVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.rate = isTelugu ? 0.9 : 1.0; // Telugu usually sounds better slightly slower
      utterance.pitch = 1.05;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Resolve Mobile vs Desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setPos({ x: 0, y: 0 }); // Use CSS for mobile position
      } else if (pos.x === 0 && pos.y === 0) {
        setPos({ x: window.innerWidth - 450, y: 150 });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Robust Dragging Logic + Mobile Detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e) => {
      if (!isDragging || isMobile) return;
      setPos({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging && !isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMobile]);

  const onDragStart = (e) => {
    if (isMobile) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
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
      <div className="fade-in-up" 
        style={{ borderRadius: 16, padding: '1.5rem', border: `2px solid ${passed ? 'var(--success-green)' : 'var(--error-red)'}`, position: 'relative' }}>
        
        {/* DRAGGABLE AI MENTOR WINDOW TAB */}
        {mentorFeedback && !analyzing && (
          <div className="pop-in" style={{ 
            position: 'fixed', 
            left: isMobile ? 0 : pos.x, 
            top: isMobile ? 'auto' : pos.y, 
            bottom: isMobile ? 0 : 'auto',
            width: '100%', 
            maxWidth: isMobile ? '100%' : '400px', 
            zIndex: 10000,
            padding: isMobile ? 0 : '1rem'
          }}>
            <div className="glass-panel" style={{ 
              borderRadius: isMobile ? '24px 24px 0 0' : 16, border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 -20px 80px -20px rgba(0,0,0,0.4)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(32px)'
            }}>
              {/* Window Title Bar (Tab) */}
              <div onMouseDown={onDragStart} className={isMobile ? '' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}
                style={{ 
                  background: 'linear-gradient(90deg, #1e293b, #334155)', 
                  padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', 
                  justifyContent: 'space-between', color: '#fff', userSelect: 'none'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>AI MENTOR</div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Personalized Insight</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button onClick={() => speakFeedback(mentorFeedback.speech_text, language)} disabled={isSpeaking} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>{isSpeaking ? '🔊' : '▶️'}</button>
                  <button onClick={() => { stopSpeaking(); setMentorFeedback(null); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>
              </div>

              <div style={{ padding: '1.5rem', maxHeight: isMobile ? '65vh' : '55vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#fff' }}>👩‍🏫</div>
                  <div>
                    <h4 style={{ fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Mentor Analysis (English)</h4>
                    <div style={{ fontSize: '0.7rem', color: isSpeaking ? 'var(--success-green)' : 'var(--text-secondary)', fontWeight: 600 }}>{isSpeaking ? `Speaking in ${language}...` : 'Professional feedback for deep learning'}</div>
                  </div>
                </div>

                <div style={{ 
                  fontSize: '0.95rem', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap',
                  padding: '1.25rem', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {mentorFeedback.english_text}
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: isMobile ? '2.5rem' : '1rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{isMobile ? 'AI Mentor Guidance' : 'Hold top bar to move window'}</span>
                <button className="btn-ce" onClick={() => { stopSpeaking(); setMentorFeedback(null); }} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', borderRadius: 10, background: '#f1f5f9', fontWeight: 700 }}>Close & Review</button>
              </div>
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
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: passed ? 'var(--success-green)' : 'var(--error-red)' }}>
            Exam Result: {pct}%
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Detailed concept mastery check</p>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
          {questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <div key={i} className="glass-panel" style={{ padding: '1rem', borderRadius: 12, border: `1px solid ${correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>{correct ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, opacity: 0.9 }}>{q.question}</div>
                    <div style={{ fontSize: '0.85rem' }}>
                       {!correct && <div style={{ color: 'var(--error-red)', fontWeight: 600, marginBottom: 4 }}>You said: {q.options[answers[i]]}</div>}
                       <div style={{ color: 'var(--success-green)', fontWeight: 800 }}>Mentor's Pick: {q.options[q.correctIndex]}</div>
                       <div style={{ marginTop: 8, padding: '0.75rem', borderRadius: 8, background: 'rgba(0,0,0,0.03)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>💡 {q.explanation}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn-ce btn-ce-primary" onClick={startExam} style={{ borderRadius: 12, fontWeight: 700 }}>🔄 Retake Exam</button>
          <button className="btn-ce btn-ce-secondary" onClick={() => { stopSpeaking(); setState('idle'); setMentorFeedback(null); }} style={{ borderRadius: 12, fontWeight: 700 }}>Finish Session</button>
        </div>
      </div>
    );
  }

  return null;
}
