
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
          // Fetch user profile using auth user ID
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
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
      
      // Clear any existing session first
      await supabase.auth.signOut();
      
      // Use Supabase Auth signInWithPassword - this handles password hashing automatically
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: { message: 'Email atau password salah' } };
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
      
      // Create auth user with Supabase (automatically hashes password)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
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
        return { error };
      }

      // If auth user created successfully, create user record in our table
      if (data.user) {
        console.log('Auth user created, now creating user record...');
        
        // Create user record in our users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: data.user.id, // Use the auth user ID
            email: email.trim(),
            name: name,
            role: 'pelanggan'
          });

        if (userError) {
          console.error('Error creating user record:', userError);
          // Don't return error here, auth user is created successfully
        }
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
      console.error('Sign out error:', error);
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
