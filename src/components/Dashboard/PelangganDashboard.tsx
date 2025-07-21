
import React from 'react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Package, Clock, MapPin, Camera } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PelangganDashboard = () => {
  const { userProfile } = useJWTAuth();

  // Fetch user's bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['user-bookings', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          total_amount,
          type,
          created_at,
          studio_packages!inner(title, description),
          studios!inner(name, type)
        `)
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.id
  });

  // Calculate spending data for chart
  const spendingData = React.useMemo(() => {
    if (!bookings.length) return [];

    const monthlySpending = bookings.reduce((acc, booking) => {
      if (booking.status === 'paid' || booking.status === 'confirmed') {
        const month = format(new Date(booking.created_at), 'MMM yyyy', { locale: id });
        acc[month] = (acc[month] || 0) + booking.total_amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlySpending)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6); // Last 6 months
  }, [bookings]);

  const stats = React.useMemo(() => {
    const totalBookings = bookings.length;
    const totalSpending = bookings
      .filter(b => b.status === 'paid' || b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_amount, 0);
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    
    return { totalBookings, totalSpending, pendingBookings };
  }, [bookings]);

  const recentBookings = bookings.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-6">
        <h1 className="text-2xl md:text-3xl font-peace-sans font-black text-gray-900 mb-2">
          Selamat Datang, {userProfile?.name}! 👋
        </h1>
        <p className="text-gray-600 font-inter">
          Kelola booking Anda dan temukan paket foto terbaik di Studio Noir.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-inter text-gray-600">Total Booking</p>
                <p className="text-2xl font-peace-sans font-black text-gray-900">{stats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-inter text-gray-600">Total Pengeluaran</p>
                <p className="text-xl md:text-2xl font-peace-sans font-black text-gray-900">
                  {stats.totalSpending.toLocaleString('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR', 
                    minimumFractionDigits: 0 
                  })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-inter text-gray-600">Booking Pending</p>
                <p className="text-2xl font-peace-sans font-black text-gray-900">{stats.pendingBookings}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Chart - Mobile Responsive */}
      {spendingData.length > 0 && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-peace-sans font-black text-gray-900">
              Grafik Pengeluaran (6 Bulan Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="w-full">
              <ResponsiveContainer width="100%" height={250} className="!w-full !h-[250px]">
                <LineChart
                  data={spendingData}
                  margin={{
                    top: 5,
                    right: 5,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666"
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    width={60}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      value.toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      }),
                      'Pengeluaran'
                    ]}
                    labelStyle={{ fontSize: '12px' }}
                    contentStyle={{ fontSize: '12px', maxWidth: '200px' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                    name="Pengeluaran"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="font-peace-sans font-black text-gray-900">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/customer/booking-selection">
              <Button className="w-full bg-black text-white hover:bg-gray-800 font-peace-sans font-bold py-6">
                <Camera className="w-5 h-5 mr-2" />
                Booking Baru
              </Button>
            </Link>
            <Link to="/customer/order-history">
              <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 font-peace-sans font-bold py-6">
                <CalendarDays className="w-5 h-5 mr-2" />
                Riwayat Pesanan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="font-peace-sans font-black text-gray-900">
                Booking Terbaru
              </CardTitle>
              <Link to="/customer/order-history">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-inter">
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-peace-sans font-bold text-gray-900 truncate">
                      {booking.studio_packages?.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{booking.studios?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        <span>{format(new Date(booking.start_time), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <Badge 
                      variant={booking.status === 'confirmed' || booking.status === 'paid' ? 'default' : 
                               booking.status === 'pending' ? 'secondary' : 'destructive'}
                      className="whitespace-nowrap"
                    >
                      {booking.status === 'confirmed' || booking.status === 'paid' ? 'Selesai' :
                       booking.status === 'pending' ? 'Menunggu' : 'Dibatalkan'}
                    </Badge>
                    <p className="text-sm font-peace-sans font-bold text-gray-900 whitespace-nowrap">
                      {booking.total_amount.toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {bookings.length === 0 && (
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-8 text-center">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-peace-sans font-black text-gray-900 mb-2">
              Belum Ada Booking
            </h3>
            <p className="text-gray-500 font-inter mb-6">
              Mulai booking session foto pertama Anda di Studio Noir!
            </p>
            <Link to="/customer/booking-selection">
              <Button className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold">
                <Camera className="w-5 h-5 mr-2" />
                Booking Sekarang
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PelangganDashboard;
