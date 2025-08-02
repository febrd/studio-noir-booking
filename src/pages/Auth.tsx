
import { useState } from 'react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleCaptcha } from '@/components/auth/SimpleCaptcha';

const Auth = () => {
  const { userProfile, loading, signIn, signUp } = useJWTAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    name: '' 
  });
  
  // Captcha states
  const [loginCaptchaValid, setLoginCaptchaValid] = useState(false);
  const [registerCaptchaValid, setRegisterCaptchaValid] = useState(false);
  const [loginCaptchaReset, setLoginCaptchaReset] = useState(false);
  const [registerCaptchaReset, setRegisterCaptchaReset] = useState(false);


  // Redirect if already authenticated
  if (userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      setError('Email dan password harus diisi');
      return;
    }

    if (!loginCaptchaValid) {
      setError('Silakan selesaikan verifikasi captcha terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const result = await signIn(loginForm.email, loginForm.password);
      
      if (!result.success) {
        console.error('Login failed:', result.error);
        setError(result.error || 'Login gagal. Periksa email dan password Anda.');
        setLoginCaptchaReset(!loginCaptchaReset);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('Terjadi kesalahan yang tidak terduga');
      setLoginCaptchaReset(!loginCaptchaReset);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.email || !registerForm.password || !registerForm.name) {
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

    if (!registerCaptchaValid) {
      setError('Silakan selesaikan verifikasi captcha terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const result = await signUp(registerForm.email, registerForm.password, registerForm.name);
      
      if (!result.success) {
        console.error('Registration failed:', result.error);
        setError(result.error || 'Registrasi gagal. Coba lagi.');
        setRegisterCaptchaReset(!registerCaptchaReset);
      } else {
        setSuccess('Registrasi berhasil! Silakan login dengan akun baru Anda.');
        setRegisterForm({ email: '', password: '', confirmPassword: '', name: '' });
        
        setTimeout(() => {
          setActiveTab('login');
        }, 1500);
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      setError('Terjadi kesalahan yang tidak terduga');
      setRegisterCaptchaReset(!registerCaptchaReset);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Masuk Studio
            </h1>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-pulse"></div>
          </div>
          <p className="text-muted-foreground text-lg">Your Best Self, Captured</p>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-sm bg-card/95 border-2 border-primary/10 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <CardTitle className="text-2xl font-bold text-primary">Selamat Datang</CardTitle>
            <CardDescription className="text-base">
              Masuk ke akun Anda atau daftar sebagai pelanggan baru
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm font-medium">
                  Masuk Yuk!
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm font-medium">
                  Belum Pernah Masuk
                </TabsTrigger>
              </TabsList>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800 animate-in slide-in-from-top-2">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">
                      Email/Whatsapp
                    </Label>
                    <Input
                      id="login-email"
                      type="text"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="Email/Whatsapp Anda"
                      disabled={isSubmitting}
                      autoComplete="email"
                      className="h-11 text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        autoComplete="current-password"
                        className="h-11 text-base pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <SimpleCaptcha 
                    onValidation={setLoginCaptchaValid}
                    reset={loginCaptchaReset}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium"
                    disabled={isSubmitting || !loginCaptchaValid}
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

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-sm font-medium">
                      Nama Lengkap
                    </Label>
                    <Input
                      id="register-name"
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="Nama lengkap Anda"
                      disabled={isSubmitting}
                      autoComplete="name"
                      className="h-11 text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-medium">
                      Email/Whatsapp
                    </Label>
                    <Input
                      id="register-email"
                      type="text"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="Email/Whatsapp Anda"
                      disabled={isSubmitting}
                      autoComplete="email"
                      className="h-11 text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        className="h-11 text-base pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-sm font-medium">
                      Konfirmasi Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        className="h-11 text-base pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <SimpleCaptcha 
                    onValidation={setRegisterCaptchaValid}
                    reset={registerCaptchaReset}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium"
                    disabled={isSubmitting || !registerCaptchaValid}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2025 Masuk Studio. Semua hak cipta dilindungi.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
