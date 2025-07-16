
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type UserProfile = Tables<'users'>;

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', session.user.email)
                .single();
              
              if (error) {
                console.error('Error fetching user profile:', error);
              } else {
                console.log('User profile fetched:', profile);
                setUserProfile(profile);
              }
            } catch (err) {
              console.error('Error in profile fetch:', err);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting to sign in with:', email);
      
      // First, check if user exists in our users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userRecord) {
        console.error('User not found in users table:', userError);
        return { error: { message: 'Email atau password salah' } };
      }

      console.log('User found:', userRecord.email, userRecord.role);

      // Try to sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        
        // If auth user doesn't exist, create it
        if (error.message.includes('Invalid login credentials')) {
          console.log('Creating auth user for existing user record...');
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                name: userRecord.name,
                user_role: userRecord.role
              }
            }
          });
          
          if (signUpError) {
            console.error('Error creating auth user:', signUpError);
            return { error: signUpError };
          }
          
          // Try signing in again
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          return { error: retryError };
        }
        
        return { error };
      }

      console.log('Sign in successful:', data.user?.email);
      return { error: null };
    } catch (err) {
      console.error('Unexpected error in signIn:', err);
      return { error: { message: 'Terjadi kesalahan yang tidak terduga' } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      console.log('Attempting to sign up:', email);
      
      // First create user in our users table
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          password: password, // This will be hashed by trigger if we had one
          name,
          role: 'pelanggan'
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user record:', userError);
        return { error: userError };
      }

      console.log('User record created:', newUser);

      // Then create auth user
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
            user_role: 'pelanggan'
          }
        }
      });

      if (error) {
        console.error('Error creating auth user:', error);
        // If auth creation fails, remove the user record
        await supabase.from('users').delete().eq('id', newUser.id);
      }

      return { error };
    } catch (err) {
      console.error('Unexpected error in signUp:', err);
      return { error: { message: 'Terjadi kesalahan yang tidak terduga' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      setUserProfile(null);
      setSession(null);
      window.location.href = '/auth';
    } catch (error) {
      // Continue even if this fails
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    userProfile,
    session,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
