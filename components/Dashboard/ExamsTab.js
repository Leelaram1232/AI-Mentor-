'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import useDashboardStore from '@/store/dashboardStore';
import { generateExam } from '@/utils/groqApi';
import { addXP, logLearningActivity, awardBadge } from '@/utils/authClient';

export default function ExamsTab() {
  const { user, profile, refreshProfile } = useAuth();
  const { roadmap } = useDashboardStore();

  const [examState, setExamState] = useState('selection'); // selection, loading, taking, results
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  
  // Extract unique topics from the user's roadmap
  const roadmapTopics = Array.from(new Set(
    (roadmap?.roadmap_items || []).slice(0, 10).map(item => item.title)
  ));
  
  const defaultTopics = ['Programming Fundamentals', 'Data Structures', 'System Design', 'Web Architecture', 'Database Management'];
  const topicsToDisplay = roadmapTopics.length > 0 ? roadmapTopics : defaultTopics;

  const startExam = async (topic) => {
    setSelectedTopic(topic);
    setExamState('loading');
    setAnswers({});
    setCurrentQuestionIdx(0);
    setScore(0);
    
    try {
      const qs = await generateExam(topic, difficulty, 5);
      setQuestions(qs);
      setExamState('taking');
    } catch (e) {
      console.error(e);
      setExamState('selection');
    }
  };

  const handleSelectAnswer = (optIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: optIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };
  
  const prevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const submitExam = async () => {
    // calculate score
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setExamState('results');
    
    // Save points and history
    try {
      const xpEarned = calculatedScore * 10;
      if (xpEarned > 0) {
        await addXP(user.id, xpEarned);
        await logLearningActivity(user.id, 15, `Exam: ${selectedTopic}`);
      }
      
      // Award badge logic for perfect score
      if (calculatedScore === questions.length) {
        await awardBadge(user.id, { 
          badge_name: 'Perfect Scorer', 
          badge_icon: '🎯', 
          badge_description: `Got a perfect score on ${selectedTopic} exam` 
        });
      }
      
      await refreshProfile();
    } catch (e) {
      console.error('Failed to submit exam stats', e);
    }
  };

  if (examState === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="ai-loader" style={{ width: 60, height: 60, margin: '0 auto 1.5rem' }}>
          <div className="ai-ring"></div>
          <div className="ai-ring"></div>
          <div className="ai-ring"></div>
          <span className="ai-brain" style={{ fontSize: '1.2rem' }}>📝</span>
        </div>
        <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Generating Your Exam...</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>AI is crafting rigorous questions on {selectedTopic}</p>
      </div>
    );
  }

  if (examState === 'taking' && questions.length > 0) {
    const q = questions[currentQuestionIdx];
    const isLast = currentQuestionIdx === questions.length - 1;
    const selected = answers[currentQuestionIdx];
    
    return (
      <div className="glass-card fade-in-up" style={{ borderRadius: 16, padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <span className="meta-badge advanced">{selectedTopic}</span>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Question {currentQuestionIdx + 1} of {questions.length}</span>
        </div>
        
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '2rem', lineHeight: '1.5' }}>
          {q.question}
        </h3>
        
        <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '2rem' }}>
          {q.options.map((opt, i) => (
            <div 
              key={i} 
              onClick={() => handleSelectAnswer(i)}
              style={{
                padding: '1rem 1.25rem', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${selected === i ? 'var(--primary-blue)' : 'var(--border-color)'}`,
                background: selected === i ? 'rgba(59, 130, 246, 0.05)' : 'var(--input-bg)',
                display: 'flex', alignItems: 'center', gap: '1rem',
                transition: 'all 0.2s', fontWeight: 500
              }}
            >
              <div style={{ 
                width: 24, height: 24, borderRadius: '50%',
                border: `2px solid ${selected === i ? 'var(--primary-blue)' : 'var(--text-secondary)'}`,
                background: selected === i ? 'var(--primary-blue)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {selected === i && <span style={{ width: 10, height: 10, background: '#fff', borderRadius: '50%' }}></span>}
              </div>
              {opt}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <button 
            className="btn-ce btn-ce-secondary" 
            onClick={prevQuestion} 
            disabled={currentQuestionIdx === 0}
          >
            ← Previous
          </button>
          
          {isLast ? (
             <button 
                className="btn-ce" 
                onClick={submitExam}
                disabled={selected === undefined}
                style={{ background: 'var(--success-green)', color: '#fff', border: 'none', fontWeight: 700, padding: '0.75rem 1.5rem', borderRadius: 12 }}
             >
                Submit Exam 🚀
             </button>
          ) : (
             <button 
                className="btn-ce btn-ce-primary" 
                onClick={nextQuestion}
                disabled={selected === undefined}
             >
                Next Question →
             </button>
          )}
        </div>
      </div>
    );
  }

  if (examState === 'results') {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 60;
    
    return (
      <div className="glass-card fade-in-up" style={{ borderRadius: 16, padding: '2.5rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: 120, height: 120, borderRadius: '50%', margin: '0 auto 1.5rem',
            background: passed ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
            border: `6px solid ${passed ? 'var(--success-green)' : 'var(--error-red)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: passed ? 'var(--success-green)' : 'var(--error-red)' }}>{percentage}%</span>
            <span style={{ fontSize: '0.9rem', color: passed ? 'var(--success-green)' : 'var(--error-red)', fontWeight: 700 }}>Score</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: passed ? 'var(--success-green)' : 'var(--error-red)' }}>
            {passed ? 'Exam Passed! 🎉' : 'Needs Review'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            You got {score} out of {questions.length} questions correct. (+{score * 10} XP)
          </p>
        </div>
        
        <h4 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '1rem' }}>Review Answers</h4>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {questions.map((q, idx) => {
             const usrAns = answers[idx];
             const isCorrect = usrAns === q.correctIndex;
             return (
               <div key={idx} style={{ 
                 padding: '1.25rem', borderRadius: 12, 
                 border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                 background: isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
               }}>
                 <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', marginTop: -2 }}>{isCorrect ? '✅' : '❌'}</span>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{q.question}</span>
                 </div>
                 
                 <div style={{ paddingLeft: '1.8rem' }}>
                   {!isCorrect && (
                     <div style={{ color: 'var(--error-red)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 500 }}>
                       Your Answer: {q.options[usrAns]}
                     </div>
                   )}
                   <div style={{ color: 'var(--success-green)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                     Correct Answer: {q.options[q.correctIndex]}
                   </div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--glass-bg)', padding: '0.8rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                     💡 {q.explanation}
                   </div>
                 </div>
               </div>
             )
          })}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <button className="btn-ce btn-ce-primary btn-ce-large" onClick={() => setExamState('selection')}>
            Take Another Exam
          </button>
        </div>
      </div>
    );
  }

  // default to 'selection'
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>📝 Certification Exams</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Validate your knowledge, earn XP, and unlock badges with AI-generated tests.</p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', borderRadius: 20 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Your Learning Topics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {topicsToDisplay.map((topic, i) => (
            <div key={i} className="hover-lift" style={{ 
              padding: '1.25rem', borderRadius: 14, border: '1px solid var(--border-color)', 
              background: 'var(--input-bg)', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <div>
                 <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{topic}</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Generated dynamically by AI</div>
              </div>
              <button 
                className="btn-ce btn-ce-primary" 
                onClick={() => startExam(topic)}
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', borderRadius: 10 }}
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '2rem', borderRadius: 20 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Custom Exam</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Want to test yourself on a specific technology?</p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="input-group-ce" style={{ flex: 1, minWidth: 250 }}>
            <input 
               type="text" 
               className="custom-input-ce" 
               placeholder="e.g. Next.js App Router" 
               id="customExamTopic"
            />
          </div>
          <select 
            value={difficulty} 
            onChange={e => setDifficulty(e.target.value)}
            className="custom-input-ce" 
            style={{ width: 140 }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button 
            className="btn-ce btn-ce-primary"
            onClick={() => {
               const val = document.getElementById('customExamTopic').value;
               if (val.trim()) startExam(val);
            }}
          >
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
}
