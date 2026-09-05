// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'workerhub_supabase_url';
const STORAGE_KEY_KEY = 'workerhub_supabase_anon_key';

// Project Supabase production credentials (public anon key)
export const DEFAULT_SUPABASE_URL = 'https://ytusriqarhzroulxhbcq.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dXNyaXFhcmh6cm91bHhoYmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTc2NDQsImV4cCI6MjEwNDA5MzY0NH0.j1CER21HHvs88P-0lOw-kap43nf-W-p0OjNrgWxZUts';

// Aliases for explicit imports
export const supabaseUrl = DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = DEFAULT_SUPABASE_ANON_KEY;

/**
 * Retrieve active Supabase configuration.
 * Checks environment variables first, then local storage, and ALWAYS falls back
 * to the project production credentials.
 * `isConfigured` ALWAYS evaluates to true by default.
 */
export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'default';
} {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env',
    };
  }

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  if (storedUrl && storedKey) {
    return {
      url: storedUrl.trim(),
      anonKey: storedKey.trim(),
      isConfigured: true,
      source: 'storage',
    };
  }

  // ALWAYS default to production credentials with isConfigured: true
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isConfigured: true,
    source: 'default',
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    // Invalidate cached client
    cachedClient = null;
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
  }
}

// Fallback pre-initialized Supabase client singleton
export const supabase: SupabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

/**
 * Get or create singleton Supabase client.
 * Guaranteed to return an active SupabaseClient instance (falling back to production default).
 */
export function getSupabaseClient(): SupabaseClient {
  const config = getSupabaseConfig();

  if (cachedClient && cachedUrl === config.url && cachedKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = config.url;
    cachedKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client, using default client:', err);
    return supabase;
  }
}

/**
 * Test connectivity to the Supabase instance and check if tables exist.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tableFound?: boolean;
}> {
  const client = getSupabaseClient();

  try {
    // Try querying clients table with limit 1
    const { error, count } = await client
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // Check if the table does not exist
      if (
        error.code === '42P01' || 
        error.code === 'PGRST205' || 
        error.message.includes('relation "public.clients" does not exist') ||
        error.message.includes('schema cache')
      ) {
        return {
          success: true,
          tableFound: false,
          message: 'Connected to Supabase project! The "clients" table does not exist yet. Please run the SQL Setup Script in your Supabase SQL Editor.',
        };
      }
      return {
        success: false,
        message: `Supabase returned error: ${error.message} (Code: ${error.code})`,
      };
    }

    return {
      success: true,
      tableFound: true,
      message: `Successfully connected to Supabase! (Found ${count ?? 0} clients)`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error connecting to Supabase.',
    };
  }
}
