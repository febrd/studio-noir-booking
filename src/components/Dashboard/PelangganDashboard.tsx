
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

const COLORS = ['#d30f0f', '#0060ad', '#FFD700', '#000000'];

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
    <div className="min-h-screen bg-white font-inter">
      {/* Minimalist Hero Section */}
      <div className="relative bg-white border-b-8 border-black">
        {/* Geometric shapes */}
        <div className="absolute top-8 left-8 w-16 h-16 bg-red-500"></div>
        <div className="absolute top-8 right-8 w-12 h-12 bg-blue-600 rounded-full"></div>
        <div className="absolute bottom-8 right-24 w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-yellow-400"></div>
        
        <div className="relative px-8 py-24 z-10 max-w-6xl mx-auto">
          <h1 className="text-8xl font-peace-sans font-black text-black mb-4 tracking-tight">
            STUDIO
          </h1>
          <h2 className="text-3xl font-peace-sans font-bold mb-8 text-black">
            DASHBOARD
          </h2>
          <p className="text-xl mb-12 max-w-xl font-inter text-gray-700">
            Halo, {userProfile?.name}! Kelola semua aktivitas foto Anda di sini.
          </p>
          <Link to="/customer/booking-selection">
            <Button className="bg-red-500 hover:bg-red-600 text-white text-lg px-12 py-4 font-peace-sans font-bold tracking-wide border-4 border-black">
              RESERVASI SEKARANG
              <ChevronRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-16 p-8 max-w-6xl mx-auto">
        {/* Statistics Grid - Clean Minimalist Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          <Card className="border-4 border-black bg-white">
            <CardHeader className="bg-red-500 text-white">
              <CardTitle className="text-sm font-peace-sans font-black tracking-wide">TOTAL BOOKING</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-6xl font-peace-sans font-black text-black mb-2">{totalBookings}</div>
              <p className="text-sm font-inter text-gray-600">
                {completedBookings} selesai
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-white">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="text-sm font-peace-sans font-black tracking-wide">MENDATANG</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-6xl font-peace-sans font-black text-black mb-2">{upcomingBookings}</div>
              <p className="text-sm font-inter text-gray-600">
                Sudah dikonfirmasi
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-white">
            <CardHeader className="bg-yellow-400 text-black">
              <CardTitle className="text-sm font-peace-sans font-black tracking-wide">PENGELUARAN</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-3xl font-peace-sans font-black text-black mb-2">Rp {totalSpent.toLocaleString('id-ID')}</div>
              <p className="text-sm font-inter text-gray-600">
                Rata-rata: Rp {totalBookings > 0 ? Math.round(totalSpent / totalBookings).toLocaleString('id-ID') : 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-white">
            <CardHeader className="bg-black text-white">
              <CardTitle className="text-sm font-peace-sans font-black tracking-wide">STUDIO</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-6xl font-peace-sans font-black text-black mb-2">{studios.length}</div>
              <p className="text-sm font-inter text-gray-600">
                Siap untuk booking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Geometric Grid */}
        <div className="bg-gray-50 p-12 border-4 border-black">
          <h3 className="text-4xl font-peace-sans font-black mb-12 tracking-wide text-center">AKSI CEPAT</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link to="/customer/booking-selection" className="block">
              <div className="bg-red-500 text-white p-10 border-4 border-black hover:bg-red-600 transition-colors text-center">
                <Plus className="h-16 w-16 mb-4 mx-auto" />
                <span className="font-peace-sans font-black text-lg tracking-wide">BOOKING BARU</span>
              </div>
            </Link>
            
            <Link to="/studio/booking-logs" className="block">
              <div className="bg-blue-600 text-white p-10 border-4 border-black hover:bg-blue-700 transition-colors text-center">
                <Calendar className="h-16 w-16 mb-4 mx-auto" />
                <span className="font-peace-sans font-black text-lg tracking-wide">RIWAYAT</span>
              </div>
            </Link>
            
            <Link to="/studio/studios" className="block">
              <div className="bg-yellow-400 text-black p-10 border-4 border-black hover:bg-yellow-500 transition-colors text-center">
                <Camera className="h-16 w-16 mb-4 mx-auto" />
                <span className="font-peace-sans font-black text-lg tracking-wide">STUDIO</span>
              </div>
            </Link>
            
            <Link to="/studio/packages" className="block">
              <div className="bg-black text-white p-10 border-4 border-black hover:bg-gray-800 transition-colors text-center">
                <Star className="h-16 w-16 mb-4 mx-auto" />
                <span className="font-peace-sans font-black text-lg tracking-wide">PAKET</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Analytics Charts */}
        {totalBookings > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Monthly Spending Trend */}
            <Card className="border-4 border-black bg-white">
              <CardHeader className="bg-black text-white">
                <CardTitle className="font-peace-sans font-black tracking-wide">TREN PENGELUARAN</CardTitle>
                <CardDescription className="text-gray-300 font-inter">6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <ChartContainer
                  config={{
                    spending: { label: "Pengeluaran", color: "#d30f0f" }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                      <XAxis dataKey="month" stroke="#000" className="font-inter" />
                      <YAxis stroke="#000" className="font-inter" />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pengeluaran']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="#d30f0f" 
                        fill="#d30f0f" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Studio Preference */}
            <Card className="border-4 border-black bg-white">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="font-peace-sans font-black tracking-wide">PREFERENSI STUDIO</CardTitle>
                <CardDescription className="text-blue-100 font-inter">Studio favorit Anda</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
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
                        fill="#0060ad"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Recent Bookings */}
          <Card className="border-4 border-black bg-white">
            <CardHeader className="bg-red-500 text-white flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-peace-sans font-black tracking-wide">BOOKING TERBARU</CardTitle>
                <CardDescription className="text-red-100 font-inter">Aktivitas terkini</CardDescription>
              </div>
              <Link to="/studio/booking-logs">
                <Button variant="outline" size="sm" className="border-2 border-white text-white hover:bg-white hover:text-red-500 font-peace-sans font-bold">
                  LIHAT SEMUA
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <div key={booking.id} className="border-2 border-gray-300 p-6 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-peace-sans font-black text-xl">{booking.studios?.name}</h4>
                          <p className="text-sm font-inter text-gray-600">
                            {booking.studio_packages?.title}
                          </p>
                          <p className="text-xs font-inter text-gray-500 mt-1">
                            {format(new Date(booking.start_time || booking.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(booking.status) + ' font-peace-sans font-bold'}>
                            {getStatusText(booking.status)}
                          </Badge>
                          <p className="text-lg font-peace-sans font-black mt-1">
                            Rp {(booking.total_amount || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-gray-300">
                    <Camera className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                    <p className="text-gray-500 font-inter mb-6">Belum ada booking</p>
                    <Link to="/customer/booking-selection">
                      <Button className="bg-black text-white font-peace-sans font-bold border-2 border-black hover:bg-white hover:text-black">
                        BUAT BOOKING PERTAMA
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Popular Packages */}
          <Card className="border-4 border-black bg-white">
            <CardHeader className="bg-yellow-400 text-black flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-peace-sans font-black tracking-wide">PAKET POPULER</CardTitle>
                <CardDescription className="text-gray-700 font-inter">Paket foto terfavorit</CardDescription>
              </div>
              <Link to="/studio/packages">
                <Button variant="outline" size="sm" className="border-2 border-black text-black hover:bg-black hover:text-white font-peace-sans font-bold">
                  LIHAT SEMUA
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                {popularPackages.length > 0 ? (
                  popularPackages.map((pkg) => (
                    <div key={pkg.id} className="border-2 border-gray-300 p-6 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-peace-sans font-black text-xl">{pkg.title}</h4>
                          <p className="text-sm font-inter text-gray-600">
                            {pkg.package_categories?.name || 'Kategori tidak diketahui'}
                          </p>
                          <p className="text-xs font-inter text-gray-500">
                            Durasi: {pkg.base_time_minutes} menit
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-peace-sans font-black text-black">
                            Rp {(pkg.price || 0).toLocaleString('id-ID')}
                          </p>
                          <Link to="/customer/booking-selection">
                            <Button size="sm" className="mt-2 bg-black text-white font-peace-sans font-bold border-2 border-black hover:bg-white hover:text-black">
                              BOOKING
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-gray-300">
                    <Star className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                    <p className="text-gray-500 font-inter">Tidak ada paket tersedia</p>
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
