/**
 * Maps Zustand career store userData → Supabase `profiles` row fields (snake_case).
 * Keep this in sync with onboarding steps and ProfileTab.
 */
export function careerUserDataToProfileUpdates(userData) {
  if (!userData) {
    return {
      education_level: '',
      interests: '',
      experience_level: '',
      current_job_role: '',
      skills: '',
      career_goal: '',
      location: '',
      linkedin_url: '',
      portfolio_url: '',
      bio: '',
      preferred_language: 'English',
      course_duration_days: 30,
      selected_career_path: '',
    };
  }

  const skillsList = [...(userData.skills || []), ...(userData.customSkills || [])];
  const careerGoal =
    userData.selectedRole?.title || userData.futureGoals || userData.currentRole || '';

  return {
    ...(userData.email ? { email: userData.email } : {}),
    education_level: userData.education || '',
    interests: userData.interests || '',
    experience_level: userData.experienceLevel || '',
    current_job_role: userData.currentRole || '',
    skills: skillsList.join(', '),
    career_goal: careerGoal,
    location: userData.location || '',
    linkedin_url: userData.linkedinUrl || '',
    portfolio_url: userData.portfolioUrl || '',
    bio: (userData.bio || userData.currentSelf || '').trim(),
    preferred_language: userData.preferredLanguage || 'English',
    course_duration_days: parseInt(userData.courseDurationDays, 10) || 30,
    selected_career_path:
      userData.selectedRole?.title || userData.currentRole || '',
  };
}
