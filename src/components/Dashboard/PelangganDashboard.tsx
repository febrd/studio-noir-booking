
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Camera, Clock, Star, Plus, Eye, TrendingUp, BarChart3, ChevronRight, Sparkles, Heart, Users } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const PelangganDashboard = () => {
  const { userProfile } = useJWTAuth();

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer-dashboard', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      const sixMonthsAgo = subMonths(new Date(), 5);

      const [bookings, studios, packages, monthlySpending] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            studios (name, type),
            studio_packages (title, price, base_time_minutes),
            installments (amount, paid_at, payment_method)
          `)
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false }),
        
        supabase.from('studios').select('*').eq('is_active', true),
        
        supabase.from('studio_packages').select('*, package_categories (name)'),

        // Get monthly spending data for the last 6 months
        supabase
          .from('bookings')
          .select(`
            created_at,
            total_amount,
            installments (amount)
          `)
          .eq('user_id', userProfile.id)
          .gte('created_at', sixMonthsAgo.toISOString())
          .order('created_at', { ascending: true })
      ]);

      return {
        bookings: bookings.data || [],
        studios: studios.data || [],
        packages: packages.data || [],
        monthlySpending: monthlySpending.data || []
      };
    },
    enabled: !!userProfile?.id
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  const { bookings = [], studios = [], packages = [], monthlySpending = [] } = customerData || {};

  // Calculate customer statistics
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.start_time || b.created_at);
    return bookingDate > new Date() && b.status === 'confirmed';
  }).length;

  const totalSpent = bookings.reduce((sum, booking) => {
    const bookingAmount = booking.total_amount || 0;
    const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
    return sum + Math.max(bookingAmount, installmentAmount);
  }, 0);

  // Monthly spending trend for the last 6 months
  const monthlyTrend = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  }).map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthBookings = monthlySpending.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });

    const monthSpending = monthBookings.reduce((sum, booking) => {
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
      return sum + Math.max(bookingAmount, installmentAmount);
    }, 0);

    return {
      month: format(month, 'MMM yyyy', { locale: id }),
      spending: monthSpending,
      bookings: monthBookings.length
    };
  });

  // Studio preference analysis
  const studioPreference = bookings.reduce((acc, booking) => {
    const studioName = booking.studios?.name || 'Unknown Studio';
    if (!acc[studioName]) {
      acc[studioName] = { count: 0, spending: 0 };
    }
    acc[studioName].count += 1;
    const bookingAmount = booking.total_amount || 0;
    const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
    acc[studioName].spending += Math.max(bookingAmount, installmentAmount);
    return acc;
  }, {} as Record<string, { count: number; spending: number }>);

  const studioPreferenceData = Object.entries(studioPreference).map(([name, data]) => ({
    name,
    value: data.count,
    spending: data.spending
  }));

  // Package preference analysis
  const packagePreference = bookings.reduce((acc, booking) => {
    const packageTitle = booking.studio_packages?.title || 'Unknown Package';
    if (!acc[packageTitle]) {
      acc[packageTitle] = { count: 0, spending: 0 };
    }
    acc[packageTitle].count += 1;
    const bookingAmount = booking.total_amount || 0;
    const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
    acc[packageTitle].spending += Math.max(bookingAmount, installmentAmount);
    return acc;
  }, {} as Record<string, { count: number; spending: number }>);

  const packagePreferenceData = Object.entries(packagePreference)
    .map(([name, data]) => ({
      name,
      count: data.count,
      spending: data.spending
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 packages

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-fade-in">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-6 py-20 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl text-center">
            <div className="mb-6 flex justify-center">
              <Sparkles className="h-16 w-16 text-white animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 animate-scale-in">
              Abadikan Momenmu di Studio Favorit!
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Self Photo atau Sesi Profesional, semua bisa kamu pilih di sini.
            </p>
            <Link to="/customer/booking-selection">
              <Button size="lg" className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 animate-bounce">
                <Camera className="mr-2 h-6 w-6" />
                RESERVASI SEKARANG
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Selamat Datang, {userProfile?.name}! 👋</h2>
          <p className="text-muted-foreground text-lg">
            Mari wujudkan foto impian Anda bersama kami
          </p>
        </div>

        {/* Customer Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Booking</CardTitle>
              <Calendar className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {completedBookings} selesai
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Booking Mendatang</CardTitle>
              <Clock className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{upcomingBookings}</div>
              <p className="text-xs text-muted-foreground">
                Sudah dikonfirmasi
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">Rp {totalSpent.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground">
                Rata-rata: Rp {totalBookings > 0 ? Math.round(totalSpent / totalBookings).toLocaleString('id-ID') : 0}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Studio Tersedia</CardTitle>
              <Camera className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{studios.length}</div>
              <p className="text-xs text-muted-foreground">
                Siap untuk booking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              Aksi Cepat
            </CardTitle>
            <CardDescription>Fitur yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/customer/booking-selection" className="block">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-3 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover-scale">
                  <Plus className="h-8 w-8 text-blue-500" />
                  <span className="font-medium">Booking Baru</span>
                </Button>
              </Link>
              
              <Link to="/studio/booking-logs" className="block">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-3 hover:bg-green-50 hover:border-green-300 transition-all duration-300 hover-scale">
                  <Calendar className="h-8 w-8 text-green-500" />
                  <span className="font-medium">Riwayat Booking</span>
                </Button>
              </Link>
              
              <Link to="/studio/studios" className="block">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-3 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 hover-scale">
                  <Camera className="h-8 w-8 text-purple-500" />
                  <span className="font-medium">Lihat Studio</span>
                </Button>
              </Link>
              
              <Link to="/studio/packages" className="block">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-3 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 hover-scale">
                  <Star className="h-8 w-8 text-orange-500" />
                  <span className="font-medium">Paket Foto</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        {totalBookings > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Spending Trend - Area Chart */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Tren Pengeluaran Bulanan
                </CardTitle>
                <CardDescription>Perkembangan pengeluaran 6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    spending: { label: "Pengeluaran", color: "hsl(var(--chart-1))" }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <defs>
                        <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pengeluaran']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="hsl(var(--chart-1))" 
                        fillOpacity={1} 
                        fill="url(#colorSpending)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Studio Preference - Pie Chart */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-purple-500" />
                  Preferensi Studio
                </CardTitle>
                <CardDescription>Studio yang paling sering Anda gunakan</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Bookings" }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studioPreferenceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {studioPreferenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity and Popular Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Booking Terbaru
                </CardTitle>
                <CardDescription>Riwayat booking Anda yang terbaru</CardDescription>
              </div>
              <Link to="/studio/booking-logs">
                <Button variant="outline" size="sm" className="hover-scale">
                  <Eye className="h-4 w-4 mr-2" />
                  Lihat Semua
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium">{booking.studios?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.studio_packages?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.start_time || booking.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
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
                    <Link to="/customer/booking-selection">
                      <Button className="mt-2 hover-scale">Buat Booking Pertama</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Popular Packages */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Paket Populer
                </CardTitle>
                <CardDescription>Paket foto yang paling diminati</CardDescription>
              </div>
              <Link to="/studio/packages">
                <Button variant="outline" size="sm" className="hover-scale">
                  <Eye className="h-4 w-4 mr-2" />
                  Lihat Semua
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {popularPackages.length > 0 ? (
                  popularPackages.map((pkg) => (
                    <div key={pkg.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors hover-scale">
                      <div className="flex-1">
                        <h4 className="font-medium">{pkg.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pkg.package_categories?.name || 'Kategori tidak diketahui'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Durasi: {pkg.base_time_minutes} menit
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          Rp {(pkg.price || 0).toLocaleString('id-ID')}
                        </p>
                        <Link to="/customer/booking-selection">
                          <Button size="sm" variant="outline" className="mt-1 hover-scale">
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
      </div>
    </div>
  );
};
