
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Camera, Clock, Star, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const PelangganDashboard = () => {
  const { userProfile } = useJWTAuth();

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer-dashboard', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      const [bookings, studios, packages] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            studios (name, type),
            studio_packages (title, price),
            installments (amount, paid_at, payment_method)
          `)
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase.from('studios').select('*').eq('is_active', true),
        supabase.from('studio_packages').select('*, package_categories (name)')
      ]);

      return {
        bookings: bookings.data || [],
        studios: studios.data || [],
        packages: packages.data || []
      };
    },
    enabled: !!userProfile?.id
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  const { bookings = [], studios = [], packages = [] } = customerData || {};

  // Calculate customer statistics
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate > new Date() && b.status === 'confirmed';
  }).length;

  const totalSpent = bookings.reduce((sum, booking) => {
    const bookingAmount = booking.total_amount || 0;
    const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
    return sum + Math.max(bookingAmount, installmentAmount);
  }, 0);

  // Recent bookings (last 5)
  const recentBookings = bookings.slice(0, 5);

  // Popular packages
  const popularPackages = packages.slice(0, 6);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Selamat Datang, {userProfile?.name}!</h1>
          <p className="text-muted-foreground">
            Kelola booking dan jelajahi paket studio foto kami
          </p>
        </div>
        <Link to="/studio/bookings">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Booking Baru
          </Button>
        </Link>
      </div>

      {/* Customer Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Booking</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {completedBookings} selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Mendatang</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Sudah dikonfirmasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalSpent.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata: Rp {totalBookings > 0 ? Math.round(totalSpent / totalBookings).toLocaleString('id-ID') : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Studio Tersedia</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studios.length}</div>
            <p className="text-xs text-muted-foreground">
              Siap untuk booking
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Booking Terbaru</CardTitle>
              <CardDescription>Riwayat booking Anda yang terbaru</CardDescription>
            </div>
            <Link to="/studio/booking-logs">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{booking.studios?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {booking.studio_packages?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.booking_date), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        Rp {(booking.total_amount || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Belum ada booking</p>
                  <Link to="/studio/bookings">
                    <Button className="mt-2">Buat Booking Pertama</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Packages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Paket Populer</CardTitle>
              <CardDescription>Paket foto yang paling diminati</CardDescription>
            </div>
            <Link to="/studio/packages">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {popularPackages.length > 0 ? (
                popularPackages.map((pkg) => (
                  <div key={pkg.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium">{pkg.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {pkg.package_categories?.name || 'Kategori tidak diketahui'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Durasi: {pkg.duration} menit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        Rp {(pkg.price || 0).toLocaleString('id-ID')}
                      </p>
                      <Link to="/studio/bookings">
                        <Button size="sm" variant="outline" className="mt-1">
                          Booking
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada paket tersedia</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
          <CardDescription>Fitur yang sering digunakan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/studio/bookings" className="block">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span>Booking Baru</span>
              </Button>
            </Link>
            
            <Link to="/studio/booking-logs" className="block">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span>Riwayat Booking</span>
              </Button>
            </Link>
            
            <Link to="/studio/studios" className="block">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Camera className="h-6 w-6" />
                <span>Lihat Studio</span>
              </Button>
            </Link>
            
            <Link to="/studio/packages" className="block">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Star className="h-6 w-6" />
                <span>Paket Foto</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
