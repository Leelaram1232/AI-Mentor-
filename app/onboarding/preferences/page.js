'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Box, Container, MenuItem } from '@mui/material';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import useCareerStore from '@/store/careerStore';
import ProgressBar from '@/components/Layout/ProgressBar';

export default function PreferencesStep() {
    const router = useRouter();
    const { userData, updateUserData, nextStep, previousStep } = useCareerStore();

    const [futureGoals, setFutureGoals] = useState(userData.futureGoals || '');
    const [interests, setInterests] = useState(userData.interests || '');
    const [preferredLanguage, setPreferredLanguage] = useState(userData.preferredLanguage || 'English');
    const [courseDurationDays, setCourseDurationDays] = useState(userData.courseDurationDays || 30);
    const [errors, setErrors] = useState({});

    const handleContinue = () => {
        if (!futureGoals.trim()) {
            setErrors({ futureGoals: 'Please set a career goal' });
            return;
        }
        updateUserData('futureGoals', futureGoals.trim());
        updateUserData('interests', interests.trim());
        updateUserData('preferredLanguage', preferredLanguage);
        updateUserData('courseDurationDays', courseDurationDays);
        nextStep();
        router.push('/onboarding/social-profile');
    };

    const handleBack = () => {
        previousStep();
        router.push('/onboarding/role-selection');
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#fff', py: 8 }}>
            <Container maxWidth="md">
                <ProgressBar
                    currentStep={3}
                    totalSteps={6}
                    steps={['About', 'Skills', 'Path', 'Goal', 'Social', 'Signup']}
                />
                
                <Box sx={{ textAlign: 'center', mb: 6, mt: 4 }}>
                    <h1 className="onboarding-header">Learning Goals</h1>
                    <p className="onboarding-subtitle">Personalize how you want to learn</p>
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
                            label="What is your main career goal?"
                            value={futureGoals}
                            onChange={(e) => setFutureGoals(e.target.value)}
                            placeholder="e.g. Become a Senior Frontend Engineer"
                            error={!!errors.futureGoals}
                            helperText={errors.futureGoals}
                            multiline
                            rows={2}
                        />

                        <Input
                            label="Other interests (comma separated)"
                            value={interests}
                            onChange={(e) => setInterests(e.target.value)}
                            placeholder="e.g. AI, UI/UX, Cloud, Mobile"
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                            <Input
                                select
                                label="Preferred Language"
                                value={preferredLanguage}
                                onChange={(e) => setPreferredLanguage(e.target.value)}
                            >
                                <MenuItem value="English">🌐 English</MenuItem>
                                <MenuItem value="Hindi">🇮🇳 Hindi</MenuItem>
                                <MenuItem value="Spanish">🇪🇸 Spanish</MenuItem>
                                <MenuItem value="French">🇫🇷 French</MenuItem>
                                <MenuItem value="German">🇩🇪 German</MenuItem>
                            </Input>

                            <Input
                                select
                                label="Learning Pace"
                                value={courseDurationDays}
                                onChange={(e) => setCourseDurationDays(e.target.value)}
                            >
                                <MenuItem value={7}>⚡ 7 Days (Sprint)</MenuItem>
                                <MenuItem value={30}>📅 30 Days (Standard)</MenuItem>
                                <MenuItem value={90}>🎯 90 Days (Mastery)</MenuItem>
                            </Input>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button variant="outlined" onClick={handleBack} fullWidth>
                                Back
                            </Button>
                            <Button
                                onClick={handleContinue}
                                fullWidth
                                disabled={!futureGoals.trim()}
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
