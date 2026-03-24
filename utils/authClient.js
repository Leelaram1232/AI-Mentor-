import { supabase } from './supabaseClient';

// ─── Auth Functions (Supabase) ───────────────────────────────────────────────

export async function registerUser({ email, password, fullName, metadata = {} }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, ...metadata } },
  });
  if (error) throw error;

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName || '',
      ...metadata,
    });
  }
  return data;
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ─── Profile Functions ───────────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { id: _ignore, ...rest } = updates || {};
  const payload = {
    id: userId,
    ...rest,
    updated_at: new Date().toISOString(),
  };
  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  );
  const { data, error } = await supabase
    .from('profiles')
    .upsert(cleaned, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Roadmap Functions ───────────────────────────────────────────────────────

export async function getUserRoadmap(userId) {
  const { data, error } = await supabase
    .from('user_roadmaps')
    .select('*, roadmap_items(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  
  if (data && data.roadmap_items) {
    data.roadmap_items.sort((a, b) => (a.day_number || a.step_number) - (b.day_number || b.step_number));
  }
  
  return data;
}

export async function saveRoadmap(userId, roadmap, items) {
  // Deactivate old roadmaps
  await supabase
    .from('user_roadmaps')
    .update({ is_active: false })
    .eq('user_id', userId);

  // Insert new roadmap
  const { data: rm, error: rmErr } = await supabase
    .from('user_roadmaps')
    .insert({
      user_id: userId,
      title: roadmap.title,
      description: roadmap.description,
      career_path: roadmap.career_path,
      total_steps: items.length,
      completed_steps: 0,
    })
    .select()
    .single();
  if (rmErr) throw rmErr;

  // Insert roadmap items with enhanced fields
  const itemsData = items.map((item, idx) => ({
    roadmap_id: rm.id,
    step_number: idx + 1,
    day_number: item.day_number || idx + 1,
    title: item.title,
    description: item.description || '',
    category: item.category || '',
    resource_url: item.resource_url || '',
    resource_type: item.resource_type || '',
    estimated_hours: item.estimated_hours || 0,
    video_url: item.video_url || '',
    video_title: item.video_title || '',
    video_thumbnail: item.video_thumbnail || '',
  }));

  const { error: itemErr } = await supabase.from('roadmap_items').insert(itemsData);
  if (itemErr) throw itemErr;

  return { ...rm, roadmap_items: itemsData };
}

export async function toggleRoadmapItem(itemId, completed) {
  const { data, error } = await supabase
    .from('roadmap_items')
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export async function getBookmarks(userId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addBookmark(userId, bookmark) {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, ...bookmark })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeBookmark(bookmarkId) {
  const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);
  if (error) throw error;
}

// ─── Learning Streaks ────────────────────────────────────────────────────────

export async function getStreaks(userId, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const { data, error } = await supabase
    .from('learning_streaks')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', fromDate.toISOString().split('T')[0])
    .order('activity_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function logLearningActivity(userId, minutes, topics) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('learning_streaks')
    .upsert({
      user_id: userId,
      activity_date: today,
      minutes_learned: minutes,
      topics_covered: topics,
    }, { onConflict: 'user_id,activity_date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export async function getBadges(userId) {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function awardBadge(userId, badge) {
  const { data, error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, ...badge })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── XP & Leveling ──────────────────────────────────────────────────────────

export async function addXP(userId, points) {
  const profile = await getProfile(userId);
  const newXP = (profile.xp_points || 0) + points;
  const newLevel = Math.floor(newXP / 100) + 1;

  const { data, error } = await supabase
    .from('profiles')
    .update({ xp_points: newXP, level: newLevel, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Chat History ────────────────────────────────────────────────────────────

export async function getChatHistory(userId, limit = 50) {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function saveChatMessage(userId, role, content) {
  const { data, error } = await supabase
    .from('chat_history')
    .insert({ user_id: userId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearChatHistory(userId) {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Learning Progress ──────────────────────────────────────────────────────

export async function getLearningProgress(userId) {
  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function logTopicCompletion(userId, topic, category, timeMinutes) {
  const { data, error } = await supabase
    .from('learning_progress')
    .insert({
      user_id: userId,
      topic,
      category,
      time_spent_minutes: timeMinutes,
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Job Listings ────────────────────────────────────────────────────────────

export async function getJobListings({ category, job_type, experience, search, limit = 50 } = {}) {
  let query = supabase
    .from('job_listings')
    .select('*')
    .eq('is_active', true)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (category) query = query.eq('category', category);
  if (job_type) query = query.eq('job_type', job_type);
  if (experience) query = query.eq('experience_required', experience);
  if (search) query = query.or(`title.ilike.%${search}%,company_name.ilike.%${search}%,required_skills.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getJobById(jobId) {
  const { data, error } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', jobId)
    .single();
  if (error) throw error;
  return data;
}

// ─── Job Applications ────────────────────────────────────────────────────────

export async function applyToJob(userId, jobId, { resumeUrl, coverLetter, portfolioUrl, matchScore } = {}) {
  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      user_id: userId,
      job_id: jobId,
      resume_url: resumeUrl || '',
      cover_letter: coverLetter || '',
      portfolio_url: portfolioUrl || '',
      match_score: matchScore || 0,
      status: 'applied',
    })
    .select('*, job_listings(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function getApplications(userId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*, job_listings(*)')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateApplicationStatus(applicationId, status) {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function hasApplied(userId, jobId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ─── Saved Opportunities ─────────────────────────────────────────────────────

export async function saveOpportunity(userId, jobId) {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .insert({ user_id: userId, job_id: jobId })
    .select('*, job_listings(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function getSavedOpportunities(userId) {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .select('*, job_listings(*)')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function removeSavedOpportunity(userId, jobId) {
  const { error } = await supabase
    .from('saved_opportunities')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId);
  if (error) throw error;
}

export async function isJobSaved(userId, jobId) {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ─── Resume Management ───────────────────────────────────────────────────────

export async function uploadResume(userId, file) {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${ext}`;

  // 1. Upload file directly to Supabase Storage first
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName);

  // 2. Save basic record to user_resumes
  const { data: resumeData, error: dbError } = await supabase
    .from('user_resumes')
    .insert({
      user_id: userId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: ext,
      file_size: file.size,
      is_default: true,
    })
    .select()
    .single();
  if (dbError) throw dbError;

  // 3. Set all other resumes as non-default and update profile
  await supabase.from('user_resumes').update({ is_default: false }).eq('user_id', userId).neq('id', resumeData.id);
  await supabase.from('profiles').update({ resume_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', userId);

  // 4. Send to Python FastAPI for NLP Parsing (in background or await if fast enough)
  try {
    const formData = new FormData();
    formData.append('resume_id', resumeData.id);
    formData.append('user_id', userId);
    formData.append('file', file);

    const res = await fetch('http://localhost:8000/api/jobs/parse-resume/', {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      console.warn('AI Parsing failed, but file uploaded:', await res.text());
    } else {
      const parsedInfo = await res.json();
      console.log('AI Parsed Resume:', parsedInfo);
    }
  } catch (err) {
    console.warn('Could not contact Python parser backend:', err);
  }

  return resumeData;
}

export async function getUserResumes(userId) {
  const { data, error } = await supabase
    .from('user_resumes')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function setDefaultResume(userId, resumeId) {
  // Reset all to non-default
  await supabase.from('user_resumes').update({ is_default: false }).eq('user_id', userId);
  // Set the chosen one as default
  const { data, error } = await supabase
    .from('user_resumes')
    .update({ is_default: true })
    .eq('id', resumeId)
    .select()
    .single();
  if (error) throw error;

  // Update profile
  await supabase
    .from('profiles')
    .update({ resume_url: data.file_url, updated_at: new Date().toISOString() })
    .eq('id', userId);

  return data;
}

export async function deleteResume(userId, resumeId, filePath) {
  // Delete from storage
  if (filePath) {
    await supabase.storage.from('resumes').remove([filePath]);
  }
  // Delete DB record
  const { error } = await supabase.from('user_resumes').delete().eq('id', resumeId);
  if (error) throw error;
}

export async function getDefaultResume(userId) {
  const { data, error } = await supabase
    .from('user_resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── Match Score Calculation ─────────────────────────────────────────────────

export function calculateMatchScore(profile, job) {
  if (!profile || !job) return 0;
  let score = 0;

  // Skill match (60% weight)
  const userSkills = (profile.skills || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const jobSkills = (job.required_skills || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (jobSkills.length > 0) {
    const matched = jobSkills.filter(js => userSkills.some(us => us.includes(js) || js.includes(us)));
    score += Math.round((matched.length / jobSkills.length) * 60);
  }

  // Experience match (20% weight)
  const userExp = (profile.experience_level || '').toLowerCase();
  const jobExp = (job.experience_required || '').toLowerCase();
  if (userExp && jobExp) {
    if (userExp === jobExp) score += 20;
    else if ((userExp === 'junior' && jobExp === 'fresher') || (userExp === 'mid' && jobExp === 'junior')) score += 15;
    else if ((userExp === 'senior' && (jobExp === 'mid' || jobExp === 'junior'))) score += 10;
  } else {
    score += 10; // neutral
  }

  // Career goal match (20% weight)
  const careerGoal = (profile.career_goal || '').toLowerCase();
  const jobTitle = (job.title || '').toLowerCase();
  const jobCategory = (job.category || '').toLowerCase();
  if (careerGoal) {
    if (jobTitle.includes(careerGoal) || careerGoal.includes(jobTitle.split(' ')[0]) || jobCategory.includes(careerGoal.split(' ')[0])) {
      score += 20;
    } else if (jobCategory.split(' ').some(w => careerGoal.includes(w))) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

// ─── Job Scraping ────────────────────────────────────────────────────────────

export async function scrapeJobs(query, location = 'India', limit = 10) {
  try {
    const res = await fetch('http://localhost:8000/api/jobs/scrape/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location, limit }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error('Job scraping trigger failed:', err);
    throw err;
  }
}
