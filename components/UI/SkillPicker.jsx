'use client';

import { Chip, Autocomplete, TextField, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'var(--input-bg)',
        borderRadius: 'var(--radius-md)',
        padding: '0.5rem',

        '& fieldset': {
            borderColor: 'var(--border)',
        },

        '&:hover fieldset': {
            borderColor: 'var(--primary)',
        },

        '&.Mui-focused fieldset': {
            borderColor: 'var(--primary)',
            borderWidth: '2px',
        },
    },
}));

const StyledChip = styled(Chip)({
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',

    '&:hover': {
        backgroundColor: 'var(--primary-hover)',
        transform: 'scale(1.05)',
    },

    '& .MuiChip-deleteIcon': {
        color: 'rgba(255, 255, 255, 0.7)',

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
                <Box sx={{ mt: 2 }}>
                    <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--secondary)',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        Suggested skills:
                    </p>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {suggestions.slice(0, 10).map((skill) => (
                            <Chip
                                key={skill}
                                label={skill}
                                onClick={() => onChange([...selectedSkills, skill])}
                                sx={{
                                    cursor: 'pointer',
                                    borderColor: 'var(--border)',
                                    '&:hover': {
                                        borderColor: 'var(--primary)',
                                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                    },
                                }}
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
