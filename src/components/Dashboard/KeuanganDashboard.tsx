import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, TrendingUp, Calendar, FileText, PieChart as PieChartIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';

export const KeuanganDashboard = () => {
  const currentMonth = new Date();
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  const sixMonthsAgo = subMonths(currentMonth, 5);
  const interval = { start: sixMonthsAgo, end: currentMonth };
  const lastSixMonths = eachMonthOfInterval(interval);

  const { data, isLoading } = useQuery({
    queryKey: ['keuangan-dashboard'],
    queryFn: async () => {
      const [currentMonthBookings, lastSixMonthsBookings] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            total_amount,
            payment_method,
            installments (amount)
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        Promise.all(lastSixMonths.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          return supabase
            .from('bookings')
            .select(`total_amount, installments (amount)`)
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString());
        }))
      ]);

      return {
        currentMonthBookings: currentMonthBookings.data || [],
        lastSixMonthsBookings: lastSixMonthsBookings.map(res => res.data || [])
      };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading financial dashboard...</div>;
  }

  const { currentMonthBookings, lastSixMonthsBookings } = data || {};

  // Calculate revenue for the current month including installments
  const calculateRevenue = (bookings: any[]) => {
    return bookings?.reduce((sum, booking) => {
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
      return sum + Math.max(bookingAmount, installmentAmount);
    }, 0) || 0;
  };

  const currentMonthRevenue = calculateRevenue(currentMonthBookings);

  // Calculate installment revenue
  const installmentRevenue = currentMonthBookings?.reduce((sum, booking) => {
    return sum + (booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0);
  }, 0) || 0;

  // Calculate daily average revenue
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const timeDiff = today.getTime() - firstDayOfMonth.getTime();
  const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  const dailyAverage = Math.round(currentMonthRevenue / dayDiff);

  // Prepare monthly revenue data for the chart
  const monthlyData = lastSixMonths.map((month, index) => {
    const monthName = format(month, 'MMM', { locale: id });
    const revenue = calculateRevenue(lastSixMonthsBookings[index]);
    return { month: monthName, revenue };
  });

  // Calculate revenue growth compared to the previous month
  const previousMonthRevenue = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2].revenue : 0;
  const revenueGrowth = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

  // Payment method analysis
  const paymentMethodsAnalysis = currentMonthBookings?.reduce((acc, booking) => {
    const method = booking.payment_method || 'unknown';
    const bookingAmount = booking.total_amount || 0;
    const installmentAmount = booking.installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
    const revenue = Math.max(bookingAmount, installmentAmount);

    if (!acc[method]) {
      acc[method] = 0;
    }
    acc[method] += revenue;
    return acc;
  }, {} as Record<string, number>) || {};

  const paymentMethods = Object.entries(paymentMethodsAnalysis).map(([method, revenue]) => ({
    method: method === 'online' ? 'Online' : 'Offline',
    revenue
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Keuangan Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor performa keuangan studio untuk periode {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </p>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {currentMonthRevenue.toLocaleString('id-ID')}</div>
            <p className={`text-xs ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthBookings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata Rp {currentMonthBookings?.length ? Math.round(currentMonthRevenue / currentMonthBookings.length).toLocaleString('id-ID') : 0} per transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Installment Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {installmentRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              {currentMonthRevenue > 0 ? ((installmentRevenue / currentMonthRevenue) * 100).toFixed(1) : 0}% dari total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Harian</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {dailyAverage.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              Berdasarkan {new Date().getDate()} hari berjalan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Revenue 6 Bulan Terakhir</CardTitle>
            <CardDescription>Perbandingan revenue bulanan termasuk installment</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--chart-1))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Metode Pembayaran</CardTitle>
            <CardDescription>Breakdown revenue berdasarkan metode pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--chart-2))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>Rincian sumber revenue bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Direct Bookings:</span>
                <span className="font-medium">Rp {(currentMonthRevenue - installmentRevenue).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Installments:</span>
                <span className="font-medium text-blue-600">Rp {installmentRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>Rp {currentMonthRevenue.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth Metrics
            </CardTitle>
            <CardDescription>Performa pertumbuhan keuangan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Month over Month:</span>
                <span className={`font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Best Month (6M):</span>
                <span className="font-medium text-primary">
                  {monthlyData.reduce((best, month) => 
                    month.revenue > best.revenue ? month : best, monthlyData[0]
                  )?.month || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Monthly:</span>
                <span className="font-medium">
                  Rp {monthlyData.length ? Math.round(
                    monthlyData.reduce((sum, month) => sum + month.revenue, 0) / monthlyData.length
                  ).toLocaleString('id-ID') : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Payment Analytics
            </CardTitle>
            <CardDescription>Analisis metode pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentMethods.map((method, index) => (
                <div key={method.method} className="flex justify-between">
                  <span className="capitalize">{method.method}:</span>
                  <div className="text-right">
                    <span className="font-medium">Rp {method.revenue.toLocaleString('id-ID')}</span>
                    <div className="text-xs text-muted-foreground">
                      {currentMonthRevenue > 0 ? ((method.revenue / currentMonthRevenue) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
