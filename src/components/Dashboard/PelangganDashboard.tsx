
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Camera, Clock, Star, Plus, Eye, TrendingUp, BarChart3, ChevronRight, Users, Heart } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const BAUHAUS_COLORS = ['#FF0000', '#0066CC', '#FFD700', '#000000'];

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
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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

  // Recent bookings (last 5)
  const recentBookings = bookings.slice(0, 5);

  // Popular packages
  const popularPackages = packages.slice(0, 6);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
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
    <div className="min-h-screen bg-white">
      {/* Bauhaus Hero Section */}
      <div className="relative bg-black text-white">
        <div className="absolute top-0 left-0 w-32 h-32 bg-red-500"></div>
        <div className="absolute top-8 right-8 w-24 h-24 bg-blue-600 rotate-45"></div>
        <div className="absolute bottom-0 right-0 w-40 h-20 bg-yellow-400"></div>
        
        <div className="relative px-6 py-20 sm:py-24 lg:py-32 z-10">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="text-6xl sm:text-8xl font-black mb-6 tracking-tight">
              STUDIO
            </h1>
            <h2 className="text-2xl sm:text-3xl font-light mb-8 tracking-widest">
              DASHBOARD
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto font-light">
              Selamat datang, {userProfile?.name}
            </p>
            <Link to="/customer/booking-selection">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-12 py-4 font-bold tracking-wide">
                RESERVASI
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-12 p-6 max-w-7xl mx-auto">
        {/* Statistics Grid - Bauhaus Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <Card className="border-4 border-black shadow-none bg-white">
            <CardHeader className="bg-red-500 text-white">
              <CardTitle className="text-sm font-black tracking-wide">TOTAL BOOKING</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-5xl font-black text-black mb-2">{totalBookings}</div>
              <p className="text-sm text-gray-600 font-medium">
                {completedBookings} selesai
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-none bg-white">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="text-sm font-black tracking-wide">MENDATANG</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-5xl font-black text-black mb-2">{upcomingBookings}</div>
              <p className="text-sm text-gray-600 font-medium">
                Sudah dikonfirmasi
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-none bg-white">
            <CardHeader className="bg-yellow-400 text-black">
              <CardTitle className="text-sm font-black tracking-wide">PENGELUARAN</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-black text-black mb-2">Rp {totalSpent.toLocaleString('id-ID')}</div>
              <p className="text-sm text-gray-600 font-medium">
                Rata-rata: Rp {totalBookings > 0 ? Math.round(totalSpent / totalBookings).toLocaleString('id-ID') : 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black shadow-none bg-white">
            <CardHeader className="bg-black text-white">
              <CardTitle className="text-sm font-black tracking-wide">STUDIO</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-5xl font-black text-black mb-2">{studios.length}</div>
              <p className="text-sm text-gray-600 font-medium">
                Siap untuk booking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Bauhaus Grid */}
        <div className="bg-gray-100 p-8 border-4 border-black">
          <h3 className="text-3xl font-black mb-8 tracking-wide">AKSI CEPAT</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/customer/booking-selection" className="block">
              <div className="bg-red-500 text-white p-8 border-4 border-black hover:bg-red-600 transition-colors">
                <Plus className="h-12 w-12 mb-4" />
                <span className="font-black text-lg tracking-wide">BOOKING BARU</span>
              </div>
            </Link>
            
            <Link to="/studio/booking-logs" className="block">
              <div className="bg-blue-600 text-white p-8 border-4 border-black hover:bg-blue-700 transition-colors">
                <Calendar className="h-12 w-12 mb-4" />
                <span className="font-black text-lg tracking-wide">RIWAYAT</span>
              </div>
            </Link>
            
            <Link to="/studio/studios" className="block">
              <div className="bg-yellow-400 text-black p-8 border-4 border-black hover:bg-yellow-500 transition-colors">
                <Camera className="h-12 w-12 mb-4" />
                <span className="font-black text-lg tracking-wide">STUDIO</span>
              </div>
            </Link>
            
            <Link to="/studio/packages" className="block">
              <div className="bg-black text-white p-8 border-4 border-black hover:bg-gray-800 transition-colors">
                <Star className="h-12 w-12 mb-4" />
                <span className="font-black text-lg tracking-wide">PAKET</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Analytics Charts */}
        {totalBookings > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Spending Trend */}
            <Card className="border-4 border-black shadow-none bg-white">
              <CardHeader className="bg-black text-white">
                <CardTitle className="font-black tracking-wide">TREN PENGELUARAN</CardTitle>
                <CardDescription className="text-gray-300">6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer
                  config={{
                    spending: { label: "Pengeluaran", color: "#FF0000" }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                      <XAxis dataKey="month" stroke="#000" />
                      <YAxis stroke="#000" />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pengeluaran']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="#FF0000" 
                        fill="#FF0000" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Studio Preference */}
            <Card className="border-4 border-black shadow-none bg-white">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="font-black tracking-wide">PREFERENSI STUDIO</CardTitle>
                <CardDescription className="text-blue-100">Studio favorit Anda</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
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
                        fill="#0066CC"
                        dataKey="value"
                      >
                        {studioPreferenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAUHAUS_COLORS[index % BAUHAUS_COLORS.length]} />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <Card className="border-4 border-black shadow-none bg-white">
            <CardHeader className="bg-red-500 text-white flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-black tracking-wide">BOOKING TERBARU</CardTitle>
                <CardDescription className="text-red-100">Aktivitas terkini</CardDescription>
              </div>
              <Link to="/studio/booking-logs">
                <Button variant="outline" size="sm" className="border-2 border-white text-white hover:bg-white hover:text-red-500 font-bold">
                  LIHAT SEMUA
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <div key={booking.id} className="border-2 border-gray-300 p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-black text-lg">{booking.studios?.name}</h4>
                          <p className="text-sm font-medium text-gray-600">
                            {booking.studio_packages?.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(booking.start_time || booking.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(booking.status) + ' font-bold'}>
                            {getStatusText(booking.status)}
                          </Badge>
                          <p className="text-lg font-black mt-1">
                            Rp {(booking.total_amount || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300">
                    <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-4">Belum ada booking</p>
                    <Link to="/customer/booking-selection">
                      <Button className="bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black">
                        BUAT BOOKING PERTAMA
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Popular Packages */}
          <Card className="border-4 border-black shadow-none bg-white">
            <CardHeader className="bg-yellow-400 text-black flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-black tracking-wide">PAKET POPULER</CardTitle>
                <CardDescription className="text-gray-700">Paket foto terfavorit</CardDescription>
              </div>
              <Link to="/studio/packages">
                <Button variant="outline" size="sm" className="border-2 border-black text-black hover:bg-black hover:text-white font-bold">
                  LIHAT SEMUA
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {popularPackages.length > 0 ? (
                  popularPackages.map((pkg) => (
                    <div key={pkg.id} className="border-2 border-gray-300 p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-black text-lg">{pkg.title}</h4>
                          <p className="text-sm font-medium text-gray-600">
                            {pkg.package_categories?.name || 'Kategori tidak diketahui'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Durasi: {pkg.base_time_minutes} menit
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-black">
                            Rp {(pkg.price || 0).toLocaleString('id-ID')}
                          </p>
                          <Link to="/customer/booking-selection">
                            <Button size="sm" className="mt-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black">
                              BOOKING
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300">
                    <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Tidak ada paket tersedia</p>
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
