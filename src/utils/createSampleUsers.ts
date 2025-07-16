
import { supabase } from '@/integrations/supabase/client';

export const createSampleUsers = async () => {
  const sampleUsers = [
    {
      email: 'owner@studionoir.com',
      password: 'password123',
      name: 'Studio Owner',
      role: 'owner' as const
    },
    {
      email: 'admin@studionoir.com', 
      password: 'password123',
      name: 'Studio Admin',
      role: 'admin' as const
    },
    {
      email: 'keuangan@studionoir.com',
      password: 'password123', 
      name: 'Staff Keuangan',
      role: 'keuangan' as const
    }
  ];

  for (const userData of sampleUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      // Create auth user (this will hash the password automatically)
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

      if (authError) {
        console.error(`Error creating auth user for ${userData.email}:`, authError);
        continue;
      }

      if (authData.user) {
        // Create user record in our users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role
          });

        if (userError) {
          console.error(`Error creating user record for ${userData.email}:`, userError);
        } else {
          console.log(`Successfully created user: ${userData.email}`);
        }
      }
    } catch (error) {
      console.error(`Unexpected error creating user ${userData.email}:`, error);
    }
  }
};
