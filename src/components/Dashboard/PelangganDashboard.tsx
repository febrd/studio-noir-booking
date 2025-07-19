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

const COLORS = ['#dc2626', '#2563eb', '#eab308', '#000000'];

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
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
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
      case 'confirmed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'completed': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
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
      {/* Clean Hero Section */}
      <div className="bg-white py-32 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-8xl font-peace-sans font-black text-black mb-8 tracking-tight leading-none">
            Dashboard
          </h1>
          <p className="text-2xl font-inter font-light text-gray-600 mb-16 max-w-2xl mx-auto leading-relaxed">
            Halo, {userProfile?.name}. Kelola semua aktivitas foto Anda dengan mudah.
          </p>
          <Link to="/customer/booking-selection">
            <Button className="bg-black text-white hover:bg-gray-800 text-lg px-12 py-6 font-peace-sans font-bold tracking-wide rounded-none">
              Reservasi Sekarang
              <ChevronRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-32">
        {/* Statistics - Clean Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">
          <div className="text-center">
            <div className="text-7xl font-peace-sans font-black text-black mb-6">{totalBookings}</div>
            <h3 className="text-xl font-peace-sans font-bold text-gray-900 mb-2">Total Booking</h3>
            <p className="text-gray-600 font-inter">{completedBookings} selesai</p>
          </div>

          <div className="text-center">
            <div className="text-7xl font-peace-sans font-black text-red-600 mb-6">{upcomingBookings}</div>
            <h3 className="text-xl font-peace-sans font-bold text-gray-900 mb-2">Mendatang</h3>
            <p className="text-gray-600 font-inter">Sudah dikonfirmasi</p>
          </div>

          <div className="text-center">
            <div className="text-4xl font-peace-sans font-black text-blue-600 mb-6">
              Rp {totalSpent.toLocaleString('id-ID')}
            </div>
            <h3 className="text-xl font-peace-sans font-bold text-gray-900 mb-2">Total Pengeluaran</h3>
            <p className="text-gray-600 font-inter">
              Rata-rata: Rp {totalBookings > 0 ? Math.round(totalSpent / totalBookings).toLocaleString('id-ID') : 0}
            </p>
          </div>

          <div className="text-center">
            <div className="text-7xl font-peace-sans font-black text-yellow-600 mb-6">{studios.length}</div>
            <h3 className="text-xl font-peace-sans font-bold text-gray-900 mb-2">Studio Tersedia</h3>
            <p className="text-gray-600 font-inter">Siap untuk booking</p>
          </div>
        </div>

        {/* Quick Actions - Minimal Grid */}
        <div className="mb-32">
          <h2 className="text-5xl font-peace-sans font-black text-center mb-20 tracking-tight">
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Link to="/customer/booking-selection" className="group block text-center">
              <div className="bg-white border border-gray-200 hover:border-red-300 p-12 transition-all duration-300 group-hover:shadow-lg">
                <Plus className="h-12 w-12 mb-6 mx-auto text-red-600" />
                <span className="font-peace-sans font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors">
                  Booking Baru
                </span>
              </div>
            </Link>
            
            <Link to="/studio/booking-logs" className="group block text-center">
              <div className="bg-white border border-gray-200 hover:border-blue-300 p-12 transition-all duration-300 group-hover:shadow-lg">
                <Calendar className="h-12 w-12 mb-6 mx-auto text-blue-600" />
                <span className="font-peace-sans font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                  Riwayat
                </span>
              </div>
            </Link>
            
            <Link to="/studio/studios" className="group block text-center">
              <div className="bg-white border border-gray-200 hover:border-yellow-400 p-12 transition-all duration-300 group-hover:shadow-lg">
                <Camera className="h-12 w-12 mb-6 mx-auto text-yellow-600" />
                <span className="font-peace-sans font-bold text-lg text-gray-900 group-hover:text-yellow-600 transition-colors">
                  Studio
                </span>
              </div>
            </Link>
            
            <Link to="/studio/packages" className="group block text-center">
              <div className="bg-white border border-gray-200 hover:border-black p-12 transition-all duration-300 group-hover:shadow-lg">
                <Star className="h-12 w-12 mb-6 mx-auto text-black" />
                <span className="font-peace-sans font-bold text-lg text-gray-900 group-hover:text-black transition-colors">
                  Paket
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Analytics Charts */}
        {totalBookings > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
            {/* Monthly Spending Trend */}
            <div className="bg-white border border-gray-200 p-12">
              <h3 className="text-3xl font-peace-sans font-black mb-2">Tren Pengeluaran</h3>
              <p className="text-gray-600 font-inter mb-12">6 bulan terakhir</p>
              <ChartContainer
                config={{
                  spending: { label: "Pengeluaran", color: "#dc2626" }
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" stroke="#6b7280" className="font-inter text-sm" />
                    <YAxis stroke="#6b7280" className="font-inter text-sm" />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pengeluaran']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="spending" 
                      stroke="#dc2626" 
                      fill="#dc2626" 
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Studio Preference */}
            <div className="bg-white border border-gray-200 p-12">
              <h3 className="text-3xl font-peace-sans font-black mb-2">Studio Favorit</h3>
              <p className="text-gray-600 font-inter mb-12">Preferensi studio Anda</p>
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
                      fill="#2563eb"
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
            </div>
          </div>
        )}

        {/* Recent Activity and Popular Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Recent Bookings */}
          <div className="bg-white border border-gray-200 p-12">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-3xl font-peace-sans font-black mb-2">Booking Terbaru</h3>
                <p className="text-gray-600 font-inter">Aktivitas terkini</p>
              </div>
              <Link to="/studio/booking-logs">
                <Button variant="outline" size="sm" className="font-peace-sans font-bold border-black text-black hover:bg-black hover:text-white">
                  Lihat Semua
                </Button>
              </Link>
            </div>
            <div className="space-y-8">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="border-l-4 border-gray-200 pl-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-peace-sans font-bold text-xl mb-1">{booking.studios?.name}</h4>
                        <p className="text-gray-600 font-inter mb-2">
                          {booking.studio_packages?.title}
                        </p>
                        <p className="text-sm text-gray-500 font-inter">
                          {format(new Date(booking.start_time || booking.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(booking.status) + ' font-peace-sans font-bold mb-2'}>
                          {getStatusText(booking.status)}
                        </Badge>
                        <p className="text-lg font-peace-sans font-black">
                          Rp {(booking.total_amount || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <Camera className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                  <p className="text-gray-500 font-inter mb-8">Belum ada booking</p>
                  <Link to="/customer/booking-selection">
                    <Button className="bg-black text-white font-peace-sans font-bold hover:bg-gray-800">
                      Buat Booking Pertama
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Popular Packages */}
          <div className="bg-white border border-gray-200 p-12">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-3xl font-peace-sans font-black mb-2">Paket Populer</h3>
                <p className="text-gray-600 font-inter">Paket foto terfavorit</p>
              </div>
              <Link to="/studio/packages">
                <Button variant="outline" size="sm" className="font-peace-sans font-bold border-black text-black hover:bg-black hover:text-white">
                  Lihat Semua
                </Button>
              </Link>
            </div>
            <div className="space-y-6">
              {popularPackages.length > 0 ? (
                popularPackages.map((pkg) => (
                  <div key={pkg.id} className="border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-peace-sans font-bold text-xl mb-1">{pkg.title}</h4>
                        <p className="text-gray-600 font-inter mb-1">
                          {pkg.package_categories?.name || 'Kategori tidak diketahui'}
                        </p>
                        <p className="text-sm text-gray-500 font-inter">
                          Durasi: {pkg.base_time_minutes} menit
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-peace-sans font-black text-black mb-3">
                          Rp {(pkg.price || 0).toLocaleString('id-ID')}
                        </p>
                        <Link to="/customer/booking-selection">
                          <Button size="sm" className="bg-black text-white font-peace-sans font-bold hover:bg-gray-800">
                            Booking
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                  <p className="text-gray-500 font-inter">Tidak ada paket tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
