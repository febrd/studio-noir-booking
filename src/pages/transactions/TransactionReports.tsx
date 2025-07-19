import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, Target, Calendar, Building2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { ExportButtons } from '@/components/ExportButtons';
import { MonthlyRevenueDetails } from '@/components/MonthlyRevenueDetails';

interface WeeklyRevenue {
  week: string;
  revenue: number;
  period: string;
}

interface MonthlyDetail {
  item: string;
  category: string;
  sessions_count: number;
  sessions_per_day: number;
  sessions_per_package: number;
  revenue: number;
  avg_transaction_item: number;
  avg_transaction_category: number;
}

interface StudioRevenue {
  studio_name: string;
  studio_type: string;
  revenue: number;
  sessions_count: number;
}

const TransactionReports = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [targetAmount, setTargetAmount] = useState<number>(20000000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const queryClient = useQueryClient();

  // Custom month period calculation (25th to 24th) for recaps
  const getCustomMonthPeriod = (month: number, year: number) => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const startDate = new Date(prevYear, prevMonth - 1, 25);
    const endDate = new Date(year, month - 1, 24);
    
    return { startDate, endDate };
  };

  const getWeeklyPeriods = (startDate: Date, endDate: Date) => {
    const weeks = [];
    let currentStart = startDate;
    
    for (let i = 1; i <= 4; i++) {
      let currentEnd;
      if (i === 4) {
        currentEnd = endDate;
      } else {
        currentEnd = addDays(currentStart, 6);
      }
      
      weeks.push({
        week: i,
        startDate: currentStart,
        endDate: currentEnd,
        label: `Minggu ${i}`,
        period: `${format(currentStart, 'dd MMM', { locale: id })} - ${format(currentEnd, 'dd MMM', { locale: id })}`
      });
      
      currentStart = addDays(currentEnd, 1);
    }
    
    return weeks;
  };

  const { startDate, endDate } = getCustomMonthPeriod(selectedMonth, selectedYear);
  const weeklyPeriods = getWeeklyPeriods(startDate, endDate);

  // Fetch monthly target
  const { data: monthlyTarget } = useQuery({
    queryKey: ['monthly-target', selectedMonth, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_targets')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Update target mutation
  const updateTargetMutation = useMutation({
    mutationFn: async (newTarget: number) => {
      const { data, error } = await supabase
        .from('monthly_targets')
        .upsert({
          month: selectedMonth,
          year: selectedYear,
          target_amount: newTarget
        }, {
          onConflict: 'month,year'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-target'] });
      toast.success('Target pendapatan berhasil diperbarui');
      setIsEditingTarget(false);
    },
    onError: (error) => {
      toast.error('Gagal memperbarui target: ' + error.message);
    }
  });

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
          package_categories (name),
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

  // Fetch recaps data for the custom period
  const { data: recapsData, isLoading: isRecapsLoading } = useQuery({
    queryKey: ['recaps-bookings', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (name, email),
          studios (name, type),
          studio_packages (title, price, category_id),
          package_categories (name),
          installments (amount, paid_at, payment_method)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

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

  const recapsAnalytics = useMemo(() => {
    if (!recapsData) return null;

    const calculateRevenue = (bookings: any[]) => {
      return bookings.reduce((sum, booking) => {
        const bookingAmount = booking.total_amount || 0;
        const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
        return sum + Math.max(bookingAmount, installmentAmount);
      }, 0);
    };

    // Weekly revenue calculation
    const weeklyRevenue: WeeklyRevenue[] = weeklyPeriods.map(week => {
      const weekBookings = recapsData.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= week.startDate && bookingDate <= week.endDate;
      });

      return {
        week: week.label,
        revenue: calculateRevenue(weekBookings),
        period: week.period
      };
    });

    const totalRevenue = weeklyRevenue.reduce((sum, week) => sum + week.revenue, 0);

    // Monthly details by category and package
    const categoryStats = recapsData.reduce((acc, booking) => {
      const category = booking.package_categories?.name || booking.studios?.type || 'Unknown';
      const packageTitle = booking.studio_packages?.title || 'Unknown Package';
      const key = `${category}-${packageTitle}`;
      
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
      const revenue = Math.max(bookingAmount, installmentAmount);

      if (!acc[key]) {
        acc[key] = {
          item: category,
          category: packageTitle,
          sessions_count: 0,
          revenue: 0,
          transactions: []
        };
      }

      acc[key].sessions_count += 1;
      acc[key].revenue += revenue;
      acc[key].transactions.push(revenue);

      return acc;
    }, {} as Record<string, { item: string; category: string; sessions_count: number; revenue: number; transactions: number[] }>);

    const monthlyDetails: MonthlyDetail[] = Object.entries(categoryStats).map(([key, stats]) => {
      const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const sessionsPerDay = stats.sessions_count / daysInPeriod;
      const avgTransactionItem = stats.revenue / stats.sessions_count;

      // Calculate sessions per package (average daily sessions for this category)
      const categoryBookings = recapsData.filter(b => 
        (b.package_categories?.name || b.studios?.type) === stats.item
      );
      const sessionsPerPackage = categoryBookings.length / daysInPeriod;

      return {
        item: stats.item,
        category: stats.category,
        sessions_count: stats.sessions_count,
        sessions_per_day: sessionsPerDay,
        sessions_per_package: sessionsPerPackage,
        revenue: stats.revenue,
        avg_transaction_item: avgTransactionItem,
        avg_transaction_category: avgTransactionItem
      };
    });

    // Studio revenue calculation for Top 10
    const studioStats = recapsData.reduce((acc, booking) => {
      const studioName = booking.studios?.name || 'Unknown Studio';
      const studioType = booking.studios?.type || 'Unknown';
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
      const revenue = Math.max(bookingAmount, installmentAmount);

      if (!acc[studioName]) {
        acc[studioName] = {
          studio_name: studioName,
          studio_type: studioType,
          revenue: 0,
          sessions_count: 0
        };
      }

      acc[studioName].revenue += revenue;
      acc[studioName].sessions_count += 1;

      return acc;
    }, {} as Record<string, StudioRevenue>);

    const topStudios = Object.values(studioStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const currentTarget = monthlyTarget?.target_amount || targetAmount;
    const achievementPercentage = (totalRevenue / currentTarget) * 100;

    return {
      weeklyRevenue,
      totalRevenue,
      monthlyDetails,
      topStudios,
      currentTarget,
      achievementPercentage
    };
  }, [recapsData, weeklyPeriods, monthlyTarget, targetAmount, startDate, endDate]);

  // Add export data for Transaction Reports
  const exportData = useMemo(() => {
    if (!combinedData) return undefined;

    const headers = [
      'Tanggal',
      'Customer',
      'Email',
      'Studio',
      'Paket',
      'Tipe',
      'Payment Method',
      'Status',
      'Total Amount'
    ];

    const data = combinedData.map(booking => [
      format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm', { locale: id }),
      booking.users?.name || '-',
      booking.users?.email || '-',
      booking.studios?.name || '-',
      booking.studio_packages?.title || '-',
      booking.type || '-',
      booking.payment_method || '-',
      booking.status || '-',
      `Rp ${(booking.total_amount || 0).toLocaleString('id-ID')}`
    ]);

    return {
      title: `Laporan Transaksi ${dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Semua'} - ${dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Sekarang'}`,
      headers,
      data,
      filename: `transaction-reports-${dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'all'}-${dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'now'}`
    };
  }, [combinedData, dateRange]);

  const recapsExportData = useMemo(() => {
    if (!recapsAnalytics) return undefined;

    const headers = [
      'Item',
      'Kategori Paket',
      'Jumlah Sesi (per Item)',
      'Jumlah Sesi (per Paket)',
      'Omset',
      'Rata-rata Transaksi (Item)',
      'Rata-rata Transaksi (Kategori)'
    ];

    const data = recapsAnalytics.monthlyDetails.map(detail => [
      detail.item,
      detail.category,
      detail.sessions_count.toString(),
      `${detail.sessions_per_package.toFixed(1)} / hari`,
      `Rp ${detail.revenue.toLocaleString('id-ID')}`,
      `Rp ${detail.avg_transaction_item.toLocaleString('id-ID')}`,
      `Rp ${detail.avg_transaction_category.toLocaleString('id-ID')}`
    ]);

    return {
      title: `Rekapitulasi Bulanan ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: id })}`,
      headers,
      data,
      filename: `recaps-${selectedMonth}-${selectedYear}`
    };
  }, [recapsAnalytics, selectedMonth, selectedYear]);

  const handleSaveTarget = () => {
    updateTargetMutation.mutate(targetAmount);
  };

  // Color palette for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

  if (isLoading || isRecapsLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Transaction Reports</h1>
          <p className="text-muted-foreground">Laporan transaksi lengkap dan rekapitulasi bulanan</p>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transaction Reports</TabsTrigger>
          <TabsTrigger value="recaps">Monthly Recaps</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Laporan</CardTitle>
              <ExportButtons exportData={exportData} />
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
                  Rp {analytics?.totalRevenue.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Online: {analytics && analytics.totalRevenue > 0 ? ((analytics.onlineRevenue / analytics.totalRevenue) * 100).toFixed(1) : 0}% | 
                  Offline: {analytics && analytics.totalRevenue > 0 ? ((analytics.offlineRevenue / analytics.totalRevenue) * 100).toFixed(1) : 0}%
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
                  Rp {analytics?.onlineRevenue.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.onlineBookings} bookings
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
                  Rp {analytics?.offlineRevenue.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.offlineBookings} bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalBookings}</div>
                <p className="text-xs text-muted-foreground">
                  Rata-rata: Rp {analytics && analytics.totalBookings > 0 ? Math.round(analytics.totalRevenue / analytics.totalBookings).toLocaleString('id-ID') : 0}
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
                      <BarChart data={analytics?.dailyComparisonData}>
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
                          data={analytics?.paymentMethodDistribution}
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
                      <BarChart data={analytics?.typeComparisonData}>
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
                        color: "hsl(var(--foreground))",
                      },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.topStudios}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, revenue, percent }) => 
                            `${name}: Rp ${revenue.toLocaleString('id-ID')} (${(percent * 100).toFixed(1)}%)`
                          }
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {analytics?.topStudios.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          formatter={(value, name, props) => [
                            `Rp ${Number(value).toLocaleString('id-ID')}`,
                            'Revenue',
                            `${props.payload.bookings} Bookings`
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="recaps" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Monthly Recaps</h2>
              <p className="text-muted-foreground">
                Periode: {format(startDate, 'dd MMMM yyyy', { locale: id })} - {format(endDate, 'dd MMMM yyyy', { locale: id })}
              </p>
            </div>
            <ExportButtons exportData={recapsExportData} />
          </div>

          {/* Period Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Pilih Periode</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex flex-col space-y-2">
                <Label>Bulan</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2024, i), 'MMMM', { locale: id })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Tahun</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => (
                      <SelectItem key={2024 + i} value={(2024 + i).toString()}>
                        {2024 + i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Target & Achievement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Pendapatan Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Target Bulanan</Label>
                  {isEditingTarget ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(Number(e.target.value))}
                        className="flex-1"
                      />
                      <Button onClick={handleSaveTarget} size="sm">
                        Simpan
                      </Button>
                      <Button onClick={() => setIsEditingTarget(false)} variant="outline" size="sm">
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        Rp {(monthlyTarget?.target_amount || targetAmount).toLocaleString('id-ID')}
                      </span>
                      <Button onClick={() => setIsEditingTarget(true)} variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Total Pendapatan</Label>
                  <div className="text-2xl font-bold text-primary">
                    Rp {recapsAnalytics?.totalRevenue.toLocaleString('id-ID') || '0'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Persentase Achievement</Label>
                  <div className={`text-2xl font-bold ${recapsAnalytics && recapsAnalytics.achievementPercentage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    {recapsAnalytics?.achievementPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Revenue Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pendapatan Mingguan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-3 text-left">Minggu 1</th>
                      <th className="border border-gray-200 p-3 text-left">Minggu 2</th>
                      <th className="border border-gray-200 p-3 text-left">Minggu 3</th>
                      <th className="border border-gray-200 p-3 text-left">Minggu 4</th>
                      <th className="border border-gray-200 p-3 text-left font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {recapsAnalytics?.weeklyRevenue.map((week, index) => (
                        <td key={index} className="border border-gray-200 p-3">
                          <div className="text-sm text-gray-600">{week.period}</div>
                          <div className="font-semibold">Rp {week.revenue.toLocaleString('id-ID')}</div>
                        </td>
                      ))}
                      <td className="border border-gray-200 p-3 bg-blue-50">
                        <div className="font-bold text-primary">
                          Rp {recapsAnalytics?.totalRevenue.toLocaleString('id-ID')}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Grafik Pendapatan Mingguan</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Pendapatan",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...(recapsAnalytics?.weeklyRevenue || []), { week: 'Total', revenue: recapsAnalytics?.totalRevenue || 0, period: 'Keseluruhan' }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top 10 Studios Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Top 10 Studios Berdasarkan Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--foreground))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recapsAnalytics?.topStudios || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ studio_name, revenue, percent }) => 
                        `${studio_name}: Rp ${revenue.toLocaleString('id-ID')} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {recapsAnalytics?.topStudios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `Rp ${Number(value).toLocaleString('id-ID')}`,
                        'Revenue',
                        `${props.payload.sessions_count} Sesi`
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Detail Pendapatan Bulanan */}
          {recapsAnalytics && (
            <MonthlyRevenueDetails 
              monthlyDetails={recapsAnalytics.monthlyDetails}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionReports;
