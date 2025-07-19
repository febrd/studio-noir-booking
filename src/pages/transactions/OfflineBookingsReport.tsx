import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Download, Users, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface BookingData {
  id: string;
  user_id: string;
  studio_id: string;
  studio_package_id: string;
  package_category_id: string;
  type: string;
  payment_method: string;
  status: string;
  total_amount: number;
  start_time: string;
  end_time: string;
  additional_time_minutes: number;
  created_at: string;
  users: { name: string; email: string };
  studios: { name: string; type: string };
  studio_packages: { title: string; price: number };
  installments: { amount: number; paid_at: string; payment_method: string }[];
}

const OfflineBookingsReport = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusColor = (status: string) => {
    const colors = {
      'paid': '#22c55e',
      'installment': '#f59e0b',
      'pending': '#6b7280',
      'cancelled': '#ef4444',
      'confirmed': '#3b82f6',
      'completed': '#10b981'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['offline-bookings', dateRange, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          users (name, email),
          studios (name, type),
          studio_packages (title, price),
          installments (amount, paid_at, payment_method)
        `)
        .eq('payment_method', 'offline');

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter as any);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BookingData[];
    }
  });

  const analytics = useMemo(() => {
    if (!bookingsData) return null;

    // Calculate revenue including installments properly
    const calculateTotalRevenue = (bookings: BookingData[]) => {
      return bookings.reduce((sum, booking) => {
        const bookingAmount = booking.total_amount || 0;
        const installmentAmount = booking.installments?.reduce((instSum, inst) => instSum + (inst.amount || 0), 0) || 0;
        // Use the higher value between booking amount and total installments
        return sum + Math.max(bookingAmount, installmentAmount);
      }, 0);
    };

    const totalRevenue = calculateTotalRevenue(bookingsData);
    const averageBookingValue = totalRevenue / bookingsData.length || 0;
    
    const statusDistribution = bookingsData.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = bookingsData.reduce((acc, booking) => {
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum, inst) => instSum + (inst.amount || 0), 0) || 0;
      const actualRevenue = Math.max(bookingAmount, installmentAmount);
      
      const revenue = acc[booking.type]?.revenue || 0;
      const count = acc[booking.type]?.count || 0;
      acc[booking.type] = {
        revenue: revenue + actualRevenue,
        count: count + 1
      };
      return acc;
    }, {} as Record<string, { revenue: number; count: number }>);

    const totalDuration = bookingsData.reduce((sum, booking) => {
      if (booking.start_time && booking.end_time) {
        const duration = new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime();
        return sum + (duration / (1000 * 60)); // minutes
      }
      return sum;
    }, 0);

    const averageDuration = totalDuration / bookingsData.length || 0;
    const averageExtraTime = bookingsData.reduce((sum, b) => sum + (b.additional_time_minutes || 0), 0) / bookingsData.length || 0;

    const installmentStats = bookingsData.reduce((acc, booking) => {
      const totalInstallments = booking.installments?.reduce((sum, inst) => sum + inst.amount, 0) || 0;
      const installmentCount = booking.installments?.length || 0;
      
      return {
        totalInstallmentRevenue: acc.totalInstallmentRevenue + totalInstallments,
        averageInstallmentPerBooking: acc.averageInstallmentPerBooking + (totalInstallments / Math.max(installmentCount, 1)),
        totalInstallments: acc.totalInstallments + installmentCount
      };
    }, { totalInstallmentRevenue: 0, averageInstallmentPerBooking: 0, totalInstallments: 0 });

    return {
      totalRevenue,
      averageBookingValue,
      totalBookings: bookingsData.length,
      statusDistribution,
      typeDistribution,
      totalDuration,
      averageDuration,
      averageExtraTime,
      installmentStats
    };
  }, [bookingsData]);

  const chartData = useMemo(() => {
    if (!bookingsData || !analytics) return {};

    const dailyRevenue = bookingsData.reduce((acc, booking) => {
      const date = format(new Date(booking.created_at), 'yyyy-MM-dd');
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum, inst) => instSum + (inst.amount || 0), 0) || 0;
      const actualRevenue = Math.max(bookingAmount, installmentAmount);
      
      acc[date] = (acc[date] || 0) + actualRevenue;
      return acc;
    }, {} as Record<string, number>);

    const dailyRevenueData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => a.date.localeCompare(b.date));

    const statusChartData = Object.entries(analytics.statusDistribution).map(([status, count]) => ({
      status,
      count,
      fill: getStatusColor(status)
    }));

    const installmentTrendData = bookingsData
      .flatMap(booking => booking.installments || [])
      .reduce((acc, installment) => {
        const date = format(new Date(installment.paid_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + installment.amount;
        return acc;
      }, {} as Record<string, number>);

    const installmentTrendChartData = Object.entries(installmentTrendData).map(([date, amount]) => ({
      date,
      amount
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      dailyRevenueData,
      statusChartData,
      installmentTrendChartData
    };
  }, [bookingsData, analytics]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!analytics || !chartData) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Offline Bookings Report</h1>
          <p className="text-muted-foreground">Analisis komprehensif booking offline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
            placeholder="Pilih rentang tanggal"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipe Booking" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="self_photo">Self Photo</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="installment">Installment</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {analytics.totalRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              Rata-rata: Rp {Math.round(analytics.averageBookingValue).toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Booking</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Cicilan: {analytics.installmentStats.totalInstallments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Durasi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.averageDuration)} menit</div>
            <p className="text-xs text-muted-foreground">
              Extra: {Math.round(analytics.averageExtraTime)} menit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Cicilan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {analytics.installmentStats.totalInstallmentRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              Rata-rata per booking: Rp {Math.round(analytics.installmentStats.averageInstallmentPerBooking).toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Tren Revenue</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="installments">Tren Cicilan</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tren Pemasukan Harian</CardTitle>
              <CardDescription>Grafik pemasukan dari booking offline per hari</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Status Booking</CardTitle>
              <CardDescription>Persentase booking berdasarkan status</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {chartData.statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tren Pembayaran Cicilan</CardTitle>
              <CardDescription>Grafik pembayaran cicilan dari waktu ke waktu</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.installmentTrendChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Cicilan']}
                    />
                    <Line type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfflineBookingsReport;
