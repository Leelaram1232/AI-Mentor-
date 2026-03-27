'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Box, Container, CircularProgress, Typography } from '@mui/material';
import Button from '@/components/UI/Button';
import ProgressBar from '@/components/Layout/ProgressBar';
import useCareerStore from '@/store/careerStore';
import { generateRelatedCareerNodes } from '@/utils/groqApi';

import { useAuth } from '@/components/Auth/AuthProvider';

export default function BubbleGraph() {
    const router = useRouter();
    const { user } = useAuth();
    const { userData, saveProfileToSupabase, updateUserData } = useCareerStore();
    const [centerNode, setCenterNode] = useState(userData.selectedRole?.title || userData.futureGoals || 'Professional');
    const [surroundingNodes, setSurroundingNodes] = useState([]);
    const [isLoadingAI, setIsLoadingAI] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchNodes() {
            try {
                const nodes = await generateRelatedCareerNodes(centerNode);
                setSurroundingNodes(nodes);
            } catch (error) {
                console.error('Failed to fetch AI nodes:', error);
                // Fallback
                setSurroundingNodes([
                    'Android App...', 'iOS App Developer', 'UX/UI Designer', 'Cloud Engineer',
                    'Graphics Designer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer',
                    'Artificial Intellig...'
                ]);
            } finally {
                setIsLoadingAI(false);
            }
        }
        fetchNodes();
    }, [centerNode]);

    const handleFinish = async () => {
        // Always persist graph center as career focus so signup/metadata includes it
        updateUserData('selectedRole', { id: null, title: centerNode });

        if (user) {
            setIsSaving(true);
            try {
                // Pass user.id directly to avoid redundant getCurrentUser() network call
                await saveProfileToSupabase(user.id);
                // Navigate immediately — dashboard will load fresh profile on mount
                router.push('/dashboard');
            } catch (err) {
                console.error(err);
                router.push('/dashboard');
            } finally {
                setIsSaving(false);
            }
        } else {
            router.push('/onboarding/signup');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const nodeVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 12, stiffness: 200 } }
    };

    const calculatePosition = (index, total, radius = 220) => {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            background: 'transparent', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            pt: 4
        }}>
            <Container maxWidth="md" sx={{ zIndex: 1, position: 'relative' }}>
                <ProgressBar
                    currentStep={3}
                    totalSteps={5}
                    steps={['Role', 'Profile', 'Skills', 'Paths', 'Signup']}
                />
            </Container>

            {/* Background Dots */}
            <Box sx={{
                position: 'fixed',
                inset: 0,
                opacity: 0.05,
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                zIndex: 0
            }} />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <AnimatePresence mode="wait">
                    {isLoadingAI ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ textAlign: 'center' }}
                        >
                            <CircularProgress size={60} thickness={4} sx={{ color: '#3b82f6', mb: 2 }} />
                            <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                                AI is mapping your career landscape...
                            </Typography>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="graph"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            style={{ position: 'relative', width: 0, height: 0 }}
                        >
                            {/* Lines */}
                            {surroundingNodes.map((_, i) => {
                                const pos = calculatePosition(i, surroundingNodes.length);
                                return (
                                    <motion.div
                                        key={`line-${i}`}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 0.1 }}
                                        transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                                        style={{
                                            position: 'absolute',
                                            width: '2px',
                                            height: '220px',
                                            background: '#cbd5e1',
                                            left: '50%',
                                            top: '50%',
                                            transformOrigin: 'top center',
                                            transform: `rotate(${((i / surroundingNodes.length) * 360) + 90}deg)`,
                                            zIndex: 1
                                        }}
                                    />
                                );
                            })}

                            {/* Central Node */}
                            <motion.div
                                variants={nodeVariants}
                                style={{
                                    position: 'absolute',
                                    width: 240,
                                    height: 240,
                                    borderRadius: '50%',
                                    backgroundColor: '#3b82f6',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: '#fff',
                                    fontSize: '1.75rem',
                                    fontWeight: 800,
                                    textAlign: 'center',
                                    padding: '30px',
                                    boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
                                    left: -120,
                                    top: -120,
                                    zIndex: 10
                                }}
                            >
                                {centerNode}
                            </motion.div>

                            {/* Surrounding Nodes */}
                            {surroundingNodes.map((node, i) => {
                                const pos = calculatePosition(i, surroundingNodes.length);
                                return (
                                    <motion.div
                                        key={i}
                                        variants={nodeVariants}
                                        style={{
                                            position: 'absolute',
                                            width: 110,
                                            height: 110,
                                            borderRadius: '50%',
                                            backgroundColor: '#fff',
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: '#0f172a',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            textAlign: 'center',
                                            padding: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            left: pos.x - 55,
                                            top: pos.y - 55,
                                            zIndex: 5,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                        whileHover={{ scale: 1.1, borderColor: '#3b82f6', color: '#3b82f6', zIndex: 12 }}
                                    >
                                        {node}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Container>

            <Box sx={{ mt: 8, zIndex: 10 }}>
                <button
                    onClick={handleFinish}
                    disabled={isLoadingAI || isSaving}
                    className="btn-ce btn-ce-primary"
                    style={{
                        padding: '1rem 4rem',
                        fontSize: '1.2rem',
                        background: '#2563eb',
                        borderRadius: '50px',
                        boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)',
                        opacity: (isLoadingAI || isSaving) ? 0.7 : 1,
                        cursor: (isLoadingAI || isSaving) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}
                >
                    {isSaving && <CircularProgress size={20} sx={{ color: '#fff' }} />}
                    {isSaving ? 'Saving Profile...' : user ? 'Save & Go to Dashboard' : 'Create Account to Save'}
                </button>
            </Box>
        </Box>
    );
}
