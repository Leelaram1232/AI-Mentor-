-- =============================================================================
-- AI CAREER PLATFORM — Complete Supabase Database Schema (V2)
-- Run this ONCE in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Includes: profiles, roadmaps, learning, jobs, applications, resumes
-- =============================================================================

-- =====================================================================
-- 1. PROFILES — extends Supabase auth.users
-- =====================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text default '',
  email text default '',
  avatar_url text default '',
  bio text default '',
  education_level text default '',
  experience_level text default '',
  skills text default '',
  interests text default '',
  career_goal text default '',
  current_job_role text default '',
  selected_career_path text default '',
  location text default '',
  linkedin_url text default '',
  portfolio_url text default '',
  resume_url text default '',
  preferred_language text default 'English',
  course_duration_days integer default 30,
  xp_points integer default 0,
  level integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- 2. LEARNING ROADMAPS
-- =====================================================================
create table if not exists public.user_roadmaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  career_path text default '',
  total_steps integer default 0,
  completed_steps integer default 0,
  is_active boolean default true,
  generated_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.roadmap_items (
  id uuid default gen_random_uuid() primary key,
  roadmap_id uuid references public.user_roadmaps(id) on delete cascade not null,
  step_number integer not null,
  title text not null,
  description text default '',
  category text default '',
  resource_url text default '',
  resource_type text default '',
  estimated_hours numeric default 0,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- =====================================================================
-- 3. LEARNING PROGRESS
-- =====================================================================
create table if not exists public.learning_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic text not null,
  category text default '',
  time_spent_minutes integer default 0,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- =====================================================================
-- 4. BOOKMARKS (learning resources)
-- =====================================================================
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  url text not null,
  description text default '',
  category text default '',
  resource_type text default '',
  created_at timestamptz default now()
);

-- =====================================================================
-- 5. LEARNING STREAKS
-- =====================================================================
create table if not exists public.learning_streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_date date not null,
  minutes_learned integer default 0,
  topics_covered text default '',
  created_at timestamptz default now(),
  unique(user_id, activity_date)
);

-- =====================================================================
-- 6. BADGES & ACHIEVEMENTS
-- =====================================================================
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_name text not null,
  badge_icon text default '🏆',
  badge_description text default '',
  earned_at timestamptz default now()
);

-- =====================================================================
-- 7. CHAT HISTORY (AI Mentor)
-- =====================================================================
create table if not exists public.chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- =====================================================================
-- 8. JOB LISTINGS — curated opportunities
-- =====================================================================
create table if not exists public.job_listings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company_name text not null,
  company_logo_url text default '',
  location text default '',
  salary_range text default '',
  job_type text default 'full-time' check (job_type in ('internship','full-time','part-time','remote','contract','freelance')),
  description text default '',
  required_skills text default '',
  experience_required text default '',
  application_url text default '',
  source text default 'platform',
  category text default '',
  is_active boolean default true,
  posted_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- =====================================================================
-- 9. JOB APPLICATIONS — tracking user applications
-- =====================================================================
create table if not exists public.job_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.job_listings(id) on delete cascade not null,
  resume_url text default '',
  cover_letter text default '',
  portfolio_url text default '',
  status text default 'applied' check (status in ('applied','under_review','interview_scheduled','accepted','rejected','withdrawn')),
  match_score integer default 0,
  applied_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, job_id)
);

-- =====================================================================
-- 10. SAVED OPPORTUNITIES (bookmarked jobs)
-- =====================================================================
create table if not exists public.saved_opportunities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.job_listings(id) on delete cascade not null,
  saved_at timestamptz default now(),
  unique(user_id, job_id)
);

-- =====================================================================
-- 11. USER RESUMES — manage multiple resumes
-- =====================================================================
create table if not exists public.user_resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_type text default 'pdf',
  file_size integer default 0,
  is_default boolean default false,
  extracted_skills text default '',
  extracted_experience text default '',
  uploaded_at timestamptz default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roadmaps enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.learning_progress enable row level security;
alter table public.bookmarks enable row level security;
alter table public.learning_streaks enable row level security;
alter table public.user_badges enable row level security;
alter table public.chat_history enable row level security;
alter table public.job_listings enable row level security;
alter table public.job_applications enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.user_resumes enable row level security;

-- Drop existing policies (safe if they don't exist)
do $$ begin
  -- Profiles
  drop policy if exists "Users can view own profile" on public.profiles;
  drop policy if exists "Users can update own profile" on public.profiles;
  drop policy if exists "Users can insert own profile" on public.profiles;
  -- Roadmaps
  drop policy if exists "Users can manage own roadmaps" on public.user_roadmaps;
  drop policy if exists "Users can manage own roadmap items" on public.roadmap_items;
  -- Progress
  drop policy if exists "Users can manage own progress" on public.learning_progress;
  -- Bookmarks
  drop policy if exists "Users can manage own bookmarks" on public.bookmarks;
  -- Streaks
  drop policy if exists "Users can manage own streaks" on public.learning_streaks;
  -- Badges
  drop policy if exists "Users can view own badges" on public.user_badges;
  drop policy if exists "Users can earn badges" on public.user_badges;
  -- Chat
  drop policy if exists "Users can manage own chat" on public.chat_history;
end $$;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Roadmaps
create policy "Users can manage own roadmaps" on public.user_roadmaps for all using (auth.uid() = user_id);
create policy "Users can manage own roadmap items" on public.roadmap_items for all
  using (exists (select 1 from public.user_roadmaps where id = roadmap_items.roadmap_id and user_id = auth.uid()));

-- Learning progress, bookmarks, streaks
create policy "Users can manage own progress" on public.learning_progress for all using (auth.uid() = user_id);
create policy "Users can manage own bookmarks" on public.bookmarks for all using (auth.uid() = user_id);
create policy "Users can manage own streaks" on public.learning_streaks for all using (auth.uid() = user_id);

-- Badges
create policy "Users can view own badges" on public.user_badges for select using (auth.uid() = user_id);
create policy "Users can earn badges" on public.user_badges for insert with check (auth.uid() = user_id);

-- Chat
create policy "Users can manage own chat" on public.chat_history for all using (auth.uid() = user_id);

-- Job listings — everyone (authenticated) can read, but only admins can write
create policy "Anyone can read active jobs" on public.job_listings for select using (true);
create policy "Service role can manage jobs" on public.job_listings for all using (auth.role() = 'service_role');
-- Allow authenticated users to insert jobs (for AI-generated listings)
create policy "Authenticated can insert jobs" on public.job_listings for insert with check (auth.role() = 'authenticated');

-- Job applications
create policy "Users can manage own applications" on public.job_applications for all using (auth.uid() = user_id);

-- Saved opportunities
create policy "Users can manage saved jobs" on public.saved_opportunities for all using (auth.uid() = user_id);

-- User resumes
create policy "Users can manage own resumes" on public.user_resumes for all using (auth.uid() = user_id);

-- =====================================================================
-- TRIGGER — Auto-create profile on signup
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    email, 
    full_name,
    education_level,
    experience_level,
    interests,
    career_goal,
    skills,
    current_job_role,
    location,
    linkedin_url,
    portfolio_url,
    bio,
    preferred_language,
    course_duration_days
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'education_level', ''),
    coalesce(new.raw_user_meta_data->>'experience_level', ''),
    coalesce(new.raw_user_meta_data->>'interests', ''),
    coalesce(new.raw_user_meta_data->>'career_goal', ''),
    coalesce(new.raw_user_meta_data->>'skills', ''),
    coalesce(new.raw_user_meta_data->>'current_job_role', ''),
    coalesce(new.raw_user_meta_data->>'location', ''),
    coalesce(new.raw_user_meta_data->>'linkedin_url', ''),
    coalesce(new.raw_user_meta_data->>'portfolio_url', ''),
    coalesce(new.raw_user_meta_data->>'bio', ''),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'English'),
    coalesce((new.raw_user_meta_data->>'course_duration_days')::integer, 30)
  );
  return new;
end;
$$ language plpgsql security definer;


drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- SEED DATA — Sample job listings for testing
-- =====================================================================
insert into public.job_listings (title, company_name, company_logo_url, location, salary_range, job_type, description, required_skills, experience_required, application_url, source, category) values
  ('Frontend Developer Intern', 'TechStartup India', '🏢', 'Remote', '₹10K-15K/month', 'internship', 'Build responsive UIs using React.js and modern CSS. Work with a fast-paced startup team.', 'React,JavaScript,CSS,HTML,Git', 'fresher', 'https://internshala.com', 'platform', 'Web Development'),
  ('Full Stack Developer', 'Innovate Solutions', '🚀', 'Bangalore, India', '₹6-12 LPA', 'full-time', 'Develop end-to-end web applications using MERN stack. Collaborate with cross-functional teams.', 'React,Node.js,MongoDB,Express,JavaScript,TypeScript', 'junior', 'https://linkedin.com/jobs', 'linkedin', 'Web Development'),
  ('Python Backend Developer', 'DataCorp Analytics', '📊', 'Hyderabad, India', '₹8-15 LPA', 'full-time', 'Design and implement REST APIs. Work on data processing pipelines and microservices.', 'Python,Django,FastAPI,PostgreSQL,Redis,Docker', 'mid', 'https://indeed.com', 'indeed', 'Backend Development'),
  ('Machine Learning Intern', 'AI Research Lab', '🧠', 'Remote', '₹15K-25K/month', 'internship', 'Work on NLP and computer vision projects. Train and evaluate ML models.', 'Python,TensorFlow,PyTorch,NumPy,Pandas,Scikit-learn', 'fresher', 'https://internshala.com', 'platform', 'Data Science & AI'),
  ('Data Analyst', 'FinTech Corp', '💰', 'Mumbai, India', '₹5-8 LPA', 'full-time', 'Analyze financial data, build dashboards in Tableau/Power BI, and generate insights.', 'SQL,Python,Tableau,Power BI,Excel,Statistics', 'fresher', 'https://glassdoor.com', 'glassdoor', 'Data Science & AI'),
  ('Mobile App Developer', 'AppWorks Studio', '📱', 'Pune, India', '₹7-12 LPA', 'full-time', 'Build cross-platform mobile apps using React Native or Flutter.', 'React Native,Flutter,Dart,JavaScript,Firebase', 'junior', 'https://linkedin.com/jobs', 'linkedin', 'Mobile Development'),
  ('DevOps Engineer', 'CloudScale Tech', '☁️', 'Remote', '₹10-18 LPA', 'remote', 'Manage CI/CD pipelines, cloud infrastructure on AWS, and containerized deployments.', 'AWS,Docker,Kubernetes,Terraform,Jenkins,Linux,Python', 'mid', 'https://indeed.com', 'indeed', 'Cloud & DevOps'),
  ('UI/UX Design Intern', 'DesignHub', '🎨', 'Delhi, India', '₹8K-12K/month', 'internship', 'Design user interfaces in Figma. Conduct user research and create wireframes.', 'Figma,Sketch,Adobe XD,User Research,Prototyping', 'fresher', 'https://internshala.com', 'platform', 'Design'),
  ('Cybersecurity Analyst', 'SecureNet', '🔒', 'Bangalore, India', '₹8-14 LPA', 'full-time', 'Monitor security threats, conduct vulnerability assessments, implement security protocols.', 'Network Security,Penetration Testing,SIEM,Firewalls,Linux,Python', 'junior', 'https://linkedin.com/jobs', 'linkedin', 'Cybersecurity'),
  ('Blockchain Developer', 'Web3 Labs', '⛓️', 'Remote', '₹12-20 LPA', 'remote', 'Build decentralized applications on Ethereum. Write smart contracts in Solidity.', 'Solidity,Ethereum,Web3.js,React,JavaScript,Node.js', 'mid', 'https://wellfound.com', 'wellfound', 'Blockchain'),
  ('Content Writing Intern', 'MediaPulse', '✍️', 'Remote', '₹5K-8K/month', 'internship', 'Write blog posts, social media content, and marketing copy for tech products.', 'Content Writing,SEO,Social Media,WordPress,Research', 'fresher', 'https://internshala.com', 'platform', 'Content & Marketing'),
  ('Game Developer', 'PixelForge Games', '🎮', 'Pune, India', '₹6-10 LPA', 'full-time', 'Develop 2D/3D games using Unity/Unreal Engine. Create game mechanics and optimize performance.', 'Unity,C#,Unreal Engine,C++,Game Design,3D Modeling', 'junior', 'https://indeed.com', 'indeed', 'Game Development')
on conflict do nothing;

-- =====================================================================
-- STORAGE BUCKET — for resume uploads
-- =====================================================================
-- NOTE: Run this separately if needed. Supabase may require you to
-- create the bucket via Dashboard → Storage → New Bucket named 'resumes'
-- with 'Allowed MIME types': application/pdf, application/msword,
-- application/vnd.openxmlformats-officedocument.wordprocessingml.document
-- Max file size: 5MB
-- Make it a public bucket OR set up appropriate policies.
