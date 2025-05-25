import { createClient } from '@supabase/supabase-js';

// Get Supabase values from environment variables (.env file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Verify that the environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  // Add a visible error in development to make it obvious something is wrong
  if (import.meta.env.DEV) {
    document.body.innerHTML = '<h1 style="color: red; padding: 20px;">ERROR: Missing Supabase credentials in .env file!</h1>';
  }
}

console.log('Initializing Supabase client with URL:', supabaseUrl.substring(0, 20) + '...');

console.log('Initializing Supabase client with persistent storage');

// Configure the Supabase client with explicit headers to ensure API key is included
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Set longer storage TTL for better persistence across reloads
    storageKey: 'cityfix-auth-storage',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  }
});

// On initial load, try to restore a session (helps with reload issues)
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Failed to load Supabase session:', error);
    return;
  }
  
  if (data?.session) {
    console.log('Initial session loaded successfully for user:', data.session.user.email);
    
    // Save a marker in localStorage that can be checked to verify authentication state
    try {
      localStorage.setItem('cityfix-session-active', 'true');
      localStorage.setItem('cityfix-user-id', data.session.user.id);
      
      // Also set a cookie for more reliable cross-page persistence
      document.cookie = `cityfix-user-id=${data.session.user.id}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
      document.cookie = `cityfix-auth-state=authenticated; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
    } catch (e) {
      console.warn('Failed to set auth persistence markers:', e);
    }
  } else {
    console.log('No initial session found');
    // Clear any stale auth data
    localStorage.removeItem('cityfix-session-active');
  }
});

// Log successful initialization
console.log('Supabase client initialized successfully');

// Add a function to manually check if the API key is being included in requests
export const checkSupabaseConnection = async () => {
  try {
    // Attempt a simple query to test the connection
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection test succeeded');
    return { success: true };
  } catch (e) {
    console.error('Error testing Supabase connection:', e);
    return { success: false, error: e };
  }
};

// Types for issues
export type IssueStatus = 'reported' | 'under_review' | 'in_progress' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueCategory = 'road' | 'water' | 'electricity' | 'waste' | 'other';

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category: IssueCategory;
  original_category?: string; // Store the frontend category type (optional if not in DB)
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  assigned_to?: string;
  resolution_notes?: string;
  votes: number;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
} 