
import { useState } from 'react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const JWTAuth = () => {
  const { userProfile, signIn, signUp, loading } = useJWTAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });

  // Redirect if already authenticated
  if (userProfile) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      setError('Email/Whatsapp dan password harus diisi');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const result = await signIn(loginForm.email, loginForm.password);
    
    if (!result.success) {
      setError(result.error || 'Login gagal');
    } else {
      // Success will redirect via useEffect
    }
    
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError('Semua field harus diisi');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const result = await signUp(registerForm.email, registerForm.password, registerForm.name);
    
    if (!result.success) {
      setError(result.error || 'Registrasi gagal');
    } else {
      setSuccess('Registrasi berhasil! Anda Akan Diarahkan ke Halaman Login...');
      const loginResult = await signIn(registerForm.email, registerForm.password);
      if (!loginResult.success) {
        setError('Registrasi berhasil tapi gagal login otomatis. Silakan login manual.');
      }
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });

    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-elegant">Studio Noir</h1>
          <p className="text-muted-foreground mt-2">Professional Photo Studio Management</p>
        </div>

        <Card className="glass-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-elegant">Selamat Datang</CardTitle>
            <CardDescription>
              Masuk ke akun Anda atau daftar sebagai pelanggan baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mt-4 border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login">
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
                    <p className="font-medium mb-1">Gunakan Credentials yang terdaftar</p>
                   
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
              </TabsContent>

              <TabsContent value="register">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JWTAuth;
