'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Box, Container, CircularProgress } from '@mui/material';
import Button from '@/components/UI/Button';
import ProgressBar from '@/components/Layout/ProgressBar';
import SkillPicker from '@/components/UI/SkillPicker';
import useCareerStore from '@/store/careerStore';
import { generateSkillSuggestions } from '@/utils/groqApi';

export default function SkillSelection() {
    const router = useRouter();
    const { userData, updateUserData, aiSuggestions, updateAISuggestions, nextStep, previousStep } = useCareerStore();
    const [skills, setSkills] = useState(aiSuggestions.skillSuggestions || []);
    const [loading, setLoading] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState([...(userData.skills || []), ...(userData.customSkills || [])]);

    useEffect(() => {
        if (skills.length === 0 && (userData.selectedRole || userData.currentRole)) {
            fetchSkills();
        }
    }, [userData.selectedRole, userData.currentRole]);

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const context = {
                currentSelf: userData.currentRole || userData.currentSelf,
                futureGoals: userData.selectedRole?.title || userData.futureGoals || 'Growth',
                experience: []
            };
            const suggested = await generateSkillSuggestions(context);
            setSkills(suggested);
            updateAISuggestions('skillSuggestions', suggested);
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        updateUserData('skills', selectedSkills.filter((s) => skills.includes(s)));
        updateUserData('customSkills', selectedSkills.filter((s) => !skills.includes(s)));
        nextStep();
        router.push('/onboarding/bubble-graph');
    };

    const handleBack = () => {
        previousStep();
        router.push('/onboarding/profile');
    };

    return (
        <Box sx={{ minHeight: '100vh', py: 8, background: 'transparent' }}>
            <Container maxWidth="md">
                <ProgressBar
                    currentStep={2}
                    totalSteps={5}
                    steps={['Role', 'Profile', 'Skills', 'Paths', 'Signup']}
                />
                
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <h1 className="onboarding-header">
                            Select your skills
                        </h1>
                        <p className="onboarding-subtitle">
                            Choose or type the skills you already know
                        </p>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
                            <CircularProgress size={60} thickness={4} sx={{ color: '#2563eb' }} />
                            <p style={{ marginTop: '20px', color: '#64748b', fontSize: '1.1rem' }}>AI is mapping relevant skills...</p>
                        </Box>
                    ) : (
                        <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                            <Box className="glass-panel" sx={{ p: { xs: 3, md: 5 }, borderRadius: '24px', mb: 4 }}>
                                <SkillPicker
                                    label="Select or add your skills"
                                    suggestions={skills}
                                    selectedSkills={selectedSkills}
                                    onChange={(newSkills) => setSelectedSkills(newSkills)}
                                    placeholder="e.g. React, Python, Figma..."
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="btn-ce btn-ce-secondary"
                                    style={{ flex: 1, padding: '1rem', borderRadius: '12px', fontSize: '1.05rem', maxWidth: '200px' }}
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleContinue}
                                    className="btn-ce btn-ce-primary"
                                    style={{
                                        flex: 2,
                                        padding: '1rem',
                                        fontSize: '1.05rem',
                                        background: '#2563eb',
                                        borderRadius: '12px'
                                    }}
                                >
                                    Continue to Graph
                                </button>
                            </Box>
                        </Box>
                    )}
                </motion.div>
            </Container>
        </Box>
    );
}
