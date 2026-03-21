'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { getStreaks, getBadges, getUserRoadmap } from '@/utils/authClient';

export default function HomeTab() {
  const { user, profile } = useAuth();
  const [streaks, setStreaks] = useState([]);
  const [badges, setBadges] = useState([]);
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [s, b, r] = await Promise.allSettled([getStreaks(user.id, 30), getBadges(user.id), getUserRoadmap(user.id)]);
        setStreaks(s.status === 'fulfilled' ? s.value : []);
        setBadges(b.status === 'fulfilled' ? b.value : []);
        setRoadmap(r.status === 'fulfilled' ? r.value : null);
      } catch (e) { console.error(e); }
    })();
  }, [user]);

  const currentStreak = calculateStreak(streaks);
  const completedSteps = roadmap?.completed_steps || 0;
  const totalSteps = roadmap?.total_steps || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Welcome Card */}
      <div className="glass-panel" style={{ borderRadius: 20, padding: '2rem 2.5rem', background: 'linear-gradient(135deg, var(--glass-bg), rgba(37, 99, 235, 0.05))' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
          {profile?.career_goal
            ? `Keep pushing towards becoming a ${profile.career_goal}!`
            : 'Set a career goal in your profile to get personalized recommendations.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
        <StatCard label="Day Streak" value={currentStreak} color="#ef4444" />
        <StatCard label="XP Points" value={profile?.xp_points || 0} color="#3b82f6" />
        <StatCard label="Badges" value={badges.length} color="#f59e0b" />
        <StatCard label="Level" value={profile?.level || 1} color="#10b981" />
      </div>

      {/* Learning Progress */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600 }}>Learning Progress</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{progress}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--border-color)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary-blue), var(--success-green))', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          {totalSteps > 0 ? `${completedSteps} of ${totalSteps} steps completed` : 'Generate a roadmap in the Learn tab to start!'}
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>🏆 Badges</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {badges.slice(0, 6).map(b => (
              <span key={b.id} className="skill-pill" style={{ cursor: 'default', fontSize: '0.85rem' }}>
                {b.badge_icon} {b.badge_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Week Streaks */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '1.5rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>🔥 This Week</div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
          {getLast7Days().map(day => {
            const hasActivity = streaks.some(s => s.activity_date === day.date);
            return (
              <div key={day.date} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>{day.label}</div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', margin: '0 auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: hasActivity ? 'linear-gradient(135deg, var(--primary-blue), var(--success-green))' : 'var(--input-bg)',
                  border: hasActivity ? 'none' : '1px solid var(--border-color)', fontSize: '0.85rem',
                }}>
                  {hasActivity ? '✅' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="glass-card" style={{ borderRadius: 16, padding: '1.5rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>💡 Quick Tips</div>
        {[
          { icon: '📍', text: 'Generate your learning roadmap in the Learn tab' },
          { icon: '💬', text: 'Chat with your AI mentor for career advice' },
          { icon: '📎', text: 'Build your resume in the Career tab' },
          { icon: '🎯', text: 'Practice with mock interviews to prepare' },
        ].map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>{tip.icon}</span><span>{tip.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="glass-card" style={{ borderRadius: 16, padding: '1.25rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function calculateStreak(streaks) {
  if (!streaks.length) return 0;
  const sorted = [...streaks].sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date));
  let streak = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].activity_date); d.setHours(0,0,0,0);
    const expected = new Date(today); expected.setDate(expected.getDate() - i);
    if (d.getTime() === expected.getTime()) streak++;
    else break;
  }
  return streak;
}

function getLast7Days() {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    result.push({ label: days[d.getDay()], date: d.toISOString().split('T')[0] });
  }
  return result;
}
