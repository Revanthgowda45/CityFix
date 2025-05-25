import { supabase } from '@/lib/supabase';
import { updateUserRole } from '@/lib/auth';

// Replace this with your user ID after registration
const userId = 'YOUR_USER_ID';

const makeAdmin = async () => {
  try {
    await updateUserRole(userId, 'admin');
    console.log('Successfully updated user to admin role');
  } catch (error) {
    console.error('Error updating user role:', error);
  }
};

makeAdmin(); 