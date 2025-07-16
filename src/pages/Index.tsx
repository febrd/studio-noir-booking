import { useAuth } from '@/hooks/useAuth';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentBookings } from '@/components/Dashboard/RecentBookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Crown, Shield, CreditCard, ExternalLink, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { userProfile: supabaseUser } = useAuth();
  const { userProfile: jwtUser, isAuthenticated: jwtAuthenticated } = useJWTAuth();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-elegant">Studio Noir</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sistem manajemen studio foto profesional dengan dual authentication system
            </p>
          </div>

          {/* Current User Info */}
          {supabaseUser && (
            <Card className="glass-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Logged in with Supabase Auth
                </CardTitle>
                <CardDescription>Menggunakan sistem autentikasi Supabase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{supabaseUser.name}</p>
                    <p className="text-sm text-muted-foreground">{supabaseUser.email}</p>
                  </div>
                  <Badge className={getRoleColor(supabaseUser.role)}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(supabaseUser.role)}
                      <span className="capitalize">{supabaseUser.role}</span>
                    </div>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* JWT Auth System Info */}
          <Card className="glass-elegant border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Sistem Autentikasi JWT Manual
              </CardTitle>
              <CardDescription>
                Sistem autentikasi JWT custom yang tidak menggunakan Supabase Auth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jwtAuthenticated && jwtUser ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      ✅ Anda sudah login dengan JWT
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      User: {jwtUser.name} ({jwtUser.role})
                    </p>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/jwt-dashboard">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka Dashboard JWT
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      🔐 Coba sistem autentikasi JWT manual
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Login dengan JWT untuk mengakses fitur-fitur khusus
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/jwt-auth">
                      <Key className="h-4 w-4 mr-2" />
                      Login dengan JWT
                    </Link>
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Fitur JWT:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Manual JWT token generation & verification</li>
                  <li>Role-based access control (owner/admin/keuangan/pelanggan)</li>
                  <li>Custom bcrypt password hashing</li>
                  <li>No Supabase Auth dependency</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Content */}
          <div className="grid gap-6">
            <StatsCards />
            <RecentBookings />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
