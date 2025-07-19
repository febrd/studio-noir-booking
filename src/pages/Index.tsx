
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Users, Calendar, BarChart3 } from 'lucide-react';

const Index = () => {
  const { userProfile, loading } = useJWTAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-elegant">Studio Noir</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <a href="/jwt-auth">Masuk</a>
              </Button>
              <Button asChild>
                <a href="/jwt-auth">Daftar</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-elegant mb-6">
            Professional Photo Studio
            <span className="block text-primary">Management System</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Kelola studio foto Anda dengan mudah. Dari booking hingga laporan keuangan, 
            semua dalam satu platform yang powerful dan user-friendly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/jwt-auth">Mulai Sekarang</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Pelajari Lebih Lanjut</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-elegant mb-4">Fitur Unggulan</h3>
            <p className="text-lg text-muted-foreground">
              Semua yang Anda butuhkan untuk mengelola studio foto profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="glass-elegant">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Manajemen Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Kelola jadwal booking, walk-in sessions, dan avoid double booking dengan sistem yang terintegrasi.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-elegant">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Studio Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Atur studio, paket, kategori, dan layanan tambahan dengan mudah dan fleksibel.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-elegant">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Multi-level access untuk owner, admin, keuangan, dan pelanggan dengan role-based permissions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-elegant">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Laporan & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Dashboard analytics, laporan keuangan, dan insights untuk mengoptimalkan bisnis Anda.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-elegant mb-6">
            Siap Mengoptimalkan Studio Anda?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Bergabunglah dengan studio foto profesional lainnya yang telah mempercayai platform kami.
          </p>
          <Button size="lg" asChild>
            <a href="/jwt-auth">Mulai Gratis Hari Ini</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-elegant">Studio Noir</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Studio Noir. Professional Photo Studio Management System.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
