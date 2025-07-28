import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, TrendingUp, CreditCard, Target, Calendar, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';

export const KeuanganDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['keuangan-dashboard'],
    queryFn: async () => {
      const currentMonth = new Date();
      const lastMonth = subMonths(currentMonth, 1);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const [currentBookings, lastMonthBookings, installments, targets] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            users (name, email),
            studios (name, type),
            studio_packages (title, price),
            installments (amount, paid_at, payment_method)
          `)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString()),
        
        supabase
          .from('bookings')
          .select('total_amount, installments (amount)')
          .gte('created_at', startOfMonth(lastMonth).toISOString())
          .lte('created_at', endOfMonth(lastMonth).toISOString()),
        
        supabase
          .from('installments')
          .select('*')
          .gte('paid_at', monthStart.toISOString())
          .lte('paid_at', monthEnd.toISOString()),
        
        supabase
          .from('monthly_targets')
          .select('*')
          .eq('month', currentMonth.getMonth() + 1)
          .eq('year', currentMonth.getFullYear())
      ]);

      return {
        currentBookings: currentBookings.data || [],
        lastMonthBookings: lastMonthBookings.data || [],
        installments: installments.data || [],
        targets: targets.data || []
      };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  const { currentBookings, lastMonthBookings, installments, targets } = dashboardData || {};

  // Calculate revenue including installments
  const calculateRevenue = (bookings: any[]) => {
    return bookings?.reduce((sum, booking) => {
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
      return sum + Math.max(bookingAmount, installmentAmount);
    }, 0) || 0;
  };

  const currentRevenue = calculateRevenue(currentBookings);
  const lastMonthRevenue = calculateRevenue(lastMonthBookings);
  const revenueGrowth = lastMonthRevenue > 0 ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  // Payment method analysis
  const paymentAnalysis = currentBookings?.reduce((acc, booking) => {
    const method = booking.payment_method || 'unknown';
    if (!acc[method]) {
      acc[method] = { count: 0, revenue: 0 };
    }
    acc[method].count += 1;
    const bookingRevenue = booking.total_amount || 0;
    const installmentRevenue = booking.installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
    acc[method].revenue += Math.max(bookingRevenue, installmentRevenue);
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>) || {};

  const paymentData = Object.entries(paymentAnalysis).map(([method, data]) => ({
    method: method === 'online' ? 'Online' : 'Offline',
    ...data
  }));

  // Daily revenue trend for current month - Composed Chart data
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyRevenue = monthDays.slice(0, new Date().getDate()).map(day => {
    const dayBookings = currentBookings?.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      return format(bookingDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    }) || [];

    const revenue = dayBookings.reduce((sum, booking) => {
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
      return sum + Math.max(bookingAmount, installmentAmount);
    }, 0);

    return {
      day: format(day, 'dd'),
      revenue,
      bookings: dayBookings.length
    };
  });

  const installmentAnalysis = {
    totalInstallments: installments?.length || 0,
    totalInstallmentAmount: installments?.reduce((sum, inst) => sum + (inst.amount || 0), 0) || 0,
    onlineInstallments: installments?.filter(inst => inst.payment_method === 'online').length || 0,
    offlineInstallments: installments?.filter(inst => inst.payment_method === 'offline').length || 0
  };

  const outstandingPayments = currentBookings?.filter(booking => {
    const totalAmount = booking.total_amount || 0;
    const paidAmount = booking.installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
    return totalAmount > paidAmount;
  }) || [];

  const totalOutstanding = outstandingPayments.reduce((sum, booking) => {
    const totalAmount = booking.total_amount || 0;
    const paidAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
    return sum + (totalAmount - paidAmount);
  }, 0);

  const currentTarget = targets?.[0]?.target_amount || 20000000;
  const targetAchievement = (currentRevenue / currentTarget) * 100;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Keuangan Dashboard</h1>
        <p className="text-muted-foreground">
          Laporan keuangan lengkap untuk {format(new Date(), 'MMMM yyyy', { locale: id })}
        </p>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {currentRevenue.toLocaleString('id-ID')}</div>
            <p className={`text-xs ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${targetAchievement >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {targetAchievement.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: Rp {currentTarget.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Installments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {installmentAnalysis.totalInstallmentAmount.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              {installmentAnalysis.totalInstallments} pembayaran
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rp {totalOutstanding.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              {outstandingPayments.length} booking belum lunas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Turnover Trend - Composed Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Turnover Harian</CardTitle>
            <CardDescription>Perkembangan pendapatan per hari bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Turnover", color: "hsl(var(--chart-1))" },
                bookings: { label: "Bookings", color: "hsl(var(--chart-2))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [
                      name === 'revenue' ? `Rp ${Number(value).toLocaleString('id-ID')}` : value,
                      name === 'revenue' ? 'Revenue' : 'Bookings'
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--chart-1))" />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Metode Pembayaran</CardTitle>
            <CardDescription>Turnover berdasarkan metode pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Turnover" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, revenue, percent }) => 
                      `${method}: ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Turnover']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Installment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Ringkasan Installment
            </CardTitle>
            <CardDescription>
              Pembayaran cicilan bulan ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Total Installments:</span>
                <span className="font-medium">{installmentAnalysis.totalInstallments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Amount:</span>
                <span className="font-medium text-primary">Rp {installmentAnalysis.totalInstallmentAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Online Payments:</span>
                <span className="font-medium text-blue-600">{installmentAnalysis.onlineInstallments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Offline Payments:</span>
                <span className="font-medium text-green-600">{installmentAnalysis.offlineInstallments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Avg per Payment:</span>
                <span className="font-medium">
                  Rp {installmentAnalysis.totalInstallments > 0 ? Math.round(installmentAnalysis.totalInstallmentAmount / installmentAnalysis.totalInstallments).toLocaleString('id-ID') : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Outstanding Payments
            </CardTitle>
            <CardDescription>
              Pembayaran yang belum selesai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Booking Belum Lunas:</span>
                <span className="font-medium text-red-600">{outstandingPayments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Outstanding:</span>
                <span className="font-medium text-red-600">Rp {totalOutstanding.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Avg per Booking:</span>
                <span className="font-medium">
                  Rp {outstandingPayments.length > 0 ? Math.round(totalOutstanding / outstandingPayments.length).toLocaleString('id-ID') : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Collection Rate:</span>
                <span className={`font-medium ${((currentRevenue / (currentRevenue + totalOutstanding)) * 100) >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                  {((currentRevenue / (currentRevenue + totalOutstanding)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Progress Bulanan
          </CardTitle>
          <CardDescription>
            Pencapaian target dan proyeksi pendapatan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Target Bulan Ini:</span>
              <span className="font-bold text-xl">Rp {currentTarget.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sudah Tercapai:</span>
              <span className="font-bold text-xl text-primary">Rp {currentRevenue.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sisa Target:</span>
              <span className={`font-bold text-xl ${currentTarget - currentRevenue <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                Rp {Math.max(0, currentTarget - currentRevenue).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${targetAchievement >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, targetAchievement)}%` }}
              ></div>
            </div>
            <div className="text-center">
              <span className={`text-2xl font-bold ${targetAchievement >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                {targetAchievement.toFixed(1)}% Target Tercapai
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
