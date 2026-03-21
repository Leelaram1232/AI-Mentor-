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

  // Fetch profile from Supabase
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
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
            setLoading(false); // Speed up entry
            const prof = await fetchProfile(session.user.id);
            if (mounted) setProfile(prof);
          } else {
            console.log('[Auth] No session found');
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
        setLoading(false); // Clear loading state as soon as we have a user to speed up entry
        
        // Fetch profile in the background
        const prof = await fetchProfile(session.user.id);
        if (mounted) setProfile(prof);
      } else {
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

    // If user was created, try to update profile
    if (data.user) {
      try {
        const profileData = {
          id: data.user.id,
          email,
          full_name: fullName || '',
          ...metadata,
        };
        await supabase.from('profiles').upsert(profileData);
        const prof = await fetchProfile(data.user.id);
        setProfile(prof);
      } catch (profileErr) {
        console.warn('Profile creation skipped (table may not exist yet):', profileErr.message);
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
    return data;
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
    return data;
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log('[Auth] Signing out...');
      // 1. Clear Supabase session
      await supabase.auth.signOut();
      
      // 2. Clear local state
      setUser(null);
      setProfile(null);
      setLoading(false);

      // 3. Clear all storage to prevent state leakage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      return { success: true };
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
      // Even if it fails, clear state
      setUser(null);
      setProfile(null);
      return { success: false, error: err };
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
