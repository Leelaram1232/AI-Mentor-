'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Box, Container, CircularProgress } from '@mui/material';
import Button from '@/components/UI/Button';
import useCareerStore from '@/store/careerStore';
import { generateCareerPaths } from '@/utils/groqApi';
import ProgressBar from '@/components/Layout/ProgressBar';

export default function RoleSelection() {
    const router = useRouter();
    const { userData, updateUserData, aiSuggestions, updateAISuggestions } = useCareerStore();
    const [roles, setRoles] = useState(aiSuggestions.careerPaths || []);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(userData.selectedRole?.title || null);

    useEffect(() => {
        if (roles.length === 0 && userData.currentRole) {
            fetchRoles();
        }
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const suggestedRoles = await generateCareerPaths({
                currentSelf: userData.currentRole,
                futureGoals: userData.futureGoals || 'Progress in my career',
                experience: userData.experience || [],
                skills: [...(userData.skills || []), ...(userData.customSkills || [])]
            });

            const topRoles = suggestedRoles.slice(0, 4);
            setRoles(topRoles);
            updateAISuggestions('careerPaths', topRoles);
        } catch (error) {
            console.error('Error fetching roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (role) => {
        setSelectedId(role.title);
        updateUserData('selectedRole', role);
    };

    const handleContinue = () => {
        if (!selectedId) return;
        router.push('/onboarding/preferences');
    };

    return (
        <Box sx={{ minHeight: '100vh', py: 8, background: '#fff' }}>
            <Container maxWidth="md">
                <ProgressBar
                    currentStep={2}
                    totalSteps={6}
                    steps={['About', 'Skills', 'Path', 'Goal', 'Social', 'Signup']}
                />
                
                <Box sx={{ textAlign: 'center', mb: 8, mt: 4 }}>
                    <h1 className="onboarding-header">Target Career Path</h1>
                    <p className="onboarding-subtitle">Based on your expertise, AI suggests these potential directions</p>
                </Box>


                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
                        <CircularProgress size={60} thickness={4} sx={{ color: '#2563eb' }} />
                        <p style={{ marginTop: '20px', color: '#64748b', fontSize: '1.1rem' }}>AI is analyzing your background...</p>
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gap: 2, maxWidth: 800, mx: 'auto' }}>
                        <AnimatePresence>
                            {roles.map((role, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleSelect(role)}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '2rem 2.5rem',
                                        borderRadius: '16px',
                                        border: `1px solid ${selectedId === role.title ? '#3b82f6' : '#e2e8f0'}`,
                                        backgroundColor: selectedId === role.title ? '#f0f7ff' : '#f8fafc',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <h3 style={{ 
                                        fontSize: '1.75rem', 
                                        fontWeight: 700, 
                                        color: selectedId === role.title ? '#2563eb' : '#0f172a',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {role.title}
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                                        {role.description}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <Box sx={{ textAlign: 'center', mt: 6 }}>
                            <button
                                onClick={handleContinue}
                                disabled={!selectedId}
                                className="btn-ce btn-ce-primary"
                                style={{
                                    padding: '1rem 4rem',
                                    fontSize: '1.1rem',
                                    background: '#2563eb',
                                    borderRadius: '12px'
                                }}
                            >
                                Continue
                            </button>
                        </Box>
                    </Box>
                )}
            </Container>
        </Box>
    );
}
