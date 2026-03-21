'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Container } from '@mui/material';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import useCareerStore from '@/store/careerStore';
import { useAuth } from '@/components/Auth/AuthProvider';
import ProgressBar from '@/components/Layout/ProgressBar';

export default function OnboardingSignup() {
  const router = useRouter();
  const { userData, updateUserData } = useCareerStore();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState(userData.name || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      updateUserData('name', fullName);
      updateUserData('email', email);

      // Pass all collected career data as metadata so it's saved during account creation
      await signUp({
        email,
        password,
        fullName,
        metadata: {
          education_level: userData.education || '',
          interests: userData.interests || '',
          experience_level: userData.experienceLevel || '',
          current_job_role: userData.currentRole || '',
          skills: [...(userData.skills || []), ...(userData.customSkills || [])].join(', '),
          career_goal: userData.selectedRole?.title || userData.futureGoals || '',
          location: userData.location || '',
          linkedin_url: userData.linkedinUrl || '',
          portfolio_url: userData.portfolioUrl || '',
          bio: userData.bio || '',
          preferred_language: userData.preferredLanguage || 'English',
          course_duration_days: parseInt(userData.courseDurationDays) || 30,
        }
      });
      
      router.push('/onboarding/bubble-graph');
    } catch (err) {
      setError(err?.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }

  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#fff', py: 8 }}>
      <Container maxWidth="sm">
        <ProgressBar
          currentStep={5}
          totalSteps={6}
          steps={['About', 'Skills', 'Path', 'Goal', 'Social', 'Signup']}
        />
        
        <Box sx={{ textAlign: 'center', mb: 5, mt: 4 }}>
           <h1 className="onboarding-header">Create account</h1>
           <p className="onboarding-subtitle">Your personalized roadmap is ready to be generated</p>
        </Box>

        <Box className="onboarding-card">

           <p className="onboarding-subtitle">Start your journey to a better career today.</p>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 0 }, maxWidth: 440, mx: 'auto' }}>
          {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <button className="btn-ce-social" type="button">
              <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" width="20" alt="Google" />
              Google
            </button>
            <button className="btn-ce-social" type="button">
              <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width="20" alt="GitHub" />
              GitHub
            </button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>OR</span>
            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 3 }}>
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" />
            <Input label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" />
            <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />

            <button 
                className="btn-ce btn-ce-primary btn-ce-full"
                type="submit" 
                disabled={loading || !email.trim() || !password || !fullName.trim() || password !== confirmPassword}
                style={{ marginTop: '1rem', padding: '1.25rem' }}
            >
                {loading ? 'Creating Account...' : 'Create Account & Continue'}
            </button>
            
            <Box sx={{ textAlign: 'center', mt: 3 }}>
                <p style={{ color: '#666' }}>Already have an account? <span style={{ color: 'var(--primary-blue)', cursor: 'pointer', fontWeight: 600 }} onClick={() => router.push('/auth/login')}>Log in</span></p>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
