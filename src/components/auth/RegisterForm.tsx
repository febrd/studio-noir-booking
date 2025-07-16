
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface RegisterFormProps {
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export const RegisterForm = ({ onError, onSuccess }: RegisterFormProps) => {
  const { signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    name: '' 
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.email || !registerForm.password || !registerForm.name) {
      onError('Semua field harus diisi');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      onError('Password dan konfirmasi password tidak sama');
      return;
    }

    if (registerForm.password.length < 6) {
      onError('Password minimal 6 karakter');
      return;
    }

    setIsSubmitting(true);
    onError(''); // Clear previous errors

    try {
      console.log('Starting registration process...');
      const { error } = await signUp(registerForm.email, registerForm.password, registerForm.name);
      
      if (error) {
        console.error('Registration failed:', error);
        onError(error.message || 'Registrasi gagal. Coba lagi.');
      } else {
        console.log('Registration successful');
        onSuccess('Registrasi berhasil! Anda akan diarahkan ke dashboard...');
        setRegisterForm({ email: '', password: '', confirmPassword: '', name: '' });
        
        // Redirect to main page after successful registration
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      onError('Terjadi kesalahan yang tidak terduga');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-name">Nama Lengkap</Label>
        <Input
          id="register-name"
          type="text"
          value={registerForm.name}
          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
          placeholder="Nama lengkap Anda"
          disabled={isSubmitting}
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          value={registerForm.email}
          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
          placeholder="email@contoh.com"
          disabled={isSubmitting}
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          value={registerForm.password}
          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
          placeholder="••••••••"
          disabled={isSubmitting}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Konfirmasi Password</Label>
        <Input
          id="register-confirm-password"
          type="password"
          value={registerForm.confirmPassword}
          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
          placeholder="••••••••"
          disabled={isSubmitting}
          autoComplete="new-password"
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
            Mendaftar...
          </>
        ) : (
          'Daftar Sebagai Pelanggan'
        )}
      </Button>
    </form>
  );
};
