'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Box, Container } from '@mui/material';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import useCareerStore from '@/store/careerStore';
import ProgressBar from '@/components/Layout/ProgressBar';

export default function SocialProfileStep() {
    const router = useRouter();
    const { userData, updateUserData, nextStep, previousStep } = useCareerStore();

    const [location, setLocation] = useState(userData.location || '');
    const [linkedinUrl, setLinkedinUrl] = useState(userData.linkedinUrl || '');
    const [portfolioUrl, setPortfolioUrl] = useState(userData.portfolioUrl || '');
    const [bio, setBio] = useState(userData.bio || '');

    const handleContinue = () => {
        updateUserData('location', location.trim());
        updateUserData('linkedinUrl', linkedinUrl.trim());
        updateUserData('portfolioUrl', portfolioUrl.trim());
        updateUserData('bio', bio.trim());
        nextStep();
        router.push('/onboarding/signup');
    };

    const handleBack = () => {
        previousStep();
        router.push('/onboarding/preferences');
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#fff', py: 8 }}>
            <Container maxWidth="md">
                <ProgressBar
                    currentStep={4}
                    totalSteps={6}
                    steps={['About', 'Skills', 'Path', 'Goal', 'Social', 'Signup']}
                />

                <Box sx={{ textAlign: 'center', mb: 6, mt: 4 }}>
                    <h1 className="onboarding-header">Final Polish</h1>
                    <p className="onboarding-subtitle">Your profile is almost search-ready</p>
                </Box>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="onboarding-card"
                    style={{ maxWidth: 650, margin: '0 auto' }}
                >
                    <Box sx={{ display: 'grid', gap: 3 }}>
                        <Input
                            label="Where are you located?"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="City, Country"
                        />

                        <Input
                            label="LinkedIn Profile URL"
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder="linkedin.com/in/username"
                        />

                        <Input
                            label="Portfolio or GitHub URL"
                            value={portfolioUrl}
                            onChange={(e) => setPortfolioUrl(e.target.value)}
                            placeholder="portfolio.me or github.com/username"
                        />

                        <Input
                            label="Brief professional bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="e.g. Passionate software engineer..."
                            multiline
                            rows={3}
                        />

                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button variant="outlined" onClick={handleBack} fullWidth>
                                Back
                            </Button>
                            <Button
                                onClick={handleContinue}
                                fullWidth
                            >
                                Continue
                            </Button>
                        </Box>
                    </Box>
                </motion.div>

            </Container>
        </Box>
    );
}
