
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'keuangan' | 'pelanggan';
  is_active: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface JWTAuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => void;
}

const JWTAuthContext = createContext<JWTAuthContextType | undefined>(undefined);

export const useJWTAuth = () => {
  const context = useContext(JWTAuthContext);
  if (context === undefined) {
    throw new Error('useJWTAuth must be used within a JWTAuthProvider');
  }
  return context;
};

export const JWTAuthProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored JWT session
    const storedUser = localStorage.getItem('jwt_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserProfile(parsed);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('jwt_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      console.log('JWT Auth: Attempting sign in with email:', email);
      
      const { data, error } = await supabase.rpc('login_user', {
        user_email: email,
        user_password: password
      });

      if (error) {
        console.error('JWT Auth sign in error:', error);
        return { success: false, error: error.message || 'Login gagal' };
      }

      // Safely cast the data with proper type checking
      const result = data as any;
      
      if (!result || typeof result !== 'object' || !result.success) {
        return { success: false, error: result?.error || 'Login gagal' };
      }

      if (result.user) {
        // Check if user is active
        if (result.user.is_active === false) {
          return { success: false, error: 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.' };
        }

        setUserProfile(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('jwt_user', JSON.stringify(result.user));
        
        // Also update Supabase auth session with role info
        try {
          await supabase.auth.signInWithPassword({ email, password });
          await supabase.auth.updateUser({
            data: { user_role: result.user.role }
          });
        } catch (authError) {
          console.warn('Failed to sync with Supabase auth:', authError);
        }
        
        toast.success('Login berhasil!');
        return { success: true };
      }

      return { success: false, error: 'Data user tidak ditemukan' };
    } catch (error) {
      console.error('Unexpected JWT sign in error:', error);
      return { success: false, error: 'Terjadi kesalahan sistem' };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.rpc('register_user', {
        user_name: name,
        user_email: email,
        user_password: password,
        user_role: 'pelanggan'
      });

      if (error) {
        console.error('JWT Auth signup error:', error);
        return { success: false, error: error.message || 'Registrasi gagal' };
      }

      // Safely cast the data with proper type checking
      const result = data as any;
      
      if (!result || typeof result !== 'object' || !result.success) {
        return { success: false, error: result?.error || 'Registrasi gagal' };
      }

      toast.success('Registrasi berhasil! Silakan login dengan akun baru Anda.');
      return { success: true };
    } catch (error) {
      console.error('Unexpected JWT signup error:', error);
      return { success: false, error: 'Terjadi kesalahan sistem' };
    }
  };

  const signOut = () => {
    setUserProfile(null);
    setIsAuthenticated(false);
    localStorage.removeItem('jwt_user');
    
    // Also sign out from Supabase auth
    supabase.auth.signOut().catch(console.warn);
    
    toast.success('Logout berhasil!');
  };

  return (
    <JWTAuthContext.Provider
      value={{
        userProfile,
        loading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </JWTAuthContext.Provider>
  );
};
