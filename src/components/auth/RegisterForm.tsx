
import { useState } from 'react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { SimpleCaptcha } from './SimpleCaptcha';

interface RegisterFormProps {
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export const RegisterForm = ({ onError, onSuccess }: RegisterFormProps) => {
  const { signUp } = useJWTAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    name: '' 
  });
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(false);

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

    if (!isCaptchaValid) {
      onError('Silakan selesaikan verifikasi captcha terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    onError(''); // Clear previous errors

    try {
      const result = await signUp(registerForm.email, registerForm.password, registerForm.name);
      
      if (!result.success) {
        console.error('Registration failed:', result.error);
        onError(result.error || 'Registrasi gagal. Coba lagi.');
        // Reset captcha on failed registration
        setCaptchaReset(!captchaReset);
      } else {
        onSuccess('Registrasi berhasil! Password telah di-hash dengan aman. Silakan login dengan akun baru Anda.');
        setRegisterForm({ email: '', password: '', confirmPassword: '', name: '' });
        
        // Switch to login tab after successful registration
        setTimeout(() => {
          const loginTab = document.querySelector('[value="login"]') as HTMLElement;
          if (loginTab) {
            loginTab.click();
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      onError('Terjadi kesalahan yang tidak terduga');
      // Reset captcha on error
      setCaptchaReset(!captchaReset);
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
        <Label htmlFor="register-email">Email/Whatsapp</Label>
        <Input
          id="register-email"
          type="text"
          value={registerForm.email}
          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
          placeholder="Email/Whatsapp Anda"
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
        <p className="text-xs text-gray-500">
          Minimal 6 karakter. Password akan di-hash untuk keamanan.
        </p>
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

      <SimpleCaptcha 
        onValidation={setIsCaptchaValid}
        reset={captchaReset}
      />
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting || !isCaptchaValid}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Mendaftar...
          </>
        ) : (
          'Daftar Pelanggan Baru'
        )}
      </Button>
    </form>
  );
};
