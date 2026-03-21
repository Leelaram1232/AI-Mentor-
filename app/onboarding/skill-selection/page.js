'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Box, Container, CircularProgress } from '@mui/material';
import Button from '@/components/UI/Button';
import ProgressBar from '@/components/Layout/ProgressBar';
import useCareerStore from '@/store/careerStore';
import { generateSkillSuggestions } from '@/utils/groqApi';

export default function SkillSelection() {
    const router = useRouter();
    const { userData, updateUserData, aiSuggestions, updateAISuggestions, nextStep, previousStep } = useCareerStore();
    const [skills, setSkills] = useState(aiSuggestions.skillSuggestions || []);
    const [loading, setLoading] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState(userData.skills || []);

    useEffect(() => {
        if (skills.length === 0 && (userData.selectedRole || userData.currentRole)) {
            fetchSkills();
        }
    }, []);

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const context = {
                currentSelf: userData.currentRole,
                futureGoals: userData.selectedRole?.title || 'Growth',
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

    const toggleSkill = (skill) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
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
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <h1 className="onboarding-header">
                        Select your skills
                    </h1>
                    <p className="onboarding-subtitle">
                        Choose the skills you already know
                    </p>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
                        <CircularProgress size={60} thickness={4} sx={{ color: '#2563eb' }} />
                        <p style={{ marginTop: '20px', color: '#64748b', fontSize: '1.1rem' }}>AI is mapping relevant skills...</p>
                    </Box>
                ) : (
                    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                        <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: { xs: 1.5, md: 2 }, 
                            justifyContent: 'center',
                            mb: 8
                        }}>
                            {skills.map((skill, index) => {
                                const isSelected = selectedSkills.includes(skill);
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        onClick={() => toggleSkill(skill)}
                                        className={`skill-pill ${isSelected ? 'selected' : ''}`}
                                        style={{
                                            padding: '0.85rem 1.75rem',
                                            borderRadius: '50px',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                                            backgroundColor: isSelected ? '#3b82f6' : '#f8fafc',
                                            color: isSelected ? '#fff' : '#0f172a',
                                            boxShadow: isSelected 
                                                ? '0 8px 16px rgba(59, 130, 246, 0.3)' 
                                                : 'none',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {skill}
                                    </motion.div>
                                );
                            })}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="btn-ce btn-ce-secondary"
                                style={{ padding: '1rem 3rem', borderRadius: '12px', fontSize: '1.05rem' }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleContinue}
                                className="btn-ce btn-ce-primary"
                                style={{
                                    padding: '1rem 4rem',
                                    fontSize: '1.1rem',
                                    background: '#2563eb',
                                    borderRadius: '12px'
                                }}
                            >
                                Continue to Graph
                            </button>
                        </Box>
                    </Box>
                )}
            </Container>
        </Box>
    );
}
