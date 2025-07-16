
import { supabase } from '@/integrations/supabase/client';

export const createSampleUsers = async () => {
  console.log('Creating sample users...');
  
  const sampleUsers = [
    {
      email: 'owner@studionoir.com',
      password: 'password123',
      name: 'Owner Studio Noir',
      role: 'owner' as const
    },
    {
      email: 'admin@studionoir.com', 
      password: 'password123',
      name: 'Admin Studio Noir',
      role: 'admin' as const
    },
    {
      email: 'keuangan@studionoir.com',
      password: 'password123', 
      name: 'Staff Keuangan',
      role: 'keuangan' as const
    },
    {
      email: 'pelanggan@studionoir.com',
      password: 'password123',
      name: 'Pelanggan Demo',
      role: 'pelanggan' as const
    }
  ];

  for (const userData of sampleUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: userData.name,
            user_role: userData.role
          }
        }
      });

      if (authError && authError.message !== 'User already registered') {
        console.error(`Error creating auth user ${userData.email}:`, authError);
        continue;
      }

      // If auth user was created or already exists, ensure profile exists
      let userId = authData?.user?.id;
      
      // If user already exists, get their ID
      if (!userId && authError?.message === 'User already registered') {
        const { data: existingSession } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });
        userId = existingSession?.user?.id;
        await supabase.auth.signOut();
      }

      if (userId) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (!existingProfile) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: userData.email,
              name: userData.name,
              role: userData.role
            });

          if (profileError) {
            console.error(`Error creating profile for ${userData.email}:`, profileError);
          } else {
            console.log(`Successfully created profile for ${userData.email}`);
          }
        } else {
          console.log(`Profile already exists for ${userData.email}`);
        }
      }
    } catch (error) {
      console.error(`Unexpected error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('Sample users creation completed');
};

// Utility to test login for all sample users
export const testSampleUsersLogin = async () => {
  const testUsers = [
    { email: 'owner@studionoir.com', password: 'password123' },
    { email: 'admin@studionoir.com', password: 'password123' },
    { email: 'keuangan@studionoir.com', password: 'password123' },
    { email: 'pelanggan@studionoir.com', password: 'password123' }
  ];

  for (const user of testUsers) {
    try {
      console.log(`Testing login for: ${user.email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        console.error(`Login failed for ${user.email}:`, error);
      } else {
        console.log(`Login successful for ${user.email}`);
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error(`Unexpected error testing login for ${user.email}:`, error);
    }
  }
};
