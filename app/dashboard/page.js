'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Auth/AuthProvider';
import HomeTab from '@/components/Dashboard/HomeTab';
import LearnTab from '@/components/Dashboard/LearnTab';
import AIMentorTab from '@/components/Dashboard/AIMentorTab';
import CareerTab from '@/components/Dashboard/CareerTab';
import JobsTab from '@/components/Dashboard/JobsTab';
import ProfileTab from '@/components/Dashboard/ProfileTab';
import ExamsTab from '@/components/Dashboard/ExamsTab';

import useDashboardStore from '@/store/dashboardStore';
import useCareerStore from '@/store/careerStore';

const TABS = [
  { 
    id: 'home', label: 'Home', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> 
  },
  { 
    id: 'learn', label: 'Learn', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> 
  },
  { 
    id: 'mentor', label: 'AI Mentor', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg> 
  },
  { 
    id: 'jobs', label: 'Jobs', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> 
  },
  { 
    id: 'career', label: 'Career', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> 
  },
  { 
    id: 'exams', label: 'Exams', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> 
  },
  { 
    id: 'profile', label: 'Profile', 
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile, refreshProfile } = useAuth();
  const { activeTab, setActiveTab } = useDashboardStore();
  const { userData, saveProfileToSupabase } = useCareerStore();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  // Sync onboarding: pending localStorage (e.g. Google OAuth) always merges; otherwise backfill from Zustand if DB is thin
  useEffect(() => {
    if (!user || !profile || loading) return;

    let pendingData = null;
    try {
      const stored = localStorage.getItem('pending_onboarding_data');
      if (stored) pendingData = JSON.parse(stored);
    } catch (e) {}

    if (pendingData && typeof pendingData === 'object') {
      updateProfile(pendingData)
        .then(() => {
          localStorage.removeItem('pending_onboarding_data');
          return refreshProfile();
        })
        .then(() => console.log('[Dashboard] Synced pending onboarding data'))
        .catch((e) => console.error('[Dashboard] Pending onboarding sync failed', e));
      return;
    }

    const storeHasData =
      (userData.skills?.length || 0) > 0 ||
      (userData.customSkills?.length || 0) > 0 ||
      !!(userData.currentSelf || '').trim() ||
      !!(userData.futureGoals || '').trim() ||
      !!(userData.currentRole || '').trim();

    const profileThin =
      !(profile.bio || '').trim() ||
      !(profile.skills || '').trim() ||
      !(profile.career_goal || '').trim() ||
      !(profile.experience_level || '').trim();

    if (storeHasData && profileThin) {
      saveProfileToSupabase(user.id)
        .then((res) => {
          if (res?.success) return refreshProfile();
        })
        .then(() => console.log('[Dashboard] Career store synced to profile'))
        .catch((e) => console.error('[Dashboard] Store sync failed', e));
    }
  }, [user, profile, loading, userData, saveProfileToSupabase, updateProfile, refreshProfile]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="ai-loader">
            <div className="ai-ring"></div>
            <div className="ai-ring"></div>
            <div className="ai-ring"></div>
            <span className="ai-brain">🧠</span>
          </div>
          <h2 className="gradient-text" style={{ marginTop: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
            Loading your dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Setting up your personalized workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />;
      case 'learn': return <LearnTab />;
      case 'mentor': return <AIMentorTab />;
      case 'jobs': return <JobsTab />;
      case 'career': return <CareerTab />;
      case 'exams': return <ExamsTab />;
      case 'profile': return <ProfileTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <>
      {/* Dashboard Header (glass-panel, sticky) */}
      <header
        className="glass-panel"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem', borderRadius: 16,
          margin: '1.5rem 1.5rem 1.5rem',
          position: 'sticky', top: '0.75rem', zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            AI Career Explorer
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3rem 0.85rem', borderRadius: 999,
            background: 'var(--primary-blue-light)', border: '1px solid var(--border-color)',
            fontSize: '0.8rem', fontWeight: 600,
          }}>
            <span>⚡</span>
            <span style={{ color: 'var(--primary-blue)' }}>{profile?.xp_points || 0} XP</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Lv {profile?.level || 1}</span>
          </div>
          <div
            onClick={() => setActiveTab('profile')}
            title="Profile Settings"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-blue), var(--blob-2))',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
          >
            {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        {renderTab()}
      </div>

      {/* Bottom Navigation (glassmorphism) */}
      <nav className="bottom-nav">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} className={`bottom-nav-item ${isActive ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {isActive && <div className="bottom-nav-indicator" />}
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
