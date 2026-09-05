// src/store/useAuthStore.ts
import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import { UserProfile, UserRole, SignInCredentials, SignUpCredentials } from '../types';
import { SupabaseService, setActiveAuthUserId } from '../services/supabaseService';
import { useWorkflowStore } from './useWorkflowStore';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  isInitialized: boolean;

  // Actions
  initAuth: () => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<{ success: boolean; error?: string }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ 
    success: boolean; 
    error?: string; 
    emailConfirmationRequired?: boolean 
  }>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string, fallbackUser?: User) => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  setRole: (role: UserRole) => void;
  clearError: () => void;
  clearSuccessMessage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  error: null,
  successMessage: null,
  isInitialized: false,

  clearError: () => set({ error: null }),
  clearSuccessMessage: () => set({ successMessage: null }),

  /**
   * Initialize session check and set up auth state listener
   */
  initAuth: async () => {
    const client = getSupabaseClient();
    if (!client) {
      setActiveAuthUserId(null);
      set({ isLoading: false, isInitialized: true });
      return;
    }

    try {
      // 1. Check existing session
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      
      if (sessionError) {
        console.warn('[Auth] Error fetching session:', sessionError.message);
      }

      if (session?.user) {
        setActiveAuthUserId(session.user.id);
        set({
          session,
          user: session.user,
          isLoading: false,
          isInitialized: true,
        });
        // Asynchronously fetch or sync user profile
        await get().fetchProfile(session.user.id, session.user);
      } else {
        setActiveAuthUserId(null);
        set({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          isInitialized: true,
        });
      }

      // 2. Subscribe to auth state changes (login, logout, token refresh)
      client.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'SIGNED_IN' && currentSession?.user) {
          setActiveAuthUserId(currentSession.user.id);
          set({
            session: currentSession,
            user: currentSession.user,
            isLoading: false,
          });
          await get().fetchProfile(currentSession.user.id, currentSession.user);
          // Sync user-specific data from Supabase
          useWorkflowStore.getState().initSupabaseSync();
        } else if (event === 'SIGNED_OUT') {
          setActiveAuthUserId(null);
          set({
            session: null,
            user: null,
            profile: null,
            isLoading: false,
          });
          useWorkflowStore.getState().resetUserData();
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          if (currentSession.user) {
            setActiveAuthUserId(currentSession.user.id);
          }
          set({
            session: currentSession,
            user: currentSession.user,
          });
        }
      });
    } catch (err: any) {
      console.warn('[Auth] Error in initAuth:', err);
      setActiveAuthUserId(null);
      set({ isLoading: false, isInitialized: true, error: err?.message || 'Authentication error' });
    }
  },

  /**
   * Sign In with Email and Password
   */
  signIn: async ({ email, password }: SignInCredentials) => {
    set({ isLoading: true, error: null, successMessage: null });
    const client = getSupabaseClient();
    if (!client) {
      const err = 'Supabase client is not configured. Please check your settings.';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        setActiveAuthUserId(data.user.id);
        set({
          session: data.session,
          user: data.user,
          isLoading: false,
          error: null,
        });

        // Load profile and trigger cloud sync for this user
        await get().fetchProfile(data.user.id, data.user);
        useWorkflowStore.getState().initSupabaseSync();

        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Sign in failed. No active session returned.' };
    } catch (err: any) {
      const message = err?.message || 'An unexpected error occurred during sign in.';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign Up with Full Name, Email, Password, and optional Business Name
   */
  signUp: async ({ fullName, email, password, businessName }: SignUpCredentials) => {
    set({ isLoading: true, error: null, successMessage: null });
    const client = getSupabaseClient();
    if (!client) {
      const err = 'Supabase client is not configured. Please check your settings.';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    try {
      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim();
      const trimmedBusiness = businessName?.trim() || '';

      const { data, error } = await client.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            business_name: trimmedBusiness,
          },
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      // If Supabase has email confirmation disabled, a session is immediately returned
      if (data.session && data.user) {
        setActiveAuthUserId(data.user.id);
        set({
          session: data.session,
          user: data.user,
          isLoading: false,
          error: null,
        });

        // Ensure profile is persisted
        await SupabaseService.upsertProfile({
          id: data.user.id,
          fullName: trimmedName,
          businessName: trimmedBusiness || undefined,
          email: trimmedEmail,
        });

        await get().fetchProfile(data.user.id, data.user);
        useWorkflowStore.getState().initSupabaseSync();

        return { success: true, emailConfirmationRequired: false };
      }

      // If email confirmation is required:
      if (data.user && !data.session) {
        // Also attempt to upsert profile record directly
        await SupabaseService.upsertProfile({
          id: data.user.id,
          fullName: trimmedName,
          businessName: trimmedBusiness || undefined,
          email: trimmedEmail,
        });

        set({
          isLoading: false,
          successMessage: `Account created! We've sent a confirmation email to ${trimmedEmail}. Please verify your email before signing in.`,
        });
        return { success: true, emailConfirmationRequired: true };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const message = err?.message || 'An unexpected error occurred during sign up.';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign Out and reset local user-scoped state
   */
  signOut: async () => {
    set({ isLoading: true });
    const client = getSupabaseClient();
    try {
      if (client) {
        await client.auth.signOut();
      }
    } catch (err) {
      console.warn('[Auth] Sign out error:', err);
    } finally {
      setActiveAuthUserId(null);
      set({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        error: null,
        successMessage: null,
      });
      // Reset user workflow store so previous user's data does not linger
      useWorkflowStore.getState().resetUserData();
    }
  },

  /**
   * Fetch user profile from profiles table, fallback to user metadata
   */
  fetchProfile: async (userId: string, fallbackUser?: User) => {
    try {
      let profile = await SupabaseService.getProfile(userId);

      if (!profile && fallbackUser) {
        // Profile doesn't exist yet in public.profiles -> create from metadata
        const metadata = fallbackUser.user_metadata || {};
        const fullName = metadata.full_name || metadata.name || fallbackUser.email?.split('@')[0] || 'User';
        const businessName = metadata.business_name || undefined;

        profile = await SupabaseService.upsertProfile({
          id: userId,
          fullName,
          businessName,
          email: fallbackUser.email || '',
        });

        if (!profile) {
          profile = {
            id: userId,
            fullName,
            businessName,
            email: fallbackUser.email || '',
            role: (fallbackUser.user_metadata?.role as UserRole) || 'admin',
          };
        }
      }

      if (profile) {
        set({ profile });
      }
      return profile;
    } catch (err) {
      console.warn('[Auth] Failed to load profile:', err);
      return null;
    }
  },

  /**
   * Update profile details (Name, Business Name, Role)
   */
  updateProfile: async (updates: Partial<UserProfile>) => {
    const currentProfile = get().profile;
    const currentUser = get().user;
    if (!currentUser) return false;

    const id = currentUser.id;
    const email = currentProfile?.email || currentUser.email || '';

    const updated = await SupabaseService.upsertProfile({
      id,
      email,
      ...updates,
    });

    if (updated) {
      set({ profile: updated });
      return true;
    }
    return false;
  },

  /**
   * Switch or assign role for active user
   */
  setRole: (role: UserRole) => {
    const currentProfile = get().profile;
    if (currentProfile) {
      const updated = { ...currentProfile, role };
      set({ profile: updated });
      get().updateProfile({ role });
    } else {
      const currentUser = get().user;
      if (currentUser) {
        const newProf: UserProfile = {
          id: currentUser.id,
          fullName: currentUser.user_metadata?.full_name || 'User',
          email: currentUser.email || '',
          role,
        };
        set({ profile: newProf });
        get().updateProfile({ role });
      }
    }
  },
}));
