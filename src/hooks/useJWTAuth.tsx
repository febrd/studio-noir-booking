
import { createContext, useContext, useEffect, useState } from 'react';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'keuangan' | 'pelanggan';
};

interface JWTAuthContextType {
  userProfile: UserProfile | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const JWTAuthContext = createContext<JWTAuthContextType | undefined>(undefined);

const SUPABASE_URL = "https://dduhjdzhxlwuuzidrzzi.supabase.co";

export const JWTAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('user_profile');
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setToken(storedToken);
        setUserProfile(user);
        // Verify token is still valid
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_profile');
      }
    }
    setLoading(false);
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        // Token expired or invalid
        signOut();
      } else {
        // Update user profile with fresh data
        setUserProfile(result.user);
        localStorage.setItem('user_profile', JSON.stringify(result.user));
      }
    } catch (error) {
      console.error('Token verification error:', error);
      signOut();
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      
      if (result.success) {
        setToken(result.token);
        setUserProfile(result.user);
        localStorage.setItem('jwt_token', result.token);
        localStorage.setItem('user_profile', JSON.stringify(result.user));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Terjadi kesalahan yang tidak terduga' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string, role: string = 'pelanggan') => {
    try {
      setLoading(true);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const result = await response.json();
      
      if (result.success) {
        setToken(result.token);
        setUserProfile(result.user);
        localStorage.setItem('jwt_token', result.token);
        localStorage.setItem('user_profile', JSON.stringify(result.user));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Terjadi kesalahan yang tidak terduga' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setToken(null);
    setUserProfile(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_profile');
  };

  const value = {
    userProfile,
    token,
    signIn,
    signUp,
    signOut,
    loading,
    isAuthenticated: !!userProfile && !!token,
  };

  return <JWTAuthContext.Provider value={value}>{children}</JWTAuthContext.Provider>;
};

export const useJWTAuth = () => {
  const context = useContext(JWTAuthContext);
  if (context === undefined) {
    throw new Error('useJWTAuth must be used within a JWTAuthProvider');
  }
  return context;
};
