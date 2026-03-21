'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import useCareerStore from '@/store/careerStore';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import ProgressBar from '@/components/Layout/ProgressBar';
import { Box, MenuItem } from '@mui/material';

export default function ProfileStep() {
    const router = useRouter();
    const { userData, updateUserData, nextStep, previousStep } = useCareerStore();

    const [experienceLevel, setExperienceLevel] = useState(userData.experienceLevel || '');
    const [currentSelf, setCurrentSelf] = useState(userData.currentSelf || '');
    const [futureGoals, setFutureGoals] = useState(userData.futureGoals || '');
    const [interests, setInterests] = useState(userData.interests || '');
    const [preferredLanguage, setPreferredLanguage] = useState(userData.preferredLanguage || 'English');
    const [courseDurationDays, setCourseDurationDays] = useState(userData.courseDurationDays || 30);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!experienceLevel) newErrors.experienceLevel = 'Please select your experience level';
        if (!futureGoals.trim()) newErrors.futureGoals = 'Please set a career goal';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validate()) return;

        updateUserData('experienceLevel', experienceLevel);
        updateUserData('currentSelf', currentSelf.trim());
        updateUserData('futureGoals', futureGoals.trim());
        updateUserData('interests', interests.trim());
        updateUserData('preferredLanguage', preferredLanguage);
        updateUserData('courseDurationDays', courseDurationDays);
        
        nextStep();
        router.push('/onboarding/skill-selection');
    };

    const handleBack = () => {
        previousStep();
        router.push('/onboarding/role-input');
    };

    return (
        <div className="centered-container">
            <div className="centered-content">
                <ProgressBar
                    currentStep={1}
                    totalSteps={5}
                    steps={['Role', 'Profile', 'Skills', 'Paths', 'Signup']}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="onboarding-header">Your Career Profile</h1>
                    <p className="onboarding-subtitle">Help AI customize your unique learning roadmap</p>

                    <Box
                        component="form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleNext();
                        }}
                        sx={{ display: 'grid', gap: 3 }}
                        className="onboarding-card"
                    >
                        <Input
                            select
                            label="Experience level"
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            error={!!errors.experienceLevel}
                            helperText={errors.experienceLevel}
                        >
                            <MenuItem value="fresher">Fresher / Student</MenuItem>
                            <MenuItem value="experienced">Experienced Professional</MenuItem>
                        </Input>

                        <Input
                            label="Professional Bio / Current Situation"
                            value={currentSelf}
                            onChange={(e) => setCurrentSelf(e.target.value)}
                            placeholder="e.g. I am a self-taught developer who wants to transition into AI research..."
                            multiline
                            rows={3}
                            helperText="This helps AI understand your exact context."
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>🎯 FUTURE FOCUS</span>
                            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        </Box>

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

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>📚 LEARNING PREFERENCES</span>
                            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                            <Input
                                select
                                label="Preferred Language"
                                value={preferredLanguage}
                                onChange={(e) => setPreferredLanguage(e.target.value)}
                            >
                                <MenuItem value="English">🌐 English</MenuItem>
                                <MenuItem value="Hindi">🇮🇳 Hindi</MenuItem>
                                <MenuItem value="Telugu">🇮🇳 Telugu</MenuItem>
                                <MenuItem value="Tamil">🇮🇳 Tamil</MenuItem>
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
                                type="submit"
                                fullWidth
                                disabled={!experienceLevel || !futureGoals.trim()}
                            >
                                Continue
                            </Button>
                        </Box>
                    </Box>
                </motion.div>
            </div>
        </div>
    );
}
