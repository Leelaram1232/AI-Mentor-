'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { getUserRoadmap, saveRoadmap, toggleRoadmapItem, updateRoadmapItemScore, getBookmarks, removeBookmark, logLearningActivity, addXP, awardBadge } from '@/utils/authClient';
import { generateLearningRoadmap, analyzeSkillGap } from '@/utils/groqApi';
import { searchYouTubeVideos, buildYouTubeSearchQuery, getYouTubeSearchURL } from '@/utils/youtubeApi';
import useDashboardStore from '@/store/dashboardStore';
import { jsPDF } from 'jspdf';
import InlineExam from './InlineExam';


// --- Subcomponents for Performance ---
function NotePad({ initialValue, onSave, onDownload, itemTitle, readonly = false }) {
  const [localNotes, setLocalNotes] = useState(initialValue);
  const timerRef = useRef(null);

  useEffect(() => {
    setLocalNotes(initialValue);
  }, [initialValue]);

  const handleChange = (val) => {
    if (readonly) return; // Prevent changing if readonly
    setLocalNotes(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(val);
    }, 1000); // Debounce save
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📝 Note Pad {readonly && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>(Read Only)</span>}
        </h4>
        <button onClick={onDownload} style={{ 
          background: 'none', border: 'none', color: 'var(--primary-blue)', 
          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
        }}>
          📥 PDF Download
        </button>
      </div>
      <textarea 
        value={localNotes}
        onChange={(e) => handleChange(e.target.value)}
        readOnly={readonly}
        placeholder={readonly ? "Notes are read-only for completed days." : "Type your study notes here... (Auto-saves)"}
        spellCheck="false"
        data-gramm="false"
        style={{
          width: '100%', minHeight: 400, padding: '1.25rem', borderRadius: 16,
          border: '1px solid var(--border-color)', background: readonly ? 'var(--glass-bg)' : 'var(--input-bg)',
          color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit',
          resize: 'vertical', outline: 'none', lineHeight: '1.6',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          opacity: readonly ? 0.7 : 1,
          cursor: readonly ? 'not-allowed' : 'text'
        }}
      />
    </div>
  );
}


// Category colors
const CAT_COLORS = {
  'Foundation': { bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6', icon: '🧱' },
  'Core Skills': { bg: 'rgba(139, 92, 246, 0.12)', border: '#8b5cf6', icon: '⚡' },
  'Advanced': { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', icon: '🚀' },
  'Projects': { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', icon: '🔨' },
  'Career Prep': { bg: 'rgba(236, 72, 153, 0.12)', border: '#ec4899', icon: '🎯' },
};

export default function LearnTab() {
  const { user, profile, refreshProfile } = useAuth();
  const { 
    setActiveTab, setMentorTopic, setExamTopic,
    roadmap, setRoadmap, 
    bookmarks, setBookmarks, 
    skillGap, setSkillGap 
  } = useDashboardStore();

  const [loading, setLoading] = useState(!roadmap);
  const [generating, setGenerating] = useState(false);
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [section, setSection] = useState('roadmap');
  const [expandedDay, setExpandedDay] = useState(1);
  const [videoCache, setVideoCache] = useState({});
  const [loadingVideo, setLoadingVideo] = useState(null);
  const [userNotes, setUserNotes] = useState({});
  const notesRef = useRef({});

  useEffect(() => { 
    if (user) loadData(!roadmap); 
  }, [user]);

  // Auto-load videos when a day is expanded
  useEffect(() => {
    if (!roadmap?.roadmap_items?.length) return;
    const dayItems = roadmap.roadmap_items.filter(i => (i.day_number || i.step_number) === expandedDay);
    dayItems.forEach(item => {
      const key = item.id || item.title;
      if (!videoCache[key]) loadVideoForStep(item);
    });
  }, [expandedDay, roadmap]);

  const loadData = async (isInitial = false) => {
    try {
      const [rm, bm] = await Promise.allSettled([getUserRoadmap(user.id), getBookmarks(user.id)]);
      const roadmapData = rm.status === 'fulfilled' ? rm.value : null;
      setRoadmap(roadmapData);
      setBookmarks(bm.status === 'fulfilled' ? bm.value : []);
      
      if (isInitial && roadmapData?.roadmap_items?.length) {
        const startDate = new Date(roadmapData.generated_at);
        const daysSinceStart = Math.min(
          Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1),
          parseInt(profile?.course_duration_days) || 30
        );
        setExpandedDay(daysSinceStart);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const freshProfile = await refreshProfile();
      const activeProfile = freshProfile || profile;
      const items = await generateLearningRoadmap(activeProfile);
      const totalDays = parseInt(activeProfile?.course_duration_days) || 30;
      const lang = activeProfile?.preferred_language || 'English';
      await saveRoadmap(user.id, {
        title: `${activeProfile?.career_goal || 'Career'} — ${totalDays}-Day Plan`,
        description: `Personalized for ${activeProfile?.full_name || 'student'} in ${lang}`,
        career_path: activeProfile?.career_goal || '',
      }, items.map((item, i) => ({
        ...item,
        step_number: i + 1,
        day_number: item.day_number || i + 1,
      })));
      setVideoCache({});
      await addXP(user.id, 20);
      await refreshProfile();
      await loadData(true);
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const handleExamComplete = async (itemId, score, total) => {
    try {
      const pct = Math.round((score / total) * 100);
      await updateRoadmapItemScore(itemId, pct);
      await loadData(false);
    } catch (e) { console.error(e); }
  };

  const handleToggleStep = async (item) => {
    if (item.is_completed) return; // Lock the "Done" state
    try {
      const done = true;
      await toggleRoadmapItem(item.id, done);
      if (done) {
        await addXP(user.id, 15);
        await logLearningActivity(user.id, item.estimated_hours * 60 || 30, item.title);
        const count = (roadmap?.roadmap_items || []).filter(i => i.is_completed).length + 1;
        if (count === 3) await awardBadge(user.id, { badge_name: 'Getting Started', badge_icon: '🌟', badge_description: '3 steps done' });
        if (count === 6) await awardBadge(user.id, { badge_name: 'Halfway There', badge_icon: '🚀', badge_description: '6 steps done' });
        if (count >= 10) await awardBadge(user.id, { badge_name: 'Dedicated Learner', badge_icon: '🏆', badge_description: '10+ steps done' });
        
        // Auto-advance if day is fully finished
        const dayNum = item.day_number || item.step_number;
        const dayItems = (roadmap?.roadmap_items || []).filter(i => (i.day_number || i.step_number) === dayNum);
        const allDoneNow = dayItems.every(i => i.id === item.id ? true : i.is_completed);
        if (allDoneNow) {
          setExpandedDay(dayNum + 1);
        }
        
        await refreshProfile();
      }
      await loadData(false);
    } catch (e) { console.error(e); }
  };


  const handleAnalyze = async () => {
    setAnalyzingGap(true);
    try { setSkillGap(await analyzeSkillGap(profile)); } catch (e) { console.error(e); }
    setAnalyzingGap(false);
  };

  const loadVideoForStep = useCallback(async (item) => {
    const key = item.id || item.title;
    if (!videoCache[key]) {
      setLoadingVideo(key);
      try {
        const lang = profile?.preferred_language || 'English';
        const query = item.youtube_search_query || buildYouTubeSearchQuery(item.title, lang);
        const videos = await searchYouTubeVideos(query, 2, lang);
        setVideoCache(prev => ({ ...prev, [key]: videos }));
      } catch (e) { console.error(e); }
      setLoadingVideo(null);
    }
  }, [videoCache, profile]);

  const handleNoteChange = (key, text) => {
    setUserNotes(prev => ({ ...prev, [key]: text }));
    localStorage.setItem(`notes_${user.id}_${key}`, text);
  };

  const downloadNotesAsPDF = (item) => {
    const key = item.id || item.title;
    const notes = userNotes[key] || '';
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text('AI Mentor', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Study Notes', 105, 30, { align: 'center' });
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Topic: ${item.title}`, 20, 45);
    doc.text(`Day: ${item.day_number || item.step_number}`, 20, 52);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(notes || 'No notes prepared yet.', 170);
    doc.text(splitText, 20, 65);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleDateString()} via AI Mentor Dashboard`, 105, 285, { align: 'center' });
    doc.save(`Notes_${item.title.replace(/\s+/g, '_')}.pdf`);
  };

  const learnWithMentor = (item) => {
    setMentorTopic(item.title);
    setActiveTab('mentor');
  };

  const completedSteps = (roadmap?.roadmap_items || []).filter(i => i.is_completed).length;
  const totalSteps = roadmap?.total_steps || (roadmap?.roadmap_items || []).length || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const totalDays = parseInt(profile?.course_duration_days) || 30;
  const language = profile?.preferred_language || 'English';

  const startDate = roadmap ? new Date(roadmap.generated_at) : new Date();
  const currentDay = Math.min(Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, totalDays);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><div className="ai-loader" style={{ width: 60, height: 60, margin: '0 auto' }}><div className="ai-ring"></div><div className="ai-ring"></div><div className="ai-ring"></div><span className="ai-brain" style={{ fontSize: '1.2rem' }}>📚</span></div></div>;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Learning Workspace</h2>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'roadmap', l: 'Roadmap' },
          { id: 'skills', l: 'Skill Gap' },
          { id: 'bookmarks', l: 'Bookmarks' }
        ].map(s => (
          <span key={s.id} className={`skill-pill ${section === s.id ? 'selected' : ''}`}
            onClick={() => setSection(s.id)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', fontWeight: 600 }}>{s.l}</span>
        ))}
      </div>

      {section === 'roadmap' && (
        !roadmap ? (
          <div className="glass-card" style={{ borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🗺️</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Generate Your {totalDays}-Day Learning Roadmap</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 0.5rem' }}>
              AI will create a personalized day-by-day learning path based on your career goals, interests, and preferred language ({language}).
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className="skill-pill selected" style={{ cursor: 'default', fontSize: '0.75rem' }}>🎯 {profile?.career_goal || 'Career Goal'}</span>
              <span className="skill-pill selected" style={{ cursor: 'default', fontSize: '0.75rem' }}>🌐 {language}</span>
              <span className="skill-pill selected" style={{ cursor: 'default', fontSize: '0.75rem' }}>📅 {totalDays} days</span>
            </div>
            <button className="btn-ce btn-ce-primary btn-ce-large" onClick={handleGenerate} disabled={generating}>
              {generating ? '✨ AI is planning your journey...' : `✨ Generate ${totalDays}-Day Roadmap`}
            </button>
          </div>
        ) : (
          <>
            <div className="glass-card" style={{ borderRadius: 16, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{roadmap.title}</span>
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: 6, flexWrap: 'wrap' }}>
                    <span className="meta-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-blue)', fontSize: '0.65rem' }}>🌐 {language}</span>
                    <span className="meta-badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontSize: '0.65rem' }}>📅 Duration: {totalDays} Days</span>
                    <span className="meta-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-green)', fontSize: '0.65rem' }}>🚀 Progress: {progress}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={handleGenerate} disabled={generating}
                    style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-blue)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    {generating ? 'Regenerating...' : '🔄 Re-plan Roadmap'}
                  </button>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-blue)', letterSpacing: '-1px' }}>{progress}%</span>
                </div>
              </div>
              <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)', borderRadius: 6, transition: 'width 1s cubic-bezier(0.19, 1, 0.22, 1)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.6rem', fontWeight: 500 }}>
                <span>{completedSteps} of {totalSteps} milestones achieved</span>
                <span>Day {currentDay} / {totalDays}</span>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.1rem', borderRadius: 14, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Today is Day {currentDay} of your {totalDays}-day plan</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {currentDay <= totalDays ? `${totalDays - currentDay} days remaining • Keep going!` : "You've completed the planned duration!"}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.5rem 0 1.25rem', scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }} className="no-scrollbar">
              {Array.from(new Set((roadmap.roadmap_items || []).map(i => i.day_number || i.step_number)))
                .sort((a, b) => a - b)
                .map(dayNum => {
                  const isSelected = expandedDay === dayNum;
                  const dayItems = (roadmap.roadmap_items || []).filter(i => (i.day_number || i.step_number) === dayNum);
                  const allDone = dayItems.every(i => i.is_completed);
                  return (
                    <button key={`day-btn-${dayNum}`}
                      onClick={() => setExpandedDay(dayNum)}
                      style={{
                        flexShrink: 0, padding: '0.75rem 1.25rem', borderRadius: 14,
                        border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--primary-blue-light)' : 'var(--glass-bg)',
                        color: isSelected ? 'var(--primary-blue)' : 'var(--text-primary)',
                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 85,
                        boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                        transform: isSelected ? 'translateY(-2px)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '0.65rem', opacity: 0.6, letterSpacing: '0.05em' }}>DAY</span>
                      <span style={{ fontSize: '1.25rem' }}>{dayNum}</span>
                      {allDone && dayItems.length > 0 && <span style={{ fontSize: '0.8rem', marginTop: 2 }}>✅</span>}
                    </button>
                  );
                })}
            </div>

            {(roadmap.roadmap_items || [])
              .filter(item => (item.day_number || item.step_number) === expandedDay)
              .map((item, idx) => {
                 const dayNum = item.day_number || item.step_number;
                 const cat = CAT_COLORS[item.category] || CAT_COLORS['Foundation'];
                 const key = item.id || `temp-${dayNum}-${idx}`;
                 const cacheKey = item.id || item.title;
                 const videos = videoCache[cacheKey];
                 const notes = userNotes[cacheKey] || localStorage.getItem(`notes_${user.id}_${cacheKey}`) || '';
                 const isDone = item.is_completed;
                 const validVideos = videos ? videos.filter(vid => !vid.isFallback && vid.videoId) : [];
                 
                 return (
                   <div key={key} className="glass-card fade-in-up" style={{
                     borderRadius: 20, padding: '2rem', borderLeft: `8px solid ${cat.border}`,
                     marginBottom: '1.5rem', position: 'relative', overflow: 'hidden'
                   }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                       <div style={{ flex: 1, minWidth: 300 }}>
                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: 8 }}>
                            <span className="meta-badge" style={{ background: cat.bg, color: cat.border, borderRadius: 8, padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>{cat.icon} {item.category}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>⏱️ {item.estimated_hours}h focus</span>
                            {isDone && <span style={{ color: 'var(--success-green)', fontWeight: 800, fontSize: '0.85rem' }}>✅ COMPLETED</span>}
                          </div>
                          <h3 style={{ fontWeight: 800, fontSize: '1.6rem', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{item.title}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6', maxWidth: 700 }}>{item.description}</p>
                       </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button className="btn-ce btn-ce-secondary" onClick={() => { setExamTopic(item.title); setActiveTab('exams'); }}
                            style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: 12 }}>
                            📝 Full Exam
                          </button>
                          <button className="btn-ce btn-ce-secondary" onClick={() => learnWithMentor(item)}
                            style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: 12 }}>
                            🤖 AI Mentor
                          </button>
                          
                          {/* Complete button only shows AFTER passing 60% and IF not already done */}
                          {!isDone && (item.score >= 60) && (
                            <button className="btn-ce" onClick={() => handleToggleStep(item)}
                              style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: 12,
                                background: 'var(--primary-blue)',
                                color: '#fff', border: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                              Complete Day Plan
                            </button>
                          )}

                          {isDone && (
                            <span style={{ color: 'var(--success-green)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: 10 }}>
                              ✅ COMPLETED
                            </span>
                          )}
                        </div>

                     </div>

                     <div style={{ marginTop: '1.5rem', display: 'grid', gap: '2rem' }}>
                       {loadingVideo === cacheKey ? (
                         <div className="glass-panel" style={{ height: 180, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                           <div className="ai-loader" style={{ width: 40, height: 40, marginBottom: '1rem' }}><div className="ai-ring"></div></div>
                           <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading tutorials...</span>
                         </div>
                       ) : validVideos.length > 0 ? (
                         validVideos.slice(0, 2).map((vid, vIdx) => (
                           <div key={vid.videoId || vIdx} className="roadmap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                             {/* Video Card */}
                             <div className="glass-panel hover-lift" style={{ borderRadius: 16, overflow: 'hidden' }}>
                               <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                                 {vid.embedUrl ? (
                                   <iframe src={vid.embedUrl} title={vid.title} loading="lazy"
                                     style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                     referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
                                 ) : (
                                   <a href={vid.watchUrl} target="_blank" rel="noopener noreferrer"
                                     style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: vid.thumbnail ? `url(${vid.thumbnail}) center/cover` : '#ff0000', textDecoration: 'none' }}>
                                     <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#fff' }}>▶</div>
                                   </a>
                                 )}
                               </div>
                               <div style={{ padding: '0.75rem' }}>
                                 <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{vid.title}</div>
                                 <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{vid.channelName}</div>
                               </div>
                             </div>
                             
                             {/* NotePad for this video */}
                             <NotePad 
                               initialValue={notes} 
                               onSave={(val) => handleNoteChange(cacheKey, val)} 
                               onDownload={() => downloadNotesAsPDF(item)}
                               itemTitle={`${item.title} - Video ${vIdx + 1}`}
                               readonly={isDone}
                             />
                           </div>
                         ))
                       ) : (
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                           <a href={'https://www.youtube.com/results?search_query=' + encodeURIComponent(item.title + ' tutorial')} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                             <div className="glass-panel hover-lift" style={{ borderRadius: 16, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                               <div style={{ height: 160, background: 'linear-gradient(135deg, #ff0000, #cc0000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>▶️</div>
                               </div>
                               <div style={{ padding: '1rem', flex: 1 }}>
                                 <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Watch Tutorial on YouTube</div>
                                 <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click to search for "{item.title}"</div>
                               </div>
                             </div>
                           </a>
                           <NotePad 
                             initialValue={notes} 
                             onSave={(val) => handleNoteChange(cacheKey, val)} 
                             onDownload={() => downloadNotesAsPDF(item)}
                             itemTitle={item.title}
                             readonly={isDone}
                           />
                         </div>
                       )}
                     </div>

                     {/* Exam (Assessment Test) — Below everything */}
                     <div style={{ marginTop: '2.5rem' }}>
                       <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primary-blue)' }}>
                         🎯 Topic Assessment Test
                       </h4>
                        <InlineExam 
                          topic={item.title} 
                          userId={user.id} 
                          language={language} 
                          passedScore={item.score}
                          isCompleted={isDone}
                          onComplete={(s, t) => { handleExamComplete(item.id, s, t); refreshProfile(); }} 
                        />
                     </div>

                     {item.category === 'Projects' && (
                       <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--primary-blue-light)', borderRadius: 20, border: '1px solid var(--border-color)' }}>
                         <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>🚀 Project Briefing</h4>
                         <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                           <img src={`https://picsum.photos/seed/${item.day_number || item.id}/600/400`} alt="Project" style={{ width: 180, height: 110, objectFit: 'cover', borderRadius: 12 }} />
                           <div style={{ flex: 1 }}>
                             <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Build a project based on <strong>{item.title}</strong> using the resources below.</p>
                             <div style={{ display: 'flex', gap: '0.75rem' }}>
                               <a href={`https://github.com/search?q=${encodeURIComponent(item.title)}`} target="_blank" rel="noopener noreferrer" className="btn-ce" style={{ background: '#24292e', color: '#fff', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: 8 }}>GitHub</a>
                               <a href={`https://codepen.io/search/pens?q=${encodeURIComponent(item.title)}`} target="_blank" rel="noopener noreferrer" className="btn-ce" style={{ background: '#000', color: '#fff', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: 8 }}>CodePen</a>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 );
              })}
            <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: '2.5rem', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.25rem' }}>Need a different approach or fresh content?</p>
              <button className="btn-ce btn-ce-secondary" onClick={handleGenerate} disabled={generating} style={{ borderRadius: 12 }}>
                🔄 Regenerate Entire Roadmap
              </button>
            </div>
          </>
        )
      )}

      {section === 'skills' && (
        <div className="glass-panel" style={{ borderRadius: 24, padding: '3rem' }}>
          {!skillGap ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>📊</div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Industry Skill Match</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto 2rem', lineHeight: '1.6' }}>
                {"We'll analyze your current profile against real-world industry requirements for "}<strong>{profile?.career_goal || 'your goal'}</strong>{" and highlight critical gaps."}
              </p>
              <button className="btn-ce btn-ce-primary btn-ce-large" onClick={handleAnalyze} disabled={analyzingGap} style={{ borderRadius: 14 }}>
                {analyzingGap ? '🔍 AI Analyzing Market Data...' : 'Start Full Gap Analysis'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', background: 'var(--primary-blue-light)', padding: '2rem', borderRadius: 20, border: '1px solid var(--primary-blue-glow)' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#fff', border: '6px solid var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'var(--primary-blue)', boxShadow: '0 8px 24px var(--primary-blue-glow)' }}>
                  {skillGap.match_percentage || 0}%
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>Skill Match</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Based on your career goal</div>
                </div>
              </div>
              {skillGap.user_has?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--success-green)' }}>✅ Skills You Have</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {skillGap.user_has.map((s, i) => <span key={i} className="skill-pill selected" style={{ cursor: 'default', fontSize: '0.8rem', padding: '0.4rem 0.85rem', background: 'var(--success-green)', borderColor: 'var(--success-green)' }}>{s}</span>)}
                  </div>
                </div>
              )}
              {skillGap.missing?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--error-red)' }}>❌ Skills to Learn</div>
                  {skillGap.missing.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className={`meta-badge ${s.importance === 'critical' ? 'advanced' : s.importance === 'important' ? 'intermediate' : 'beginner'}`} style={{ flexShrink: 0, marginTop: 2 }}>{s.importance}</span>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</span>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.suggestion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn-ce btn-ce-secondary" onClick={handleAnalyze} disabled={analyzingGap}>🔄 Re-analyze</button>
            </div>
          )}
        </div>
      )}

      {section === 'bookmarks' && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🔖 Saved Resources</div>
          {bookmarks.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No bookmarks yet.</div>
          ) : bookmarks.map(bm => (
            <div key={bm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{bm.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{bm.category} • {bm.resource_type}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button onClick={() => window.open(bm.url, '_blank')} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>Open</button>
                <button onClick={async () => { await removeBookmark(bm.id); setBookmarks(prev => prev.filter(b => b.id !== bm.id)); }}
                  style={{ background: 'none', border: 'none', color: 'var(--error-red)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
