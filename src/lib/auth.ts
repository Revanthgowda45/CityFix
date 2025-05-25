import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Check if the profiles table exists in Supabase
export const checkProfilesTable = async () => {
  try {
    // List all tables in the public schema
    const { data, error } = await supabase.rpc('get_all_tables');
    
    if (error) {
      console.error('Error checking tables:', error);
      return { exists: false, error };
    }
    
    console.log('Available tables:', data);
    return { exists: data?.includes('profiles'), tables: data };
  } catch (e) {
    console.error('Exception checking tables:', e);
    return { exists: false, error: e };
  }
};

// Check authentication configuration
export const checkAuthConfig = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Current auth session:', data);
    
    return { session: data, error };
  } catch (e) {
    console.error('Error checking auth config:', e);
    return { error: e };
  }
};

export const signUp = async ({ email, password, name }: SignUpData) => {
  try {
    console.log('Starting Supabase signUp process with:', { 
      email, 
      passwordLength: password?.length || 0,
      name 
    });
    
    // Check if we can connect to Supabase properly
    try {
      const { data: pingData, error: pingError } = await supabase.from('auth').select('version');
      console.log('Supabase connection test:', pingData || 'No data', pingError || 'No error');
    } catch (pingErr) {
      console.warn('Supabase connection test failed:', pingErr);
      // Continue anyway
    }
    
    // First attempt the signup with EXACT API format
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'citizen', // Set default role
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      console.error('Supabase auth.signUp error:', error);
      throw error;
    }

    console.log('Supabase signUp response:', JSON.stringify(data));
    
    // If signup was successful but we need to explicitly create a profile
    if (data.user && data.user.id) {
      console.log('User created successfully with ID:', data.user.id);
      
      try {
        // Try a direct insert first
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name: name,
              email: email,
              role: 'citizen',
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error('Failed to create profile using INSERT:', profileError);
          
          // Fall back to upsert if insert fails
          try {
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert([
                {
                  id: data.user.id,
                  name: name,
                  email: email,
                  role: 'citizen',
                  created_at: new Date().toISOString(),
                },
              ], { onConflict: 'id' });
              
            if (upsertError) {
              console.error('Also failed to create profile with UPSERT:', upsertError);
            } else {
              console.log('Profile created successfully using UPSERT');
            }
          } catch (upsertErr) {
            console.error('Exception during profile UPSERT:', upsertErr);
          }
        } else {
          console.log('Profile created successfully using INSERT');
        }
      } catch (profileErr) {
        console.error('Exception creating profile:', profileErr);
      }
    } else {
      console.warn('User object is incomplete or missing ID:', data);
    }

    return data;
  } catch (error) {
    console.error('Exception in signUp function:', error);
    throw error;
  }
};

export const signIn = async ({ email, password }: SignInData) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
};

export const updateUserRole = async (userId: string, role: 'citizen' | 'admin') => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
}; 