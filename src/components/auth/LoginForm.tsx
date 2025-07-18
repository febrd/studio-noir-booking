
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onError: (error: string) => void;
}

export const LoginForm = ({ onError }: LoginFormProps) => {
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

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
      const { error } = await signIn(loginForm.email, loginForm.password);
      
      if (error) {
        console.error('Login failed:', error);
        onError(error.message || 'Login gagal. Periksa email dan password Anda.');
      } else {
        console.log('Login successful');
        // Success will redirect to main page
        window.location.href = '/';
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
      
      {/* Sample users info */}
      <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
      
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
