'use client';

import Link from 'next/link';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)({
    backgroundColor: 'var(--background)',
    borderBottom: '1px solid var(--border)',
    boxShadow: 'none',
    color: 'var(--foreground)',
});

export default function Header() {
    return (
        <StyledAppBar position="static">
            <Toolbar sx={{ justifyContent: 'space-between', py: 1.25, px: { xs: 2, md: 4 } }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            fontSize: 'var(--font-size-xl)',
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        CareerPath
                    </Typography>
                </Link>

                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <HeaderLink href="/dashboard">Dashboard</HeaderLink>
                    <HeaderLink href="/profile">Profile</HeaderLink>
                    <HeaderLink href="/auth/login">Login</HeaderLink>
                    <HeaderLink href="/auth/signup">Sign Up</HeaderLink>
                </Box>
            </Toolbar>
        </StyledAppBar>
    );
}

function HeaderLink({ href, children }) {
    return (
        <Link
            href={href}
            style={{
                textDecoration: 'none',
                color: 'var(--foreground)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                padding: '0.25rem 0.5rem',
                borderRadius: 999,
                transition: 'background-color var(--transition-base), color var(--transition-base)',
            }}
            onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
                e.target.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--foreground)';
            }}
        >
            {children}
        </Link>
    );
}

