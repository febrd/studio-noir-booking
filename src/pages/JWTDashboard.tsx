
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Crown, Shield, CreditCard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JWTDashboard = () => {
  const { userProfile, signOut } = useJWTAuth();
  const navigate = useNavigate();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'keuangan': return <CreditCard className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'keuangan': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner': return 'Pemilik';
      case 'admin': return 'Administrator';
      case 'keuangan': return 'Staff Keuangan';
      case 'pelanggan': return 'Pelanggan';
      default: return role;
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/jwt-auth');
  };

  if (!userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-elegant">
              Halo, {userProfile.name}! 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Selamat datang di sistem autentikasi JWT Studio Noir
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="hover-lift">
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>

        {/* User Profile Card */}
        <Card className="glass-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Pengguna
            </CardTitle>
            <CardDescription>
              Informasi akun dan peran Anda dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                <p className="text-lg font-semibold">{userProfile.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">{userProfile.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm font-mono text-muted-foreground">{userProfile.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Peran</p>
                <Badge className={getRoleColor(userProfile.role)}>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(userProfile.role)}
                    <span>{getRoleName(userProfile.role)}</span>
                  </div>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Access Information */}
        <Card className="glass-elegant">
          <CardHeader>
            <CardTitle>Hak Akses Berdasarkan Peran</CardTitle>
            <CardDescription>
              Berikut adalah hak akses yang Anda miliki berdasarkan peran {getRoleName(userProfile.role)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userProfile.role === 'owner' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Pemilik (Owner)</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Akses penuh ke semua fitur sistem termasuk manajemen pengguna, keuangan, dan administrasi.
                  </p>
                </div>
              )}
              
              {userProfile.role === 'admin' && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-800 dark:text-red-200">Administrator</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Akses ke fitur administrasi sistem, manajemen booking, dan manajemen pelanggan.
                  </p>
                </div>
              )}
              
              {userProfile.role === 'keuangan' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Staff Keuangan</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Akses ke fitur keuangan, laporan transaksi, dan manajemen pembayaran.
                  </p>
                </div>
              )}
              
              {userProfile.role === 'pelanggan' && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Pelanggan</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Akses ke fitur booking studio, melihat riwayat transaksi pribadi, dan manajemen profil.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Options */}
        <Card className="glass-elegant">
          <CardHeader>
            <CardTitle>Menu Navigasi</CardTitle>
            <CardDescription>
              Pilihan menu yang tersedia untuk peran Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(userProfile.role === 'owner' || userProfile.role === 'admin') && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/admin/users')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Manajemen Pengguna
              </Button>
            )}
            
            {(userProfile.role === 'owner' || userProfile.role === 'admin' || userProfile.role === 'keuangan') && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/payment-gateway')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Gateway
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/')}
            >
              <User className="h-4 w-4 mr-2" />
              Dashboard Utama
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JWTDashboard;
