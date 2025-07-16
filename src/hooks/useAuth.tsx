
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type UserProfile = Tables<'users'>;

interface AuthContextType {
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('studio_noir_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserProfile(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('studio_noir_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting to sign in with:', email);
      
      // Call RPC function to verify password and get user
      const { data, error } = await supabase.rpc('authenticate_user', {
        user_email: email.trim(),
        user_password: password
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: { message: 'Email atau password salah' } };
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { error: { message: 'Email atau password salah' } };
      }

      const user = Array.isArray(data) ? data[0] : data;
      console.log('Sign in successful:', user.email);
      
      // Store user in localStorage and state
      localStorage.setItem('studio_noir_user', JSON.stringify(user));
      setUserProfile(user);
      
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
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.trim())
        .single();

      if (existingUser) {
        return { error: { message: 'Email sudah terdaftar' } };
      }

      // Hash password and create user
      const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
        password: password
      });

      if (hashError) {
        console.error('Error hashing password:', hashError);
        return { error: { message: 'Gagal memproses password' } };
      }

      // Create user record
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: email.trim(),
          name: name,
          role: 'pelanggan',
          password: hashedPassword
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        return { error: { message: 'Gagal membuat akun. Coba lagi.' } };
      }

      console.log('Sign up successful:', newUser.email);
      return { error: null };
    } catch (err) {
      console.error('Unexpected error in signUp:', err);
      return { error: { message: 'Terjadi kesalahan yang tidak terduga' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('studio_noir_user');
      setUserProfile(null);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/auth';
    }
  };

  const value = {
    userProfile,
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
