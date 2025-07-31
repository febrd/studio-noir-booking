import React, { useState } from 'react';
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
import DynamicPaymentButton from '@/components/DynamicPaymentButton';
import { formatDateTimeWITA } from '@/utils/timezoneUtils';

const PelangganDashboard = () => {
  const { userProfile } = useJWTAuth();

  // You can customize this QRIS image URL
  const qrisImageUrl = "https://i.imgur.com/6U2GMax.jpeg";

  // Fetch user's bookings
  const { data: bookings = [], isLoading, refetch: refetchBookings } = useQuery({
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
          payment_method,
          created_at,
          studio_packages!inner(title, description),
          studios!inner(name, type),
          installments(amount, paid_at),
          booking_additional_services(
            quantity,
            additional_services(name)
          )
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

    // Group bookings by month and calculate spending
    const monthlySpending = bookings.reduce((acc, booking) => {
      // Only include completed/paid bookings in spending calculation
      if (booking.status === 'paid' || booking.status === 'confirmed' || booking.status === 'completed') {
        const month = format(new Date(booking.created_at), 'MMM yyyy', { locale: id });
        acc[month] = (acc[month] || 0) + (booking.total_amount || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by date
    const sortedData = Object.entries(monthlySpending)
      .map(([month, amount]) => ({ 
        month, 
        amount: Number(amount) // Ensure it's a number
      }))
      .sort((a, b) => {
        // Simple date comparison - this could be improved
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // Last 6 months

    console.log('Chart spending data:', sortedData);
    return sortedData;
  }, [bookings]);

  const stats = React.useMemo(() => {
    const totalBookings = bookings.length;
    const totalSpending = bookings
      .filter(b => b.status === 'paid' || b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const pendingBookings = bookings.filter(b => 
      b.status === 'pending' || b.status === 'installment'
    ).length;
    
    return { totalBookings, totalSpending, pendingBookings };
  }, [bookings]);

  const recentBookings = bookings.slice(0, 5);
  const pendingBookings = bookings.filter(b => 
    b.status === 'pending' || b.status === 'installment'
  );

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'installment':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'completed':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'paid':
        return 'bg-emerald-900 text-emerald-100 border-emerald-700';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu Pembayaran';
      case 'installment': return 'Cicilan';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'paid': return 'Dibayar';
      default: return status;
    }
  };

  const handlePaymentUpdate = () => {
    // Refresh bookings setelah update pembayaran
    refetchBookings();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  console.log('Rendering dashboard - bookings:', bookings.length, 'spendingData:', spendingData);

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

      {/* Pending Payments Section - Updated dengan Dynamic Button */}
      {pendingBookings.length > 0 && (
        <Card className="border border-orange-200 shadow-sm bg-orange-50">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-peace-sans font-black text-orange-900">
              Booking Menunggu Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-lg gap-3 border border-orange-200">
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
                        <span>{formatDateTimeWITA(booking.start_time || booking.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-peace-sans font-bold text-gray-900 whitespace-nowrap">
                      {(booking.total_amount || 0).toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      })}
                    </p>
                    <DynamicPaymentButton 
                      booking={booking}
                      qrisImageUrl={qrisImageUrl}
                      onPaymentUpdate={handlePaymentUpdate}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart and Recent Bookings Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Chart */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-peace-sans font-black text-gray-900">
              Grafik Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {spendingData.length > 0 ? (
              <div className="w-full h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={spendingData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 10,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#666"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={10}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
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
                      labelStyle={{ fontSize: '11px' }}
                      contentStyle={{ 
                        fontSize: '11px', 
                        maxWidth: '180px',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }}
                      name="Pengeluaran"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] md:h-[300px] text-gray-500">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-inter">Belum ada data pengeluaran</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings - Updated dengan Dynamic Button */}
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
            {recentBookings.length > 0 ? (
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
                          <span>{formatDateTimeWITA(booking.start_time || booking.created_at)}</span>
                        </div>
                      </div>
                      
                      {/* Show installment info if available */}
                      {booking.installments && booking.installments.length > 0 && (
                        <div className="mt-2">
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                            Cicilan: {booking.installments.length}x pembayaran
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3">
                      <Badge className={`${getStatusBadgeStyle(booking.status)} border font-peace-sans font-bold whitespace-nowrap`}>
                        {getStatusText(booking.status)}
                      </Badge>
                      <p className="text-sm font-peace-sans font-bold text-gray-900 whitespace-nowrap">
                        {(booking.total_amount || 0).toLocaleString('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR', 
                          minimumFractionDigits: 0 
                        })}
                      </p>
                      
                      
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] md:h-[300px] text-gray-500">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-inter">Belum ada booking terbaru</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
