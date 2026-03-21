'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Button from '@/components/UI/Button';
import { Box } from '@mui/material';

export default function OnboardingLanding() {
    const router = useRouter();

    return (
        <div className="centered-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="centered-content text-center"
            >
                <motion.h1
                    style={{
                        fontSize: 'var(--font-size-3xl)',
                        fontWeight: 700,
                        marginBottom: 'var(--spacing-md)',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    Career Enhancement Journey
                </motion.h1>

                <motion.p
                    style={{
                        fontSize: 'var(--font-size-lg)',
                        color: 'var(--secondary)',
                        marginBottom: 'var(--spacing-xl)',
                        lineHeight: 1.8,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    Discover personalized career paths tailored to your unique skills and aspirations.
                    <br />
                    Let's build your future together.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                >
                    <Button
                        onClick={() => router.push('/onboarding/role-input')}
                        fullWidth
                        sx={{ maxWidth: 400, margin: '0 auto' }}
                    >
                        Get Started
                    </Button>
                </motion.div>

                <motion.p
                    style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--secondary)',
                        marginTop: 'var(--spacing-lg)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    Takes only 3-5 minutes
                </motion.p>
            </motion.div>
        </div>
    );
}
