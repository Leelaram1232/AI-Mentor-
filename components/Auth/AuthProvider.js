'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Preload from cache instantly on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = localStorage.getItem('cached_user');
        const cachedProfile = localStorage.getItem('cached_profile');
        if (cachedUser && cachedProfile) {
          setUser(JSON.parse(cachedUser));
          setProfile(JSON.parse(cachedProfile));
          setLoading(false); // Instantly drop the loading screen
        }
      } catch (e) {
        console.warn('Failed to parse cached auth state:', e);
      }
    }
  }, []);

  // Fetch profile from Supabase
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, so we auto-create a basic one to prevent dashboard errors
          console.log('[Auth] Profile not found, auto-creating...');
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert({ id: userId, updated_at: new Date().toISOString() })
            .select()
            .single();
            
          if (!insertError) {
             if (typeof window !== 'undefined') localStorage.setItem('cached_profile', JSON.stringify(newProfile));
             return newProfile;
          }
        }
        throw error;
      }
      if (typeof window !== 'undefined' && data) {
         localStorage.setItem('cached_profile', JSON.stringify(data));
      }
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing session...');
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            console.log('[Auth] Valid session found:', session.user.email);
            setUser(session.user);
            if (typeof window !== 'undefined') localStorage.setItem('cached_user', JSON.stringify(session.user));
            const prof = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(prof);
              setLoading(false); // Dismiss loading only after profile is loaded to avoid UI flashes
            }
          } else {
            console.log('[Auth] No session found');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('cached_user');
              localStorage.removeItem('cached_profile');
            }
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('[Auth] Init error:', err);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event);
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        if (typeof window !== 'undefined') localStorage.setItem('cached_user', JSON.stringify(session.user));
        
        // Fetch profile before clearing loading state so the dashboard has all data loaded fast
        const prof = await fetchProfile(session.user.id);
        if (mounted) {
          setProfile(prof);
          setLoading(false);
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cached_user');
          localStorage.removeItem('cached_profile');
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email/password
  const signUp = async ({ email, password, fullName, metadata = {} }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, ...metadata },
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`,
      },
    });

    if (error) {
      // Provide friendly error messages
      if (error.status === 429) {
        throw new Error('Email rate limit exceeded. Please go to Supabase Dashboard → Authentication → Providers → Email → turn OFF "Confirm email" and try again.');
      }
      throw error;
    }

    // Set user immediately when session exists so /dashboard does not redirect to login
    // before onAuthStateChange fires (race after sign-up + router.push).
    if (data.session?.user) {
      setUser(data.session.user);
      setLoading(false);
    }

    // If user was created, try to update profile
    if (data.user) {
      try {
        const profileData = {
          id: data.user.id,
          email,
          full_name: fullName || '',
          ...metadata,
        };
        const { error: upsertErr } = await supabase.from('profiles').upsert(profileData);
        if (upsertErr) {
          console.error('[Auth] profiles upsert failed:', upsertErr.message, upsertErr);
        }
        const prof = await fetchProfile(data.user.id);
        setProfile(prof);
      } catch (profileErr) {
        console.error('[Auth] Profile upsert exception:', profileErr);
      }
    }

    return data;
  };

  // Sign in with email/password
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Set state immediately to prevent race conditions before onAuthStateChange fires.
    if (data.session?.user) {
      setUser(data.session.user);
      const prof = await fetchProfile(data.session.user.id);
      setProfile(prof);
      setLoading(false);
    }
    
    return data;
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          prompt: 'select_account'
        }
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out...');
      await supabase.auth.signOut();
      return { success: true };
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
      return { success: false, error: err };
    } finally {
      // ALWAYS clear local state and ALL storage, 
      // even if Supabase network call fails, to ensure logout.
      setUser(null);
      setProfile(null);
      setLoading(false);
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    if (typeof window !== 'undefined') localStorage.setItem('cached_profile', JSON.stringify(data));
    return data;
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user) return;
    const prof = await fetchProfile(user.id);
    setProfile(prof);
    return prof;
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
