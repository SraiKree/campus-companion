import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for server-side operations with full database access
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to create or get existing auth user
export async function createOrGetAuthUser(email: string, password: string, userData: any) {
  try {
    // Try to create the user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: userData
    });

    // If successful, return the new user
    if (authData?.user && !signUpError) {
      console.log('Created new user:', authData.user.id);
      return { user: authData.user, isNew: true };
    }

    // If user already exists, query the profiles table to get the user ID
    if (signUpError && (signUpError.message.includes('already registered') || signUpError.code === 'email_exists')) {
      console.log('User already exists, fetching from profiles table...');
      
      // Query profiles table to find user by email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (profileError || !profile) {
        console.error('Error finding user in profiles:', profileError);
        throw new Error('User exists but profile not found');
      }
      
      console.log('Found existing user from profiles:', profile.id);
      
      // Update the user's password to ensure it matches
      await supabaseAdmin.auth.admin.updateUserById(profile.id, {
        password,
        user_metadata: userData
      });
      
      // Get the full user object
      const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      
      if (getUserError || !user) {
        throw new Error('Could not retrieve user details');
      }
      
      return { user, isNew: false };
    }

    // If we get here, something else went wrong
    throw signUpError || new Error('Unknown error creating user');
    
  } catch (error) {
    console.error('Error in createOrGetAuthUser:', error);
    throw error;
  }
}