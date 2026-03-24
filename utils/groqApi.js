import Groq from 'groq-sdk';

let groqClient = null;

function getGroqClient() {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey || apiKey === 'your-groq-api-key') return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqClient;
}

async function callGroq(systemPrompt, userPrompt, { temperature = 0.7, maxTokens = 2000 } = {}) {
  const groq = getGroqClient();
  if (!groq) return null;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature,
      max_tokens: maxTokens,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error);
    return null;
  }
}

// ─── AI Career Mentor Chat ──────────────────────────────────────────────────

export async function chatWithMentor(messages, userProfile) {
  const groq = getGroqClient();
  if (!groq) {
    return "I'm your AI career mentor! To enable full AI responses, please add your Groq API key to the environment variables. In the meantime, I'd suggest focusing on building projects related to your career goals and practicing consistently!";
  }

  const systemPrompt = `You are the AI Career Mentor, a premium AI assistant created in 2026 by Leela Ram Samavedam. Your primary goal is to assist students with empathy, clarity, and deep professional insights.

User Profile:
- Name: ${userProfile?.full_name || 'Student'}
- Skills: ${userProfile?.skills || 'Not specified'}
- Career Goal: ${userProfile?.career_goal || 'Not specified'}

MENTORSHIP RULES:
1. IDENTITY & ORIGIN: If asked about your creation, origin, or purpose, you must state that you were created in 2026 by Leela Ram Samavedam to assist students with empathy and clarity.
2. STRICT BREVITY FOR GREETINGS: If the user says "Hi", "Hello", "How are you?", or gives simple wishes, you MUST respond with ONLY one short, warm sentence. DO NOT give long advice unless asked a specific question.
3. TOPIC RELEVANCE: Only talk about education, career, or subjects if the user explicitly asks about them. Stay in "brief social mode" for everything else.
4. SUBJECT DEPTH: When asked a specific technical or career question, provide a DEEP, DETAILED, and comprehensive response with headings and tables.
5. TEACHER-LIKE TONE: Be supportive and encouraging, but stay professional and focused.
6. NO REPETITION: Don't repeat the user's name or your intro in every single message.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
      ],
      model: 'llama-3.1-8b-instant', // Switched to instant model for speed
      temperature: 0.6,
      max_tokens: 2000,
    });
    return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response. Please try again.';
  } catch (error) {
    console.error('Mentor chat error:', error);
    return 'Sorry, there was an error connecting to the AI. Please check your API key and try again.';
  }
}

/**
 * Voice-specific mentor chat — responds in the user's preferred language
 */
export async function voiceChatWithMentor(messages, userProfile) {
  const groq = getGroqClient();
  const language = userProfile?.preferred_language || 'English';
  if (!groq) {
    return `I'm your AI career mentor! Please add your Groq API key to enable full AI responses.`;
  }

  const systemPrompt = `You are the AI Career Mentor, a premium voice assistant created in 2026 by Leela Ram Samavedam. Your primary goal is to assist students with empathy, clarity, and deep professional insights.
User Language: ${language}

MENTORSHIP RULES:
1. IDENTITY & ORIGIN: If asked about who created you or when you were born, you must state you were created in 2026 by Leela Ram Samavedam.
2. RESPONSE LANGUAGE: You MUST respond completely in ${language}.
3. STRICT BREVITY FOR SMALL TALK: For "Hi", "Hello", "How are you?", or wishes, respond with ONLY ONE SHORT SENTENCE. No long intros.
4. TOPIC DEPTH: Only provide detailed explanations if the user asks a specific career or educational question. When they do, be DEEP and THOROUGH.
5. PERSONAL & WARM: Be friendly but extremely concise during casual chat.
6. CONVERSATIONAL TONE: You are speaking aloud! Do NOT use tables or bullet lists that sound robotic when read. Explain concepts fluidly like a real human teacher. Write in warm, structured, conversational paragraphs.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
      ],
      model: 'llama-3.1-8b-instant', // Switched to instant model for speed
      temperature: 0.6,
      max_tokens: 2000,
    });
    return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Voice mentor error:', error);
    return 'Sorry, there was an error. Please try again.';
  }
}

// ─── Generate Learning Roadmap ──────────────────────────────────────────────

export async function generateLearningRoadmap(userProfile) {
  const days = parseInt(userProfile?.course_duration_days) || 30;
  const language = userProfile?.preferred_language || 'English';
  const langNote = language !== 'English' ? ` Suggest YouTube videos in ${language} when possible.` : '';

  const prompt = `Create a highly structured, sequential DAY-BY-DAY learning roadmap for:
- Career Goal: ${userProfile?.career_goal || userProfile?.selected_career_path || 'Software Developer'}
- Current/Selected Skills: ${userProfile?.skills || 'None specified'}
- Interested Subjects to Learn: ${userProfile?.interests || 'None specified'}
- Experience Level: ${userProfile?.experience_level || 'fresher'}
- Preferred Duration: ${days} days
- Preferred Language: ${language}

PLANNING RULES:
1. DISTRIBUTE TASKS EVENLY: Do NOT put every task in Day 1. Spread exactly ${Math.min(days, 40)} tasks chronologically from Day 1 to Day ${days}.
2. UNIQUE DAY NUMBERS: Ensure 'day_number' follows a strict increasing sequence.
3. STRUCTURE:
   - Days 1 to ${Math.round(days * 0.2)}: Foundations
   - Days ${Math.round(days * 0.2) + 1} to ${Math.round(days * 0.6)}: Core Practical Skills
   - Days ${Math.round(days * 0.6) + 1} to ${Math.round(days * 0.8)}: Intermediate Projects
   - Days ${Math.round(days * 0.8) + 1} to ${days}: Mastery & Career Prep
4. OUTPUT FORMAT: Return ONLY a JSON array.

Fields for each step:
- day_number: (Number) The specific day (1 to ${days})
- title: (String) Catchy topic title
- description: (String) Detailed (2-3 sentences) on what to learn
- category: "Foundation", "Core Skills", "Advanced", "Projects", or "Career Prep"
- estimated_hours: (Number)
- youtube_search_query: (String) Optimized for ${language}

Return ONLY the JSON array.`;

  const result = await callGroq(
    `You are a senior career path architect. You create extremely organized, sequential learning plans. 
    CRITICAL: You must spread the tasks across the entire ${days} day duration. Each task MUST have a realistic day_number.`,
    prompt,
    { temperature: 0.6, maxTokens: 4000 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback below */ }
  }

  return getDefaultRoadmap(userProfile);
}

function getDefaultRoadmap(profile) {
  const path = (profile?.career_goal || profile?.selected_career_path || 'developer').toLowerCase();
  return [
    { title: 'Programming Fundamentals', description: 'Learn core programming concepts, logic, and problem solving', category: 'Foundation', resource_type: 'course', estimated_hours: 30 },
    { title: 'Data Structures & Algorithms', description: 'Master essential CS concepts for technical interviews', category: 'Foundation', resource_type: 'course', estimated_hours: 40 },
    { title: 'Version Control with Git', description: 'Learn Git, GitHub, branching, and collaboration workflows', category: 'Foundation', resource_type: 'tutorial', estimated_hours: 8 },
    { title: `Core ${path} Skills`, description: `Deep dive into the primary technologies for ${path}`, category: 'Core Skills', resource_type: 'course', estimated_hours: 35 },
    { title: 'Build Your First Project', description: 'Apply what you learned in a hands-on beginner project', category: 'Projects', resource_type: 'project', estimated_hours: 20 },
    { title: 'Testing & Debugging', description: 'Learn testing methodologies and debugging strategies', category: 'Core Skills', resource_type: 'tutorial', estimated_hours: 12 },
    { title: 'Advanced Concepts', description: 'Explore advanced patterns, architectures, and best practices', category: 'Advanced', resource_type: 'course', estimated_hours: 30 },
    { title: 'Build a Portfolio Project', description: 'Create a comprehensive project to showcase your skills', category: 'Projects', resource_type: 'project', estimated_hours: 40 },
    { title: 'System Design Basics', description: 'Understand how to design scalable systems and architectures', category: 'Advanced', resource_type: 'reading', estimated_hours: 15 },
    { title: 'Resume & Portfolio', description: 'Build a professional resume and portfolio website', category: 'Career Prep', resource_type: 'practice', estimated_hours: 10 },
    { title: 'Interview Preparation', description: 'Practice coding challenges, behavioral questions, and mock interviews', category: 'Career Prep', resource_type: 'practice', estimated_hours: 25 },
    { title: 'Apply & Network', description: 'Start applying for positions and building your professional network', category: 'Career Prep', resource_type: 'practice', estimated_hours: 15 },
  ];
}

// ─── Skill Gap Analysis ─────────────────────────────────────────────────────

export async function analyzeSkillGap(userProfile) {
  const prompt = `Analyze the skill gap for this professional:
- Career Goal: ${userProfile?.career_goal || userProfile?.selected_career_path || 'Software Developer'}
- Current Skills: ${userProfile?.skills || 'None'}
- Experience Level: ${userProfile?.experience_level || 'fresher'}

Return a JSON object with:
- required_skills: Array of {name, importance} where importance is "critical", "important", or "nice-to-have"
- user_has: Array of skill names the user already has
- missing: Array of {name, importance, suggestion} where suggestion is a brief learning tip
- match_percentage: Number 0-100

Return ONLY valid JSON. No markdown.`;

  const result = await callGroq(
    'You are a career skills analyst. Return only valid JSON.',
    prompt,
    { temperature: 0.5, maxTokens: 2000 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback below */ }
  }

  return {
    required_skills: [
      { name: 'Programming', importance: 'critical' },
      { name: 'Problem Solving', importance: 'critical' },
      { name: 'Communication', importance: 'important' },
      { name: 'Version Control', importance: 'important' },
      { name: 'System Design', importance: 'nice-to-have' },
    ],
    user_has: (userProfile?.skills || '').split(',').map(s => s.trim()).filter(Boolean),
    missing: [
      { name: 'Data Structures', importance: 'critical', suggestion: 'Start with arrays, linked lists, and trees' },
      { name: 'System Design', importance: 'important', suggestion: 'Learn basic architecture patterns' },
    ],
    match_percentage: 35,
  };
}

// ─── Smart Resume Builder ───────────────────────────────────────────────────

export async function generateResume(userProfile, completedProjects = []) {
  const prompt = `Generate a professional resume in structured JSON format for:
- Name: ${userProfile?.full_name || 'Student'}
- Email: ${userProfile?.email || ''}
- Skills: ${userProfile?.skills || 'Not specified'}
- Education: ${userProfile?.education_level || 'Not specified'}
- Experience Level: ${userProfile?.experience_level || 'fresher'}
- Career Goal: ${userProfile?.career_goal || 'Software Developer'}
- Bio: ${userProfile?.bio || ''}
- Completed Projects: ${completedProjects.join(', ') || 'None yet'}

Return JSON with these exact fields:
{
  "name": "",
  "title": "",
  "summary": "",
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "", "company": "", "duration": "", "bullets": ["", ""]}],
  "education": [{"degree": "", "institution": "", "year": ""}],
  "projects": [{"name": "", "description": "", "technologies": [""]}],
  "certifications": [""]
}

Return ONLY valid JSON. No markdown.`;

  const result = await callGroq(
    'You are a professional resume writer. Create compelling, ATS-friendly resumes. Return only valid JSON.',
    prompt,
    { temperature: 0.6, maxTokens: 2500 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback below */ }
  }

  return {
    name: userProfile?.full_name || 'Your Name',
    title: userProfile?.career_goal || 'Software Developer',
    summary: `Motivated ${userProfile?.experience_level || ''} professional with skills in ${userProfile?.skills || 'technology'}. Passionate about ${userProfile?.interests || 'building great software'}.`,
    skills: (userProfile?.skills || '').split(',').map(s => s.trim()).filter(Boolean),
    experience: [],
    education: [{ degree: userProfile?.education_level || '', institution: '', year: '' }],
    projects: [],
    certifications: [],
  };
}

// ─── AI Mock Interview ──────────────────────────────────────────────────────

export async function generateInterviewQuestion(userProfile, previousQuestions = []) {
  const prompt = `Generate a technical interview question for a ${userProfile?.career_goal || 'software developer'} position.
Skills to test: ${userProfile?.skills || 'general programming'}
Experience level: ${userProfile?.experience_level || 'fresher'}
Previous questions already asked: ${previousQuestions.join('; ') || 'None'}

Return JSON with:
{
  "question": "The interview question",
  "category": "technical/behavioral/system-design",
  "difficulty": "easy/medium/hard",
  "hints": ["hint1", "hint2"],
  "ideal_answer_points": ["key point 1", "key point 2", "key point 3"]
}

Return ONLY valid JSON.`;

  const result = await callGroq(
    'You are a senior technical interviewer. Ask relevant, practical questions. Return only valid JSON.',
    prompt,
    { temperature: 0.8, maxTokens: 1000 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback */ }
  }

  return {
    question: 'Tell me about a project you worked on and what challenges you faced.',
    category: 'behavioral',
    difficulty: 'easy',
    hints: ['Think about a specific project', 'Describe the challenge and how you solved it'],
    ideal_answer_points: ['Specific project description', 'Challenge encountered', 'Solution approach', 'Lessons learned'],
  };
}

export async function evaluateInterviewAnswer(question, answer, userProfile) {
  const prompt = `Evaluate this interview answer:
Question: ${question}
Answer: ${answer}
Position: ${userProfile?.career_goal || 'Software Developer'}

Provide JSON feedback:
{
  "score": 0-10,
  "strengths": ["strength1"],
  "improvements": ["improvement1"],
  "feedback": "Overall feedback paragraph",
  "sample_answer": "A brief ideal answer",
  "spoken_explanation": "A conversational script explaining the feedback and fixers like a friendly human teacher speaking aloud. DO NOT use lists or read bullet points."
}

Return ONLY valid JSON.`;

  const result = await callGroq(
    'You are a kind but honest interview coach. Give constructive feedback. Return only valid JSON.',
    prompt,
    { temperature: 0.6, maxTokens: 1200 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback */ }
  }

  return {
    score: 5,
    strengths: ['You provided an answer'],
    improvements: ['Try to be more specific with examples'],
    feedback: 'Good start! Try to include more specific details and quantifiable results.',
    sample_answer: 'A strong answer would include specific examples, measurable outcomes, and lessons learned.',
    spoken_explanation: "You made a good start, but there were some key areas missing. Try to be more specific with your examples next time, and maybe include some measurable outcomes to show real impact. I've placed an ideal sample answer below for you to review."
  };
}

// ─── Project Recommendations ────────────────────────────────────────────────

export async function getProjectRecommendations(userProfile) {
  const prompt = `Suggest 9 projects for someone pursuing: ${userProfile?.career_goal || 'Software Development'}
Skills: ${userProfile?.skills || 'programming'}
Level: ${userProfile?.experience_level || 'fresher'}

Return JSON array with 3 beginner, 3 intermediate, and 3 advanced projects:
[{
  "title": "",
  "description": "",
  "difficulty": "beginner/intermediate/advanced",
  "technologies": [""],
  "estimated_hours": 0,
  "learning_outcomes": [""]
}]

Return ONLY valid JSON array.`;

  const result = await callGroq(
    'You are a project mentor. Suggest practical, portfolio-worthy projects. Return only valid JSON.',
    prompt,
    { temperature: 0.8, maxTokens: 3000 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback */ }
  }

  return [
    { title: 'Personal Portfolio Website', description: 'Build a responsive portfolio to showcase your work', difficulty: 'beginner', technologies: ['HTML', 'CSS', 'JavaScript'], estimated_hours: 15, learning_outcomes: ['Responsive design', 'DOM manipulation'] },
    { title: 'Todo App with Authentication', description: 'Full CRUD app with user login', difficulty: 'beginner', technologies: ['React', 'Firebase'], estimated_hours: 20, learning_outcomes: ['State management', 'Auth flow'] },
    { title: 'Weather Dashboard', description: 'Fetch and display weather data with charts', difficulty: 'beginner', technologies: ['React', 'API integration'], estimated_hours: 12, learning_outcomes: ['API calls', 'Data visualization'] },
    { title: 'E-commerce Platform', description: 'Build a full-featured online store', difficulty: 'intermediate', technologies: ['Next.js', 'Stripe', 'Database'], estimated_hours: 40, learning_outcomes: ['Payment integration', 'Database design'] },
    { title: 'Real-time Chat Application', description: 'Build a chat app with WebSocket', difficulty: 'intermediate', technologies: ['Node.js', 'Socket.io', 'React'], estimated_hours: 30, learning_outcomes: ['WebSockets', 'Real-time data'] },
    { title: 'Blog Platform with CMS', description: 'Content management system with admin panel', difficulty: 'intermediate', technologies: ['Next.js', 'MDX', 'Database'], estimated_hours: 35, learning_outcomes: ['CMS architecture', 'SEO optimization'] },
    { title: 'AI-Powered Application', description: 'Integrate AI/ML into a web application', difficulty: 'advanced', technologies: ['Python', 'TensorFlow', 'React'], estimated_hours: 50, learning_outcomes: ['ML integration', 'API design'] },
    { title: 'Microservices Architecture', description: 'Build a distributed system with multiple services', difficulty: 'advanced', technologies: ['Docker', 'Kubernetes', 'Node.js'], estimated_hours: 60, learning_outcomes: ['System design', 'DevOps'] },
    { title: 'Open Source Contribution', description: 'Contribute to popular open source projects', difficulty: 'advanced', technologies: ['Git', 'Various'], estimated_hours: 40, learning_outcomes: ['Collaboration', 'Code review'] },
  ];
}

// ─── Job & Internship Recommendations ───────────────────────────────────────

export async function getJobRecommendations(userProfile) {
  const prompt = `Suggest job search strategies and opportunity types for:
- Career Goal: ${userProfile?.career_goal || 'Software Developer'}
- Skills: ${userProfile?.skills || 'programming'}
- Experience: ${userProfile?.experience_level || 'fresher'}

Return JSON array of 8 opportunity categories:
[{
  "title": "",
  "type": "internship/freelance/full-time/open-source",
  "description": "",
  "platforms": ["where to find these"],
  "tips": ["actionable tip"]
}]

Return ONLY valid JSON array.`;

  const result = await callGroq(
    'You are a career counselor specializing in tech jobs. Return only valid JSON.',
    prompt,
    { temperature: 0.7, maxTokens: 2000 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback */ }
  }

  return [
    { title: 'Software Development Internship', type: 'internship', description: 'Gain hands-on experience at a tech company', platforms: ['LinkedIn', 'Internshala', 'AngelList'], tips: ['Tailor your resume for each application'] },
    { title: 'Freelance Web Projects', type: 'freelance', description: 'Build client projects to earn while learning', platforms: ['Upwork', 'Fiverr', 'Toptal'], tips: ['Start with smaller projects to build reputation'] },
    { title: 'Open Source Contributions', type: 'open-source', description: 'Contribute to popular repositories', platforms: ['GitHub', 'GitLab'], tips: ['Look for "good first issue" labels'] },
    { title: 'Junior Developer Position', type: 'full-time', description: 'Entry-level position at a tech company', platforms: ['LinkedIn', 'Indeed', 'Glassdoor'], tips: ['Network at tech meetups and events'] },
  ];
}

// ─── Career Insights ────────────────────────────────────────────────────────

export async function getCareerInsights(careerPath) {
  const prompt = `Provide market insights for: ${careerPath || 'Software Development'}

Return JSON:
{
  "salary_range": {"entry": "$XX,XXX", "mid": "$XX,XXX", "senior": "$XX,XXX"},
  "demand_level": "high/medium/low",
  "growth_rate": "XX%",
  "top_companies": ["company1", "company2"],
  "trending_technologies": ["tech1", "tech2"],
  "industry_outlook": "Brief 2-sentence outlook",
  "remote_friendly": true/false,
  "recommended_certifications": ["cert1"]
}

Return ONLY valid JSON.`;

  const result = await callGroq(
    'You are a labor market analyst. Provide realistic, current market data. Return only valid JSON.',
    prompt,
    { temperature: 0.5, maxTokens: 1500 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback */ }
  }

  return {
    salary_range: { entry: '$50,000', mid: '$85,000', senior: '$130,000' },
    demand_level: 'high',
    growth_rate: '25%',
    top_companies: ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta'],
    trending_technologies: ['AI/ML', 'Cloud Computing', 'React', 'Python', 'TypeScript'],
    industry_outlook: 'The tech industry continues to grow with strong demand for skilled developers. AI and cloud computing are driving the highest growth areas.',
    remote_friendly: true,
    recommended_certifications: ['AWS Certified', 'Google Cloud', 'Meta Front-End Developer'],
  };
}

// ─── Dynamic Bubble Graph Nodes ─────────────────────────────────────────────
/**
 * Generates 9 related career specializations for the bubble graph
 */
export async function generateRelatedCareerNodes(careerPath) {
  const prompt = `Based on the career path: "${careerPath}", suggest 9 related but distinct specializations or career positions that would surround this central role in a bubble graph.
  
  Guidelines:
  1. Each suggestion should be short (1-3 words).
  2. The suggestions should represent different specializations, related fields, or natural career progressions.
  3. Return ONLY a JSON array of 9 strings.
  
  Example for "Mobile Game Developer":
  ["Graphics Programmer", "Unity Expert", "UI/UX Designer", "Backend Engineer", "Level Designer", "Product Manager", "Network Developer", "VR/AR Specialist", "Technical Artist"]
  
  Return ONLY the JSON array.`;

  const result = await callGroq(
    'You are a career mapping expert. Return only valid JSON arrays.',
    prompt,
    { temperature: 0.7, maxTokens: 500 }
  );

  if (result) {
    try {
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { /* fallback below */ }
  }

  // Generic fallback if AI fails
  return [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Mobile Developer', 'UI/UX Designer', 'Cloud Engineer',
    'Data Scientist', 'DevOps Engineer', 'AI Engineer'
  ];
}

// ─── Legacy exports for compatibility ───────────────────────────────────────

export { generateExperienceLabels, generateSkillSuggestions, generateCareerPaths };

async function generateExperienceLabels(userContext) {
  const prompt = `Based on: Current self: ${userContext.currentSelf}, Future goals: ${userContext.futureGoals}
Generate 5-7 relevant experience categories. Return ONLY a JSON array of strings.`;

  const result = await callGroq(
    'You are a career counselor. Return only valid JSON arrays.',
    prompt,
    { temperature: 0.7, maxTokens: 500 }
  );

  if (result) {
    try { return JSON.parse(result); } catch {}
  }
  return ['Technical Skills', 'Leadership', 'Communication', 'Problem Solving', 'Project Management'];
}

async function generateSkillSuggestions(userContext) {
  const prompt = `Based on: 
  Current self/Role: ${userContext.currentSelf || 'Not specified'}
  Future Goal: ${userContext.futureGoals || 'Not specified'}
  Interests: ${userContext.interests || 'Not specified'}
  Experience Level: ${userContext.experienceLevel || 'Not specified'}

Generate 15-20 highly relevant technical and soft skills completely tailored to achieving this goal. Return ONLY a JSON array of strings.`;

  const result = await callGroq(
    'You are a career counselor. Return only valid JSON arrays.',
    prompt,
    { temperature: 0.8, maxTokens: 800 }
  );

  if (result) {
    try { return JSON.parse(result); } catch {}
  }
  return ['Communication', 'Problem Solving', 'Time Management', 'Leadership', 'Teamwork', 'Critical Thinking', 'Adaptability', 'Creativity'];
}

async function generateCareerPaths(userContext) {
  const prompt = `Based on: Current self: ${userContext.currentSelf}, Future goals: ${userContext.futureGoals}, Experience: ${userContext.experience?.join(', ') || 'Not specified'}, Skills: ${userContext.skills?.join(', ') || 'Not specified'}, Position: ${userContext.currentPosition || 'Not specified'}
Generate 8-12 career positions with title, relevance (0-100), impact (0-100), description. Return ONLY a JSON array.`;

  const result = await callGroq(
    'You are a career counselor. Return only valid JSON arrays.',
    prompt,
    { temperature: 0.7, maxTokens: 2000 }
  );

  if (result) {
    try { return JSON.parse(result); } catch {}
  }
  return [
    { title: 'Senior Professional', relevance: 80, impact: 70, description: 'Advanced role in your current field' },
    { title: 'Team Lead', relevance: 75, impact: 75, description: 'Lead and mentor a team' },
    { title: 'Specialist', relevance: 85, impact: 65, description: 'Deep expertise in a specific area' },
  ];
}
