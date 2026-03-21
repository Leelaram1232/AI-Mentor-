'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import useCareerStore from '@/store/careerStore';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import ProgressBar from '@/components/Layout/ProgressBar';
import { Box, MenuItem } from '@mui/material';

const WORD_LIMIT = 50;

export default function Step1() {
    const router = useRouter();
    const { userData, updateUserData, nextStep } = useCareerStore();

    const [name, setName] = useState(userData.name || '');
    const [education, setEducation] = useState(userData.education || '');
    const [experienceLevel, setExperienceLevel] = useState(userData.experienceLevel || '');
    const [currentRole, setCurrentRole] = useState(userData.currentRole || '');
    const [currentSelf, setCurrentSelf] = useState(userData.currentSelf || '');

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'Please enter your name';
        if (!education.trim()) newErrors.education = 'Please enter your education';
        if (!experienceLevel) newErrors.experienceLevel = 'Please select your experience level';
        if (!currentRole.trim()) newErrors.currentRole = 'Please enter your current or previous role';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validate()) return;

        updateUserData('name', name.trim());
        updateUserData('education', education.trim());
        updateUserData('experienceLevel', experienceLevel);
        updateUserData('currentRole', currentRole.trim());
        updateUserData('currentSelf', currentSelf.trim());
        nextStep();
        router.push('/onboarding/step2');
    };



    const handleBack = () => {
        router.push('/onboarding');
    };

    return (
        <div className="centered-container">
            <div className="centered-content">
                <ProgressBar
                    currentStep={0}
                    totalSteps={6}
                    steps={['Basics', 'Skills', 'Role', 'Goals', 'Social', 'Signup']}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="onboarding-header">About You</h1>
                    <p className="onboarding-subtitle">Tell us about your background to customize your roadmap</p>

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
                            label="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            error={!!errors.name}
                            helperText={errors.name}
                        />

                        <Input
                            label="Education / Major"
                            value={education}
                            onChange={(e) => setEducation(e.target.value)}
                            placeholder="e.g. BSc Computer Science"
                            error={!!errors.education}
                            helperText={errors.education}
                        />

                        <Input
                            label="Current or Previous Role (Last Job)"
                            value={currentRole}
                            onChange={(e) => {
                                setCurrentRole(e.target.value);
                                setErrors((prev) => ({ ...prev, currentRole: null }));
                            }}
                            placeholder="e.g. Frontend Intern, Data Analyst Student"
                            error={!!errors.currentRole}
                            helperText={errors.currentRole}
                        />

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
                            label="Professional Bio / Situation (AI Context)"
                            value={currentSelf}
                            onChange={(e) => setCurrentSelf(e.target.value)}
                            placeholder="e.g. I am a self-taught developer who wants to transition into AI research..."
                            multiline
                            rows={3}
                            helperText="This helps AI personalize your questions and roadmaps."
                        />

                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Button variant="outlined" onClick={handleBack} fullWidth>
                                Back
                            </Button>
                            <Button
                                type="submit"
                                fullWidth
                                disabled={!name.trim() || !education.trim() || !currentRole.trim() || !experienceLevel}
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
