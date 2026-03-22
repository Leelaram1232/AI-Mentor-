'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import useCareerStore from '@/store/careerStore';
import Button from '@/components/UI/Button';
import ProgressBar from '@/components/Layout/ProgressBar';
import CircularCareerMap from '@/components/CareerVisualization/CircularCareerMap';
import { Box, CircularProgress, Card, CardContent } from '@mui/material';
import { generateCareerPaths } from '@/utils/groqApi';
import { useAuth } from '@/components/Auth/AuthProvider';

export default function Results() {
    const router = useRouter();
    const { user } = useAuth();
    const {
        userData,
        aiSuggestions,
        updateAISuggestions,
        getUserContext,
        resetStore,
    } = useCareerStore();

    const [careerPaths, setCareerPaths] = useState(aiSuggestions.careerPaths || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (careerPaths.length === 0) {
            generateCareerSuggestions();
        }
    }, []);

    const generateCareerSuggestions = async () => {
        setLoading(true);
        try {
            const context = getUserContext();
            const paths = await generateCareerPaths(context);
            setCareerPaths(paths);
            updateAISuggestions('careerPaths', paths);
        } catch (error) {
            console.error('Error generating career paths:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartOver = () => {
        resetStore();
        router.push('/onboarding');
    };

    return (
        <div className="centered-container" style={{ minHeight: '100vh', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                <ProgressBar
                    currentStep={2}
                    totalSteps={3}
                    steps={['About You', 'Experience & Skills', 'Career Paths']}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1
                        style={{
                            fontSize: 'var(--font-size-3xl)',
                            fontWeight: 700,
                            marginBottom: 'var(--spacing-sm)',
                            textAlign: 'center',
                        }}
                    >
                        Your Career Pathways
                    </h1>
                    <p
                        style={{
                            fontSize: 'var(--font-size-lg)',
                            color: 'var(--secondary)',
                            marginBottom: 'var(--spacing-xl)',
                            textAlign: 'center',
                        }}
                    >
                        Explore personalized career opportunities based on your profile
                    </p>

                    {/* User Summary Card */}
                    <Card
                        sx={{
                            mb: 4,
                            backgroundColor: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                        }}
                    >
                        <CardContent>
                            <h3
                                style={{
                                    fontSize: 'var(--font-size-lg)',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-md)',
                                }}
                            >
                                Your Profile Summary
                            </h3>
                            <Box sx={{ display: 'grid', gap: 2 }}>
                                <div>
                                    <strong>Current Self:</strong> {userData.currentSelf}
                                </div>
                                <div>
                                    <strong>Future Goals:</strong> {userData.futureGoals}
                                </div>
                                <div>
                                    <strong>Experience:</strong> {userData.experience.join(', ')}
                                </div>
                                <div>
                                    <strong>Skills:</strong>{' '}
                                    {[...userData.skills, ...userData.customSkills].join(', ')}
                                </div>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Career Visualization */}
                    {loading ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 8,
                            }}
                        >
                            <CircularProgress size={60} />
                            <p
                                style={{
                                    marginTop: 'var(--spacing-md)',
                                    color: 'var(--secondary)',
                                    fontSize: 'var(--font-size-lg)',
                                }}
                            >
                                Generating personalized career paths...
                            </p>
                        </Box>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <CircularCareerMap
                                careerPaths={careerPaths}
                                currentPosition={userData.currentSelf}
                            />
                        </motion.div>
                    )}

                    {/* Career Paths List */}
                    {!loading && careerPaths.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <h3
                                style={{
                                    fontSize: 'var(--font-size-xl)',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-md)',
                                    textAlign: 'center',
                                }}
                            >
                                Detailed Career Options
                            </h3>
                            <Box sx={{ display: 'grid', gap: 2 }}>
                                {careerPaths
                                    .sort((a, b) => b.relevance - a.relevance)
                                    .map((path, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card
                                                sx={{
                                                    border: '1px solid var(--border)',
                                                    borderRadius: 'var(--radius-md)',
                                                    transition: 'all var(--transition-base)',
                                                    '&:hover': {
                                                        borderColor: 'var(--primary)',
                                                        boxShadow: 'var(--shadow-md)',
                                                    },
                                                }}
                                            >
                                                <CardContent>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'start',
                                                            mb: 1,
                                                        }}
                                                    >
                                                        <h4
                                                            style={{
                                                                fontSize: 'var(--font-size-lg)',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {path.title}
                                                        </h4>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <span
                                                                style={{
                                                                    fontSize: 'var(--font-size-sm)',
                                                                    padding: '0.25rem 0.5rem',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    backgroundColor: 'var(--primary)',
                                                                    color: '#ffffff',
                                                                }}
                                                            >
                                                                {path.relevance}% Match
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: 'var(--font-size-sm)',
                                                                    padding: '0.25rem 0.5rem',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    backgroundColor: 'var(--success)',
                                                                    color: '#ffffff',
                                                                }}
                                                            >
                                                                {path.impact}% Impact
                                                            </span>
                                                        </Box>
                                                    </Box>
                                                    <p style={{ color: 'var(--secondary)' }}>{path.description}</p>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button variant="outlined" onClick={handleStartOver}>
                            Start Over
                        </Button>
                        <Button
                            onClick={() => {
                                if (user) router.push('/dashboard');
                                else router.push('/auth/login?returnUrl=/dashboard');
                            }}
                        >
                            {user ? 'Go to Dashboard' : 'Log in to open Dashboard'}
                        </Button>
                        <Button variant="outlined" onClick={() => router.push('/')}>
                            Home
                        </Button>
                    </Box>
                </motion.div>
            </div>
        </div>
    );
}
