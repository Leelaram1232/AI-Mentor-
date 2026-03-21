-- =============================================================================
-- AI CAREER PLATFORM — Schema Migration V3 (Learning Roadmap Enhancements)
-- Run this in Supabase SQL Editor AFTER running V2 schema
-- =============================================================================

-- 1. Add new profile columns for learning preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'English',
ADD COLUMN IF NOT EXISTS course_duration_days integer DEFAULT 30;

-- 2. Add new roadmap_items columns for day-by-day + video data
ALTER TABLE public.roadmap_items
ADD COLUMN IF NOT EXISTS day_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS video_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS video_title text DEFAULT '',
ADD COLUMN IF NOT EXISTS video_thumbnail text DEFAULT '';

-- Done! You can verify by running: SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
