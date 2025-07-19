
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, ArrowRight } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
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
      month: format(month, 'MMM', { locale: id }),
      spending: monthSpending,
      bookings: monthBookings.length
    };
  });

  // Recent bookings (last 3)
  const recentBookings = bookings.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-600 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'completed': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
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
      {/* Hero Section - Ultra Clean */}
      <div className="bg-white py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-7xl font-peace-sans font-black text-black mb-6 tracking-tight leading-tight">
            Dashboard
          </h1>
          <p className="text-xl font-inter text-gray-500 mb-12 max-w-xl mx-auto leading-relaxed">
            Selamat datang kembali, {userProfile?.name}
          </p>
          <Link to="/customer/booking-selection">
            <Button className="bg-black text-white hover:bg-gray-800 text-base px-8 py-3 font-peace-sans font-bold rounded-sm">
              Buat Reservasi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-24">
        {/* Stats - Clean Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="text-center">
            <div className="text-5xl font-peace-sans font-black text-black mb-3">{totalBookings}</div>
            <h3 className="text-sm font-inter font-medium text-gray-600 uppercase tracking-wide">Total Booking</h3>
          </div>

          <div className="text-center">
            <div className="text-5xl font-peace-sans font-black text-red-500 mb-3">{upcomingBookings}</div>
            <h3 className="text-sm font-inter font-medium text-gray-600 uppercase tracking-wide">Mendatang</h3>
          </div>

          <div className="text-center">
            <div className="text-3xl font-peace-sans font-black text-blue-500 mb-3">
              {totalSpent.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
            </div>
            <h3 className="text-sm font-inter font-medium text-gray-600 uppercase tracking-wide">Total Pengeluaran</h3>
          </div>

          <div className="text-center">
            <div className="text-5xl font-peace-sans font-black text-yellow-500 mb-3">{completedBookings}</div>
            <h3 className="text-sm font-inter font-medium text-gray-600 uppercase tracking-wide">Selesai</h3>
          </div>
        </div>

        {/* Quick Actions - Minimal */}
        <div className="mb-20">
          <h2 className="text-4xl font-peace-sans font-black text-center mb-12 tracking-tight">
            Aksi Cepat
          </h2>
          <div className="flex justify-center gap-8">
            <Link to="/customer/booking-selection" className="group block text-center">
              <div className="bg-white border border-gray-100 hover:border-gray-200 p-8 transition-all duration-200 hover:shadow-sm">
                <Plus className="h-8 w-8 mb-4 mx-auto text-red-500" />
                <span className="font-peace-sans font-bold text-base text-gray-900 group-hover:text-red-500 transition-colors">
                  Booking Baru
                </span>
              </div>
            </Link>
            
            <Link to="/customer/order-history" className="group block text-center">
              <div className="bg-white border border-gray-100 hover:border-gray-200 p-8 transition-all duration-200 hover:shadow-sm">
                <Clock className="h-8 w-8 mb-4 mx-auto text-blue-500" />
                <span className="font-peace-sans font-bold text-base text-gray-900 group-hover:text-blue-500 transition-colors">
                  Riwayat Pesanan
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Chart and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Spending Chart */}
          {totalBookings > 0 && (
            <div className="bg-white border border-gray-100 p-8">
              <h3 className="text-2xl font-peace-sans font-black mb-2">Pengeluaran Bulanan</h3>
              <p className="text-gray-500 font-inter mb-8 text-sm">6 bulan terakhir</p>
              <ChartContainer
                config={{
                  spending: { label: "Pengeluaran", color: "#dc2626" }
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis dataKey="month" stroke="#9ca3af" className="font-inter text-xs" />
                    <YAxis stroke="#9ca3af" className="font-inter text-xs" />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pengeluaran']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="spending" 
                      stroke="#dc2626" 
                      fill="#dc2626" 
                      fillOpacity={0.05}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}

          {/* Recent Bookings */}
          <div className="bg-white border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-peace-sans font-black mb-2">Aktivitas Terbaru</h3>
                <p className="text-gray-500 font-inter text-sm">Booking terkini Anda</p>
              </div>
              <Link to="/customer/order-history">
                <Button variant="outline" size="sm" className="font-peace-sans font-bold border-gray-200 text-gray-600 hover:bg-gray-50">
                  Lihat Semua
                </Button>
              </Link>
            </div>
            <div className="space-y-6">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="pb-6 border-b border-gray-50 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-peace-sans font-bold text-lg mb-1">{booking.studios?.name}</h4>
                        <p className="text-gray-500 font-inter mb-2 text-sm">
                          {booking.studio_packages?.title}
                        </p>
                        <p className="text-xs text-gray-400 font-inter">
                          {format(new Date(booking.start_time || booking.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(booking.status) + ' font-peace-sans font-bold mb-2 text-xs border'}>
                          {getStatusText(booking.status)}
                        </Badge>
                        <p className="text-sm font-peace-sans font-bold">
                          {(booking.total_amount || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-inter mb-6">Belum ada booking</p>
                  <Link to="/customer/booking-selection">
                    <Button className="bg-black text-white font-peace-sans font-bold hover:bg-gray-800 text-sm px-6 py-2">
                      Buat Booking Pertama
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
