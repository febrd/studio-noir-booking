
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ExportButtons } from '@/components/ExportButtons';

const TransactionReports = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: combinedData, isLoading } = useQuery({
    queryKey: ['combined-transactions', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          users (name, email),
          studios (name, type),
          studio_packages (title, price),
          installments (amount, paid_at, payment_method)
        `);

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const analytics = useMemo(() => {
    if (!combinedData) return null;

    const onlineBookings = combinedData.filter(b => b.payment_method === 'online');
    const offlineBookings = combinedData.filter(b => b.payment_method === 'offline');

    // Calculate revenue including installments
    const calculateRevenue = (bookings: any[]) => {
      return bookings.reduce((sum, booking) => {
        const bookingAmount = booking.total_amount || 0;
        const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
        return sum + Math.max(bookingAmount, installmentAmount);
      }, 0);
    };

    const onlineRevenue = calculateRevenue(onlineBookings);
    const offlineRevenue = calculateRevenue(offlineBookings);
    const totalRevenue = onlineRevenue + offlineRevenue;

    const paymentMethodDistribution = [
      { method: 'Online', revenue: onlineRevenue, count: onlineBookings.length },
      { method: 'Offline', revenue: offlineRevenue, count: offlineBookings.length }
    ];

    const dailyComparison = combinedData.reduce((acc, booking) => {
      const date = format(new Date(booking.created_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { date, online: 0, offline: 0 };
      }
      
      const bookingRevenue = booking.total_amount || 0;
      const installmentRevenue = booking.installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
      const totalBookingRevenue = Math.max(bookingRevenue, installmentRevenue);
      
      if (booking.payment_method === 'online') {
        acc[date].online += totalBookingRevenue;
      } else {
        acc[date].offline += totalBookingRevenue;
      }
      
      return acc;
    }, {} as Record<string, { date: string; online: number; offline: number }>);

    const dailyComparisonData = Object.values(dailyComparison).sort((a, b) => a.date.localeCompare(b.date));

    const typeComparison = combinedData.reduce((acc, booking) => {
      if (!acc[booking.type]) {
        acc[booking.type] = { online: 0, offline: 0 };
      }
      
      const bookingRevenue = booking.total_amount || 0;
      const installmentRevenue = booking.installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
      const totalBookingRevenue = Math.max(bookingRevenue, installmentRevenue);
      
      if (booking.payment_method === 'online') {
        acc[booking.type].online += totalBookingRevenue;
      } else {
        acc[booking.type].offline += totalBookingRevenue;
      }
      
      return acc;
    }, {} as Record<string, { online: number; offline: number }>);

    const typeComparisonData = Object.entries(typeComparison).map(([type, data]) => ({
      type,
      online: data.online,
      offline: data.offline
    }));

    // Top performing studios
    const studioPerformance = combinedData.reduce((acc, booking) => {
      const studioName = booking.studios?.name || 'Unknown';
      if (!acc[studioName]) {
        acc[studioName] = { revenue: 0, bookings: 0 };
      }
      const bookingRevenue = booking.total_amount || 0;
      const installmentRevenue = booking.installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
      const totalBookingRevenue = Math.max(bookingRevenue, installmentRevenue);
      
      acc[studioName].revenue += totalBookingRevenue;
      acc[studioName].bookings += 1;
      return acc;
    }, {} as Record<string, { revenue: number; bookings: number }>);

    const topStudios = Object.entries(studioPerformance)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalRevenue,
      onlineRevenue,
      offlineRevenue,
      totalBookings: combinedData.length,
      onlineBookings: onlineBookings.length,
      offlineBookings: offlineBookings.length,
      paymentMethodDistribution,
      dailyComparisonData,
      typeComparisonData,
      topStudios
    };
  }, [combinedData]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!analytics) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaction Reports</h1>
          <p className="text-muted-foreground">Laporan komprehensif semua transaksi online & offline</p>
        </div>
        <ExportButtons />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
            placeholder="Pilih rentang tanggal"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {analytics.totalRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              Online: {((analytics.onlineRevenue / analytics.totalRevenue) * 100).toFixed(1)}% | 
              Offline: {((analytics.offlineRevenue / analytics.totalRevenue) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {analytics.onlineRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.onlineBookings} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Revenue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {analytics.offlineRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.offlineBookings} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata: Rp {Math.round(analytics.totalRevenue / analytics.totalBookings).toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">Perbandingan Online vs Offline</TabsTrigger>
          <TabsTrigger value="distribution">Distribusi Payment Method</TabsTrigger>
          <TabsTrigger value="types">Analisis per Tipe</TabsTrigger>
          <TabsTrigger value="studios">Top Studios</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Revenue Harian</CardTitle>
              <CardDescription>Grafik perbandingan pemasukan online vs offline per hari</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  online: {
                    label: "Online",
                    color: "hsl(var(--chart-1))",
                  },
                  offline: {
                    label: "Offline",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="online" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="offline" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Metode Pembayaran</CardTitle>
              <CardDescription>Persentase revenue berdasarkan metode pembayaran</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.paymentMethodDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, revenue, percent }) => 
                        `${method}: Rp ${revenue.toLocaleString('id-ID')} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <ChartTooltip
                      formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue per Tipe Booking</CardTitle>
              <CardDescription>Perbandingan revenue online vs offline per tipe booking</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  online: {
                    label: "Online",
                    color: "hsl(var(--chart-1))",
                  },
                  offline: {
                    label: "Offline",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.typeComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [`Rp ${Number(value).toLocaleString('id-ID')}`, name]}
                    />
                    <Bar dataKey="online" fill="var(--color-online)" />
                    <Bar dataKey="offline" fill="var(--color-offline)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="studios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Studios Berdasarkan Revenue</CardTitle>
              <CardDescription>Studio dengan performa terbaik</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topStudios} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionReports;
