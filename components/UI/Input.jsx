'use client';

import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'var(--input-bg)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-lg)',
        transition: 'all var(--transition-base)',

        '& fieldset': {
            borderColor: 'var(--border)',
            borderWidth: '1px',
        },

        '&:hover fieldset': {
            borderColor: 'var(--primary)',
        },

        '&.Mui-focused fieldset': {
            borderColor: 'var(--primary)',
            borderWidth: '2px',
        },
    },

    '& .MuiInputLabel-root': {
        fontSize: 'var(--font-size-base)',
        color: 'var(--secondary)',

        '&.Mui-focused': {
            color: 'var(--primary)',
        },
    },

    '& .MuiFormHelperText-root': {
        fontSize: 'var(--font-size-sm)',
        marginTop: 'var(--spacing-xs)',
    },
}));

export default function Input({
    label,
    value,
    onChange,
    placeholder,
    error,
    helperText,
    maxLength,
    showCharCount,
    multiline = false,
    rows = 1,
    ...props
}) {
    const charCount = value?.length || 0;
    const displayHelperText = showCharCount && maxLength
        ? `${charCount}/${maxLength} characters${helperText ? ` • ${helperText}` : ''}`
        : helperText;

    return (
        <StyledTextField
            fullWidth
            label={label}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            error={error}
            helperText={displayHelperText}
            multiline={multiline}
            rows={rows}
            inputProps={{
                maxLength: maxLength,
            }}
            {...props}
        />
    );
}
