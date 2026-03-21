'use client';

import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ variant }) => ({
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem 2rem',
    fontSize: 'var(--font-size-base)',
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all var(--transition-base)',
    boxShadow: 'none',

    '&:hover': {
        boxShadow: 'var(--shadow-md)',
        transform: 'translateY(-1px)',
    },

    '&:active': {
        transform: 'translateY(0)',
    },

    '&.MuiButton-contained': {
        backgroundColor: 'var(--primary)',
        color: '#ffffff',

        '&:hover': {
            backgroundColor: 'var(--primary-hover)',
        },

        '&:disabled': {
            backgroundColor: 'var(--secondary)',
            color: '#ffffff',
            opacity: 0.6,
        },
    },

    '&.MuiButton-outlined': {
        borderColor: 'var(--border)',
        color: 'var(--foreground)',

        '&:hover': {
            borderColor: 'var(--primary)',
            backgroundColor: 'transparent',
        },
    },

    '&.MuiButton-text': {
        color: 'var(--primary)',

        '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
        },
    },
}));

export default function Button({
    children,
    onClick,
    variant = 'contained',
    loading = false,
    disabled = false,
    fullWidth = false,
    ...props
}) {
    return (
        <StyledButton
            variant={variant}
            onClick={onClick}
            disabled={disabled || loading}
            fullWidth={fullWidth}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            {...props}
        >
            {children}
        </StyledButton>
    );
}
