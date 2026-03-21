'use client';

import { motion } from 'framer-motion';
import { Box, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledLinearProgress = styled(LinearProgress)({
    height: 6,
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--border)',

    '& .MuiLinearProgress-bar': {
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--primary)',
    },
});

const StepIndicator = styled('div')(({ active, completed }) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    transition: 'all var(--transition-base)',
    backgroundColor: completed || active ? 'var(--primary)' : 'var(--border)',
    color: completed || active ? '#ffffff' : 'var(--secondary)',
    border: active ? '3px solid var(--primary-hover)' : 'none',
}));

export default function ProgressBar({ currentStep, totalSteps, steps = [] }) {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                {steps.map((step, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <StepIndicator
                                active={currentStep === index}
                                completed={currentStep > index}
                            >
                                {index + 1}
                            </StepIndicator>
                        </motion.div>
                        <p
                            style={{
                                marginTop: 'var(--spacing-xs)',
                                fontSize: 'var(--font-size-sm)',
                                color: currentStep >= index ? 'var(--foreground)' : 'var(--secondary)',
                                fontWeight: currentStep === index ? 600 : 400,
                                textAlign: 'center',
                            }}
                        >
                            {step}
                        </p>
                    </Box>
                ))}
            </Box>

            <StyledLinearProgress variant="determinate" value={progress} />
        </Box>
    );
}
