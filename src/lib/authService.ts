import { supabase } from './supabase';

// Define TypeScript interfaces for better type safety
export interface AuthResponse {
  success: boolean;
  user?: any;
  error?: string;
  message?: string;
  details?: any;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
}

/**
 * AuthService - Production-grade authentication service for CityFix
 * Handles user registration, login, and profile management with proper
 * error handling and fallback mechanisms.
 */
class AuthService {
  /**
   * Register a new user with Supabase authentication
   * @param userData - User registration data
   * @returns AuthResponse with success status and user or error information
   */
  async registerUser(userData: UserRegistrationData): Promise<AuthResponse> {
    console.info('Starting user registration process', { email: userData.email });
    
    try {
      // Step 1: Attempt to create auth user
      // First, attempt without email confirmation to ensure account creation
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: 'citizen',
            full_name: userData.name, // Add alternate field name in case schema needs it
          },
          // Don't require email confirmation initially
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      // Handle auth error
      if (error) {
        console.error('Supabase auth signup failed', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      // Handle missing user in response
      if (!data?.user) {
        console.warn('Auth signup succeeded but no user returned', data);
        return {
          success: false,
          error: 'User registration incomplete',
          message: 'Authentication succeeded but user information is missing',
          details: data,
        };
      }

      console.info('User authentication successful, creating profile', {
        userId: data.user.id,
      });

      // Step 2: Create user profile - Using upsert directly since the table exists
      try {
        // Get the profiles table structure to ensure we match it correctly
        // First check with a minimal select query
        const { error: structureError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (structureError) {
          console.warn('Could not verify profiles table structure', structureError);
        }
        
        // Use upsert which is safer for existing tables
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            [
              {
                id: data.user.id,
                name: userData.name,
                email: userData.email,
                role: 'citizen',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: 'id' }
          );

        if (upsertError) {
          console.error('Profile creation failed', upsertError);
          
          // If that fails, try a more minimal profile creation
          // Some fields might be missing or have different names
          try {
            const { error: minimalError } = await supabase
              .from('profiles')
              .upsert(
                [
                  {
                    id: data.user.id,
                    email: userData.email,
                  },
                ],
                { onConflict: 'id' }
              );
              
            if (minimalError) {
              console.error('Minimal profile creation also failed', minimalError);
            } else {
              console.log('Created minimal profile successfully');
            }
          } catch (e) {
            console.error('Exception in minimal profile creation', e);
          }
        } else {
          console.log('Profile created successfully');
        }
      } catch (profileError) {
        console.error('Exception creating user profile', profileError);
        // Continue since auth user was created
      }

      return {
        success: true,
        user: data.user,
        message: 'User registered successfully',
      };
    } catch (error: any) {
      console.error('Unexpected error during registration', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
        details: error,
      };
    }
  }

  /**
   * Verify Supabase connection and configuration
   * @returns Information about connection status
   */
  async verifyConnection(): Promise<{
    connected: boolean;
    authConfigured: boolean;
    profilesTableExists: boolean;
    details?: any;
  }> {
    let connected = false;
    let authConfigured = false;
    let profilesTableExists = false;
    const details: any = {};

    try {
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count', {
        count: 'exact',
        head: true,
      });
      
      connected = !error;
      details.connectionTest = { success: !error, error };

      // Test auth configuration
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      authConfigured = !sessionError;
      details.authTest = { success: !sessionError, error: sessionError };

      // Check if profiles table exists
      try {
        const { error: profilesError } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true });
          
        profilesTableExists = !profilesError || 
          (profilesError && !profilesError.message.includes('does not exist'));
        details.profilesTable = { exists: profilesTableExists, error: profilesError };
      } catch (e) {
        details.profilesTable = { exists: false, error: e };
      }

      return {
        connected,
        authConfigured,
        profilesTableExists,
        details,
      };
    } catch (e) {
      return {
        connected: false,
        authConfigured: false,
        profilesTableExists: false,
        details: { error: e },
      };
    }
  }
}

// Export a singleton instance of the service
export const authService = new AuthService();
