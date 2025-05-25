import { supabase } from './supabase';

/**
 * Utility for enhancing session persistence in the CityFix application
 * This addresses the "User not authenticated" error on page reload
 */

// Keys used for storing session information
const SESSION_STORAGE_KEY = 'cityfix-session-active';
const USER_ID_COOKIE_KEY = 'cityfix-user-id';
const AUTH_STATE_COOKIE_KEY = 'cityfix-auth-state';
const USER_DATA_STORAGE_KEY = 'cityfix-user-data';

// Cookie helper functions
export const setCookie = (name: string, value: string, days = 30) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`;
};

/**
 * Initializes authentication persistence to ensure session isn't lost on reload
 * Call this function once at application startup
 */
export const initAuthPersistence = async () => {
  console.log('Initializing auth persistence...');
  
  try {
    // Attempt to restore session from Supabase storage
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      clearAuthPersistence();
      return null;
    }
    
    if (data?.session?.user) {
      console.log('Session found, user:', data.session.user.email);
      
      // Store session markers for redundant auth checks
      localStorage.setItem(SESSION_STORAGE_KEY, 'true');
      setCookie(USER_ID_COOKIE_KEY, data.session.user.id, 30);
      setCookie(AUTH_STATE_COOKIE_KEY, 'authenticated', 30);
      
      // Also store some basic user info for quick access
      try {
        // Try to get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('name,role,avatar_url')
          .eq('id', data.session.user.id)
          .single();
          
        const userData = {
          id: data.session.user.id,
          email: data.session.user.email,
          name: profile?.name || data.session.user.email?.split('@')[0] || 'User',
          role: profile?.role || 'citizen',
          avatar: profile?.avatar_url,
        };
        
        localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(userData));
      } catch (e) {
        console.warn('Error fetching profile for persistence:', e);
        
        // Still save basic user info from session
        const basicUserData = {
          id: data.session.user.id,
          email: data.session.user.email,
          name: data.session.user.email?.split('@')[0] || 'User',
          role: 'citizen',
        };
        
        localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(basicUserData));
      }
      
      return data.session.user;
    } else {
      console.log('No active session found');
      clearAuthPersistence();
      return null;
    }
  } catch (e) {
    console.error('Error initializing auth persistence:', e);
    clearAuthPersistence();
    return null;
  }
};

/**
 * Checks if the user has an active session using multiple methods
 * This provides a more robust auth check than just checking React state
 */
export const hasActiveSession = (): boolean => {
  // Check multiple indicators of authentication
  const hasSessionStorage = localStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  const hasUserIdCookie = !!getCookie(USER_ID_COOKIE_KEY);
  const hasAuthStateCookie = getCookie(AUTH_STATE_COOKIE_KEY) === 'authenticated';
  const hasUserData = !!localStorage.getItem(USER_DATA_STORAGE_KEY);
  
  // Return true if ANY persistence method indicates authentication
  return hasSessionStorage || hasUserIdCookie || hasAuthStateCookie || hasUserData;
};

/**
 * Clears all authentication persistence data
 * Call this on logout
 */
export const clearAuthPersistence = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(USER_DATA_STORAGE_KEY);
  deleteCookie(USER_ID_COOKIE_KEY);
  deleteCookie(AUTH_STATE_COOKIE_KEY);
};
