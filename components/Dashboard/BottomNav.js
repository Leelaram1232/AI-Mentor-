'use client';

import { Box } from '@mui/material';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'learn', label: 'Learn', icon: '📚' },
  { id: 'mentor', label: 'AI Mentor', icon: '🤖' },
  { id: 'career', label: 'Career', icon: '💼' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        px: 1,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Box
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.25,
              cursor: 'pointer',
              flex: 1,
              py: 0.75,
              position: 'relative',
              transition: 'all var(--transition-fast)',
              '&:hover': { opacity: 0.8 },
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -1,
                  width: 32,
                  height: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, var(--primary), #10b981)',
                }}
              />
            )}
            <span
              style={{
                fontSize: isActive ? '1.5rem' : '1.3rem',
                transition: 'all 0.2s ease',
                transform: isActive ? 'translateY(-2px)' : 'none',
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary)' : 'var(--secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </span>
          </Box>
        );
      })}
    </Box>
  );
}
