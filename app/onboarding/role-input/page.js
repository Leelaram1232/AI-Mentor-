'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Box, Container } from '@mui/material';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import ProgressBar from '@/components/Layout/ProgressBar';
import useCareerStore from '@/store/careerStore';

export default function RoleInput() {
    const router = useRouter();
    const { userData, updateUserData, nextStep } = useCareerStore();
    const [role, setRole] = useState(userData.currentRole || '');

    const handleContinue = () => {
        if (!role.trim()) return;
        updateUserData('currentRole', role.trim());
        nextStep();
        router.push('/onboarding/profile');
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'transparent' }}>
            <Container maxWidth="md">
                <ProgressBar
                    currentStep={0}
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
                            What's your current or<br />previous role?
                        </h1>
                        <p className="onboarding-subtitle">
                            Tell us about your professional background
                        </p>
                    </Box>

                    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                        <Box sx={{ position: 'relative', mb: 4 }}>
                            <input
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="e.g. Game developer"
                                autoFocus
                                className="custom-input-ce"
                                style={{
                                    fontSize: '1.5rem',
                                    textAlign: 'left',
                                    border: '2px solid #3b82f6',
                                    borderRadius: '12px',
                                    padding: '1.25rem'
                                }}
                            />
                        </Box>

                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <button
                                onClick={handleContinue}
                                disabled={!role.trim()}
                                className="btn-ce btn-ce-primary"
                                style={{
                                    padding: '1rem 3rem',
                                    fontSize: '1.1rem',
                                    background: '#2563eb',
                                    borderRadius: '12px'
                                }}
                            >
                                Continue
                            </button>
                        </Box>
                    </Box>
                </motion.div>
            </Container>
        </Box>
    );
}
