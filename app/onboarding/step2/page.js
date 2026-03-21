'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import useCareerStore from '@/store/careerStore';
import Button from '@/components/UI/Button';
import SkillPicker from '@/components/UI/SkillPicker';
import ProgressBar from '@/components/Layout/ProgressBar';
import { Box, Chip, CircularProgress } from '@mui/material';
import { generateExperienceLabels, generateSkillSuggestions } from '@/utils/groqApi';

export default function Step2() {
    const router = useRouter();
    const {
        userData,
        updateUserData,
        aiSuggestions,
        updateAISuggestions,
        nextStep,
        previousStep,
        getUserContext,
        isLoading,
        setLoading,
    } = useCareerStore();

    const [selectedExperience, setSelectedExperience] = useState(userData.experience || []);
    const [selectedSkills, setSelectedSkills] = useState([
        ...userData.skills,
        ...userData.customSkills,
    ]);
    const [experienceLabels, setExperienceLabels] = useState(aiSuggestions.experienceLabels || []);
    const [skillSuggestions, setSkillSuggestions] = useState(aiSuggestions.skillSuggestions || []);
    const [loadingExperience, setLoadingExperience] = useState(false);
    const [loadingSkills, setLoadingSkills] = useState(false);

    useEffect(() => {
        // Generate experience labels if not already generated
        if (experienceLabels.length === 0) {
            generateExperienceOptions();
        }
    }, []);

    useEffect(() => {
        // Generate skill suggestions when experience is selected
        if (selectedExperience.length > 0 && skillSuggestions.length === 0) {
            generateSkillOptions();
        }
    }, [selectedExperience]);

    const generateExperienceOptions = async () => {
        setLoadingExperience(true);
        try {
            const context = getUserContext();
            const labels = await generateExperienceLabels(context);
            setExperienceLabels(labels);
            updateAISuggestions('experienceLabels', labels);
        } catch (error) {
            console.error('Error generating experience labels:', error);
        } finally {
            setLoadingExperience(false);
        }
    };

    const generateSkillOptions = async () => {
        setLoadingSkills(true);
        try {
            const context = {
                ...getUserContext(),
                experience: selectedExperience,
            };
            const skills = await generateSkillSuggestions(context);
            setSkillSuggestions(skills);
            updateAISuggestions('skillSuggestions', skills);
        } catch (error) {
            console.error('Error generating skill suggestions:', error);
        } finally {
            setLoadingSkills(false);
        }
    };

    const handleExperienceToggle = (label) => {
        setSelectedExperience((prev) =>
            prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
        );
    };

    const handleNext = () => {
        updateUserData('experience', selectedExperience);
        updateUserData('skills', selectedSkills.filter((s) => skillSuggestions.includes(s)));
        updateUserData('customSkills', selectedSkills.filter((s) => !skillSuggestions.includes(s)));
        nextStep();
        router.push('/onboarding/role-selection');
    };


    const handleBack = () => {
        previousStep();
        router.push('/onboarding/step1');
    };

    return (
        <div className="centered-container">
            <div className="centered-content">
                <ProgressBar
                    currentStep={1}
                    totalSteps={6}
                    steps={['About', 'Skills', 'Path', 'Goal', 'Social', 'Signup']}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="onboarding-header">Skills & Experience</h1>
                    <p className="onboarding-subtitle">Based on your background, select your core areas of expertise</p>

                    <div className="onboarding-card">
                        {/* Experience Section */}
                        <Box sx={{ mb: 4 }}>
                            <h3
                                style={{
                                    fontSize: 'var(--font-size-lg)',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-md)',
                                    color: 'var(--text-main)',
                                }}
                            >
                                Experience Areas
                            </h3>

                            {loadingExperience ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                    {experienceLabels.map((label) => (
                                        <Chip
                                            key={label}
                                            label={label}
                                            onClick={() => handleExperienceToggle(label)}
                                            color={selectedExperience.includes(label) ? 'primary' : 'default'}
                                            variant={selectedExperience.includes(label) ? 'filled' : 'outlined'}
                                            sx={{
                                                fontSize: '0.95rem',
                                                padding: '0.5rem 0.6rem',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                                border: selectedExperience.includes(label) ? 'none' : '1px solid #e2e8f0',
                                                backgroundColor: selectedExperience.includes(label) ? '#2563eb' : '#f8fafc',
                                                color: selectedExperience.includes(label) ? '#fff' : '#475569',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    backgroundColor: selectedExperience.includes(label) ? '#1d4ed8' : '#f1f5f9',
                                                    transform: 'translateY(-2px)',
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>

                        {/* Skills Section */}
                        <Box sx={{ mb: 4 }}>
                            <h3
                                style={{
                                    fontSize: 'var(--font-size-lg)',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-md)',
                                    color: 'var(--text-main)',
                                }}
                            >
                                Technical Skills
                            </h3>

                            {loadingSkills ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <SkillPicker
                                    label="Select or add your skills"
                                    suggestions={skillSuggestions}
                                    selectedSkills={selectedSkills}
                                    onChange={(newSkills) => {
                                      setSelectedSkills(newSkills);
                                      // If user manualy enters, we should probably update store immediately or on handleNext
                                    }}
                                    placeholder="e.g. React, Python, Figma..."
                                />
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button variant="outlined" onClick={handleBack} fullWidth>
                                Back
                            </Button>
                            <Button
                                onClick={handleNext}
                                fullWidth
                                disabled={selectedExperience.length === 0 || selectedSkills.length === 0}
                            >
                                Continue
                            </Button>
                        </Box>
                    </div>
                </motion.div>
            </div>

        </div>
    );
}
