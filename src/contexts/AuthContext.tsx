import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loading } from "@/components/ui/loading";
import { cleanupLocalStorage, setCookie, deleteCookie, getCookie } from '@/lib/storageUtils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
  avatar?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Define fetchUserProfile as a memoized function to avoid recreating it
  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  }, []);
  
  // Function to update auth state when user is authenticated
  const updateAuthState = useCallback(async (user: any, profile: any) => {
    if (!user) return false;
    
    try {
      // If profile wasn't provided, try to fetch it
      let userProfile = profile;
      if (!userProfile) {
        userProfile = await fetchUserProfile(user.id);
      }
      
      if (userProfile) {
        setCurrentUser({
          id: user.id,
          name: userProfile.name,
          email: user.email,
          role: userProfile.role,
          avatar: userProfile.avatar_url
        });
        setIsAuthenticated(true);
        
        // Store user ID in cookie for quick session restoration
        setCookie('cityfix-user-id', user.id, 7); // Store for 7 days
        
        return true;
      } else {
        // Fallback with minimal user data if profile isn't available
        setCurrentUser({
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'citizen' // Default role
        });
        setIsAuthenticated(true);
        
        // Store user ID in cookie for quick session restoration
        setCookie('cityfix-user-id', user.id, 7);
        
        return true;
      }
    } catch (error) {
      console.error('Error updating auth state:', error);
      return false;
    }
  }, [fetchUserProfile]);
  
  // Initialize authentication state
  // Track whether we're in the initial auth process
  const [initialAuthComplete, setInitialAuthComplete] = useState(false);

  useEffect(() => {
    console.log('=== AUTH CONTEXT INITIALIZED ===');
    // Clean up localStorage first (non-blocking)
    try {
      cleanupLocalStorage();
    } catch (error) {
      console.warn('Error cleaning localStorage:', error);
    }
    
    let isMounted = true;
    let authAttempted = false;
    
    // Ensure Supabase loads from localStorage on init
    const ensureStorageSynced = () => {
      try {
        // Force Supabase to try loading session from storage
        const supabaseAuthData = localStorage.getItem('supabase.auth.token');
        if (supabaseAuthData) {
          console.log('Found Supabase auth data in localStorage');
        }
      } catch (e) {
        console.warn('Error checking Supabase storage:', e);
      }
    };
    
    // Try to restore from localStorage first for instant UI response
    const attemptQuickAuth = () => {
      try {
        // Check for cached user data in localStorage
        const cachedUserData = localStorage.getItem('cityfix-user-data');
        if (cachedUserData) {
          const userData = JSON.parse(cachedUserData);
          if (userData && userData.id && userData.email) {
            // Set cached user data for immediate UI render
            console.log('Using cached user data for quick auth');
            setCurrentUser(userData);
            setIsAuthenticated(true);
            setLoading(false);
            
            // Ensure we have cookies too for API requests
            setCookie('cityfix-user-id', userData.id, 30);
            setCookie('cityfix-auth-state', 'authenticated', 30);
            
            return true; // Successfully restored from cache
          }
        }
        return false; // No cache or invalid cache
      } catch (e) {
        console.warn('Error during quick auth:', e);
        return false;
      }
    };
    
    // Load session from Supabase
    const loadSupabaseSession = async () => {
      if (authAttempted) return;
      authAttempted = true;

      try {
        // First make sure storage is properly loaded
        ensureStorageSynced();
        
        console.log('Getting Supabase session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Failed to get session:', error);
          setLoading(false);
          return;
        }
        
        if (data?.session?.user) {
          console.log('Active session found, user:', data.session.user.email);
          
          try {
            // Fetch user profile
            const profile = await fetchUserProfile(data.session.user.id);
            
            // Create user object
            const user: User = {
              id: data.session.user.id,
              name: profile?.name || data.session.user.email?.split('@')[0] || 'User',
              email: data.session.user.email!,
              role: profile?.role || 'citizen',
              avatar: profile?.avatar_url
            };
            
            // Update state
            setCurrentUser(user);
            setIsAuthenticated(true);
            
            // Save to localStorage and cookies for future quick loads
            localStorage.setItem('cityfix-user-data', JSON.stringify(user));
            setCookie('cityfix-user-id', user.id, 30);
            setCookie('cityfix-auth-state', 'authenticated', 30);
            
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            
            // Still set basic user info
            const basicUser: User = {
              id: data.session.user.id,
              name: data.session.user.email?.split('@')[0] || 'User',
              email: data.session.user.email!,
              role: 'citizen'
            };
            
            setCurrentUser(basicUser);
            setIsAuthenticated(true);
            localStorage.setItem('cityfix-user-data', JSON.stringify(basicUser));
          }
        } else {
          console.log('No active session found');
          // Clear state just to be safe
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth process failed:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialAuthComplete(true);
        }
      }
    };
    
    // Try quick auth first (synchronous)
    const quickAuthSuccessful = attemptQuickAuth();
    
    // Then try loading from Supabase (async, but only if quick auth failed)
    if (!quickAuthSuccessful) {
      console.log('Quick auth failed or not available, trying Supabase session');
      // Add slight delay to allow React to render with current state first
      setTimeout(loadSupabaseSession, 50);
    } else {
      // Still check Supabase session in background to ensure token freshness
      setTimeout(loadSupabaseSession, 1000);
      // Mark initialization as complete
      setInitialAuthComplete(true);
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.email);
        // Reload the full auth state
        loadSupabaseSession();
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('cityfix-user-data');
        deleteCookie('cityfix-user-id');
        deleteCookie('cityfix-auth-state');
      }
    });
    
    // Cleanup function
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);  // Empty dependency array - only run once
    
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Attempt to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data?.user) {
        console.log('Login successful in AuthContext, redirecting to dashboard...');
        // Fetch user profile and update auth state
        const profile = await fetchUserProfile(data.user.id);
        await updateAuthState(data.user, profile);
        
        // Force navigation to dashboard after login - this is more reliable than React Router
        // We use a small timeout to ensure the auth state is updated first
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
        
        return; // Explicitly return void to match the Promise<void> type
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name,
              role: 'citizen',
            }
          ]);

        if (profileError) throw profileError;
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      // Clear auth cookie on logout
      document.cookie = 'cityfix-auth-state=; path=/; max-age=0; SameSite=Strict';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          avatar_url: userData.avatar,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // This approach allows the app to render immediately while auth completes in background
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin: currentUser?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {loading ? (
        <Loading fullScreen text={authError || "Loading authentication..."} />
      ) : children}
    </AuthContext.Provider>
  );
};
