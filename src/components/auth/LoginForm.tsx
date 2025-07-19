
import { useState } from 'react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface LoginFormProps {
  onError: (error: string) => void;
}

export const LoginForm = ({ onError }: LoginFormProps) => {
  const { signIn, userProfile } = useJWTAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // If user is already authenticated, redirect to dashboard
  if (userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      onError('Email dan password harus diisi');
      return;
    }

    setIsSubmitting(true);
    onError(''); // Clear previous errors

    try {
      console.log('Starting login process...');
      const result = await signIn(loginForm.email, loginForm.password);
      
      if (!result.success) {
        console.error('Login failed:', result.error);
        onError(result.error || 'Login gagal. Periksa email dan password Anda.');
      } else {
        console.log('Login successful, redirecting...');
        // Force page reload to ensure clean state
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      onError('Terjadi kesalahan yang tidak terduga');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email/Whatsapp</Label>
        <Input
          id="login-email"
          type="text"
          value={loginForm.email}
          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
          placeholder="Email/Whatsapp Anda"
          disabled={isSubmitting}
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          value={loginForm.password}
          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          placeholder="••••••••"
          disabled={isSubmitting}
          autoComplete="current-password"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          'Masuk'
        )}
      </Button>
    </form>
  );
};
