'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <main
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 880,
          minHeight: 560,
          margin: '2rem',
          padding: '2.5rem',
          borderRadius: 24,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '1.5rem',
        }}
      >
        <div style={{ fontSize: '3.5rem', animation: 'bounce 2s infinite' }}>🚀</div>
        <h1 className="gradient-text" style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '0.5rem',
        }}>
          AI Career Explorer
        </h1>
        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
          color: 'var(--text-secondary)',
          fontWeight: 400,
          lineHeight: 1.5,
          maxWidth: 500,
        }}>
          Discover your career path with AI-powered insights and<br />personalized learning roadmaps
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', marginTop: '1rem', width: '100%', maxWidth: 440 }}>
          <button
            className="btn-ce btn-ce-primary btn-ce-large btn-ce-glow btn-ce-full"
            onClick={() => router.push('/onboarding/role-input')}
          >
            Get Started
          </button>
          <button
            className="btn-ce btn-ce-secondary btn-ce-large btn-ce-full"
            onClick={() => router.push('/auth/login')}
          >
            Already have an account? Login
          </button>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          {['🤖 AI Mentor', '📊 Skill Gap', '🗺️ Roadmap', '📝 Resume Builder', '💼 Job Finder', '🎯 Mock Interviews'].map(tag => (
            <span key={tag} className="skill-pill" style={{ cursor: 'default', opacity: 0.85, fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              {tag}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
