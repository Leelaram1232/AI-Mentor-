import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCurrentUser, updateProfile } from '@/utils/authClient';
import { careerUserDataToProfileUpdates } from '@/utils/mapCareerDataToProfile';

const useCareerStore = create(
    persist(
        (set, get) => ({
            // Current step in the onboarding flow
            currentStep: 0,

            // User data collected throughout the flow
            userData: {
                name: '',
                email: '',
                education: '',
                interests: '',
                experienceLevel: '',
                currentSelf: '',
                currentRole: '',
                suggestedRoles: [],
                selectedRole: null,
                futureGoals: '',
                experience: [],
                skills: [],
                customSkills: [],
                location: '',
                linkedinUrl: '',
                portfolioUrl: '',
                bio: '',
                preferredLanguage: 'English',
                courseDurationDays: 30,
            },

            // AI-generated suggestions
            aiSuggestions: {
                experienceLabels: [],
                skillSuggestions: [],
                careerPaths: [],
            },

            // Loading states
            isLoading: false,

            // Actions
            updateUserData: (field, value) =>
                set((state) => ({
                    userData: {
                        ...state.userData,
                        [field]: value,
                    },
                })),

            updateAISuggestions: (field, value) =>
                set((state) => ({
                    aiSuggestions: {
                        ...state.aiSuggestions,
                        [field]: value,
                    },
                })),

            setLoading: (loading) => set({ isLoading: loading }),

            nextStep: () =>
                set((state) => ({
                    currentStep: state.currentStep + 1,
                })),

            previousStep: () =>
                set((state) => ({
                    currentStep: Math.max(0, state.currentStep - 1),
                })),

            goToStep: (step) => set({ currentStep: step }),

            resetStore: () =>
                set({
                    currentStep: 0,
                    userData: {
                        name: '',
                        email: '',
                        education: '',
                        interests: '',
                        experienceLevel: '',
                        currentSelf: '',
                        currentRole: '',
                        suggestedRoles: [],
                        selectedRole: null,
                        futureGoals: '',
                        experience: [],
                        skills: [],
                        customSkills: [],
                        location: '',
                        linkedinUrl: '',
                        portfolioUrl: '',
                        bio: '',
                        preferredLanguage: 'English',
                        courseDurationDays: 30,
                    },
                    aiSuggestions: {
                        experienceLabels: [],
                        skillSuggestions: [],
                        careerPaths: [],
                    },
                    isLoading: false,
                }),

            // Get all user context for API calls
            getUserContext: () => {
                const { userData } = get();
                return {
                    name: userData.name,
                    education: userData.education,
                    interests: userData.interests,
                    experienceLevel: userData.experienceLevel,
                    currentSelf: userData.currentSelf,
                    futureGoals: userData.selectedRole?.title || userData.futureGoals,
                    experience: userData.experience,
                    skills: [...(userData.skills || []), ...(userData.customSkills || [])],
                    currentRole: userData.currentRole,
                    location: userData.location,
                    bio: userData.bio || userData.currentSelf,
                };
            },

            // Persist to Supabase
            saveProfileToSupabase: async () => {
                const { userData } = get();
                try {
                    const user = await getCurrentUser();
                    if (!user) throw new Error('No user found');

                    const mapped = careerUserDataToProfileUpdates(userData);
                    const updates = { ...mapped };
                    if ((userData.name || '').trim()) {
                        updates.full_name = userData.name.trim();
                    }

                    console.log('[CareerStore] Saving profile updates to Supabase:', updates);
                    await updateProfile(user.id, updates);
                    return { success: true };
                } catch (error) {
                    console.error('Error saving profile:', error);
                    return { success: false, error };
                }
            },

        }),
        {
            name: 'career-store',
            partialize: (state) => ({
                currentStep: state.currentStep,
                userData: state.userData,
            }),
        }
    )
);

export default useCareerStore;
