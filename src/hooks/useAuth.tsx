
import { createContext, useContext, useEffect, useState } from 'react';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'keuangan' | 'pelanggan';
};

interface AuthContextType {
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: any }>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_URL = "https://dduhjdzhxlwuuzidrzzi.supabase.co";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user_profile');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserProfile(user);
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        localStorage.removeItem('auth_user_profile');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in:', email);
      setLoading(true);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log('Login response:', result);
      
      if (result.success) {
        const userProfileData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role
        };
        
        setUserProfile(userProfileData);
        localStorage.setItem('auth_user_profile', JSON.stringify(userProfileData));
        
        return { error: null };
      } else {
        return { error: { message: result.error || 'Login gagal' } };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'Terjadi kesalahan yang tidak terduga' } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Attempting to sign up:', email);
      setLoading(true);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role: 'pelanggan' }),
      });

      const result = await response.json();
      console.log('Register response:', result);
      
      if (result.success) {
        const userProfileData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role
        };
        
        setUserProfile(userProfileData);
        localStorage.setItem('auth_user_profile', JSON.stringify(userProfileData));
        
        return { error: null };
      } else {
        return { error: { message: result.error || 'Registrasi gagal' } };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: { message: 'Terjadi kesalahan yang tidak terduga' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUserProfile(null);
    localStorage.removeItem('auth_user_profile');
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
