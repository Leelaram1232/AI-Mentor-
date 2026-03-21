import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use a valid placeholder URL during build / when credentials are missing
const resolvedUrl = supabaseUrl && supabaseUrl.startsWith('http')
  ? supabaseUrl
  : 'https://placeholder.supabase.co';

const resolvedKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Supabase credentials missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
  }
}

export const supabase = createClient(resolvedUrl, resolvedKey);
