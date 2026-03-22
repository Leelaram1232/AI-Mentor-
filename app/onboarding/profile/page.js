'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import useCareerStore from '@/store/careerStore';
import ProgressBar from '@/components/Layout/ProgressBar';
import { Box, Container } from '@mui/material';

export default function ProfileStep() {
    const router = useRouter();
    const { userData, updateUserData, nextStep, previousStep } = useCareerStore();

    const [experienceLevel, setExperienceLevel] = useState(userData.experienceLevel || '');
    const [currentSelf, setCurrentSelf] = useState(userData.currentSelf || '');
    const [futureGoals, setFutureGoals] = useState(userData.futureGoals || '');
    const [interests, setInterests] = useState(userData.interests || '');
    const [preferredLanguage, setPreferredLanguage] = useState(userData.preferredLanguage || 'English');
    const [courseDurationDays, setCourseDurationDays] = useState(userData.courseDurationDays || 30);
    const [education, setEducation] = useState(userData.education || '');
    const [location, setLocation] = useState(userData.location || '');
    const [linkedinUrl, setLinkedinUrl] = useState(userData.linkedinUrl || '');
    const [portfolioUrl, setPortfolioUrl] = useState(userData.portfolioUrl || '');
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!experienceLevel) newErrors.experienceLevel = 'Please select your experience level';
        if (!futureGoals.trim()) newErrors.futureGoals = 'Please set a career goal';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validate()) return;

        updateUserData('experienceLevel', experienceLevel);
        updateUserData('currentSelf', currentSelf.trim());
        updateUserData('futureGoals', futureGoals.trim());
        updateUserData('interests', interests.trim());
        updateUserData('preferredLanguage', preferredLanguage);
        updateUserData('courseDurationDays', courseDurationDays);
        updateUserData('education', education.trim());
        updateUserData('location', location.trim());
        updateUserData('linkedinUrl', linkedinUrl.trim());
        updateUserData('portfolioUrl', portfolioUrl.trim());
        
        nextStep();
        router.push('/onboarding/skill-selection');
    };

    const handleBack = () => {
        previousStep();
        router.push('/onboarding/role-input');
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'transparent', py: 8 }}>
            <Container maxWidth="md">
                <ProgressBar
                    currentStep={1}
                    totalSteps={5}
                    steps={['Role', 'Profile', 'Skills', 'Paths', 'Signup']}
                />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <h1 className="onboarding-header">Your Career Profile</h1>
                        <p className="onboarding-subtitle">Help AI customize your unique learning roadmap</p>
                    </Box>

                    <Box
                        component="form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleNext();
                        }}
                        className="glass-panel"
                        sx={{ 
                            maxWidth: 700, 
                            mx: 'auto', 
                            p: { xs: 3, md: 5 }, 
                            borderRadius: '24px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1.5rem' 
                        }}
                    >
                        <div className="input-group-ce">
                            <select 
                                className={`custom-input-ce ${errors.experienceLevel ? 'error' : ''}`}
                                value={experienceLevel} 
                                onChange={e => setExperienceLevel(e.target.value)} 
                                style={{ appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="" disabled>Select Experience Level</option>
                                <option value="fresher">Fresher / Student</option>
                                <option value="experienced">Experienced Professional</option>
                            </select>
                            {errors.experienceLevel && <span style={{ color: 'var(--error-red)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.experienceLevel}</span>}
                        </div>

                        <div className="input-group-ce">
                            <textarea
                                className="custom-input-ce"
                                placeholder="Professional Bio / Current Situation (e.g. I am a self-taught developer who wants to transition into AI research...)"
                                value={currentSelf}
                                onChange={e => setCurrentSelf(e.target.value)}
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1 }}>
                            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>🎯 FUTURE FOCUS</span>
                            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        </Box>

                        <div className="input-group-ce">
                            <textarea
                                className={`custom-input-ce ${errors.futureGoals ? 'error' : ''}`}
                                placeholder="What is your main career goal? (e.g. Become a Senior Frontend Engineer)"
                                value={futureGoals}
                                onChange={e => setFutureGoals(e.target.value)}
                                rows={2}
                                style={{ resize: 'vertical' }}
                            />
                            {errors.futureGoals && <span style={{ color: 'var(--error-red)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.futureGoals}</span>}
                        </div>

                        <div className="input-group-ce">
                            <input
                                type="text"
                                className="custom-input-ce"
                                placeholder="Other interests (e.g. AI, UI/UX, Cloud, Mobile)"
                                value={interests}
                                onChange={e => setInterests(e.target.value)}
                            />
                        </div>

                        <div className="input-group-ce">
                            <input
                                type="text"
                                className="custom-input-ce"
                                placeholder="Education level (e.g. B.Tech CS, Self-taught, PhD)"
                                value={education}
                                onChange={e => setEducation(e.target.value)}
                            />
                        </div>

                        <div className="input-group-ce">
                            <input
                                type="text"
                                className="custom-input-ce"
                                placeholder="Location (city, country)"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            />
                        </div>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <div className="input-group-ce">
                                <input
                                    type="url"
                                    className="custom-input-ce"
                                    placeholder="LinkedIn profile URL (optional)"
                                    value={linkedinUrl}
                                    onChange={e => setLinkedinUrl(e.target.value)}
                                />
                            </div>
                            <div className="input-group-ce">
                                <input
                                    type="url"
                                    className="custom-input-ce"
                                    placeholder="Portfolio / website URL (optional)"
                                    value={portfolioUrl}
                                    onChange={e => setPortfolioUrl(e.target.value)}
                                />
                            </div>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1 }}>
                            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>📚 LEARNING PREFERENCES</span>
                            <Box sx={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                            <div className="input-group-ce">
                                <select 
                                    className="custom-input-ce" 
                                    value={preferredLanguage} 
                                    onChange={e => setPreferredLanguage(e.target.value)} 
                                    style={{ appearance: 'none', cursor: 'pointer' }}
                                >
                                    <option value="English">🌐 English</option>
                                    <option value="Hindi">🇮🇳 Hindi</option>
                                    <option value="Telugu">🇮🇳 Telugu</option>
                                    <option value="Tamil">🇮🇳 Tamil</option>
                                    <option value="Spanish">🇪🇸 Spanish</option>
                                    <option value="French">🇫🇷 French</option>
                                    <option value="German">🇩🇪 German</option>
                                </select>
                            </div>

                            <div className="input-group-ce">
                                <select 
                                    className="custom-input-ce" 
                                    value={courseDurationDays} 
                                    onChange={e => setCourseDurationDays(e.target.value)} 
                                    style={{ appearance: 'none', cursor: 'pointer' }}
                                >
                                    <option value={7}>⚡ 7 Days (Sprint)</option>
                                    <option value={30}>📅 30 Days (Standard)</option>
                                    <option value={90}>🎯 90 Days (Mastery)</option>
                                </select>
                            </div>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="btn-ce btn-ce-secondary"
                                style={{ flex: 1, padding: '1rem', borderRadius: '12px', fontSize: '1.05rem' }}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={!experienceLevel || !futureGoals.trim()}
                                className="btn-ce btn-ce-primary"
                                style={{ flex: 2, padding: '1rem', borderRadius: '12px', fontSize: '1.05rem', background: (!experienceLevel || !futureGoals.trim()) ? '' : '#2563eb' }}
                            >
                                Continue to Skills
                            </button>
                        </Box>
                    </Box>
                </motion.div>
            </Container>
        </Box>
    );
}
