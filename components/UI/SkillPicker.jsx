'use client';

import { Chip, Autocomplete, TextField, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'var(--input-bg)',
        borderRadius: '14px',
        padding: '0.65rem 1rem',
        fontSize: '1.05rem',
        transition: 'all 0.2s ease',

        '& fieldset': {
            borderColor: 'var(--border-color)',
            borderWidth: '1px',
            transition: 'all 0.2s ease',
        },

        '&:hover fieldset': {
            borderColor: '#3b82f6',
        },

        '&.Mui-focused fieldset': {
            borderColor: '#3b82f6',
            borderWidth: '2px',
        },
    },
}));

const StyledChip = styled(Chip)({
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.85rem',
    borderRadius: '8px',
    padding: '4px',
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: '#1d4ed8',
        transform: 'translateY(-1px)',
    },

    '& .MuiChip-deleteIcon': {
        color: 'rgba(255, 255, 255, 0.8)',
        '&:hover': {
            color: '#ffffff',
        },
    },
});

export default function SkillPicker({
    label = 'Select Skills',
    suggestions = [],
    selectedSkills = [],
    onChange,
    placeholder = 'Type to add custom skills...',
}) {
    const [inputValue, setInputValue] = useState('');

    const handleChange = (event, newValue) => {
        onChange(newValue);
    };

    return (
        <Box>
            <StyledAutocomplete
                multiple
                freeSolo
                options={suggestions}
                value={selectedSkills}
                onChange={handleChange}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <StyledChip
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        placeholder={selectedSkills.length === 0 ? placeholder : ''}
                    />
                )}
            />

            {suggestions.length > 0 && selectedSkills.length === 0 && (
                <Box sx={{ mt: 4, textAlign: 'left' }}>
                    <p style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem',
                        letterSpacing: '0.05em'
                    }}>
                        🔮 AI SUGGESTED SKILLS
                    </p>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {suggestions.slice(0, 15).map((skill) => (
                            <Box
                                key={skill}
                                onClick={() => onChange([...selectedSkills, skill])}
                                className="skill-pill"
                                sx={{
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    padding: '0.6rem 1.25rem',
                                    fontWeight: 500,
                                    borderRadius: '50px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--input-bg)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: '#3b82f6',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                {skill}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
