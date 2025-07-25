import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, Target, TrendingUp, Calendar, DollarSign, Building2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { ExportButtons } from '@/components/ExportButtons';
import { MonthlyRevenueDetails } from '@/components/MonthlyRevenueDetails';
import { ModernLayout } from '@/components/Layout/ModernLayout';

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

const RecapsPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [targetAmount, setTargetAmount] = useState<number>(20000000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const queryClient = useQueryClient();

  // Custom month period calculation (25th to 24th)
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

  // Fetch bookings data for the custom period
  const { data: bookingsData, isLoading } = useQuery({
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

  const analytics = useMemo(() => {
    if (!bookingsData) return null;

    const calculateRevenue = (bookings: any[]) => {
      return bookings.reduce((sum, booking) => {
        const bookingAmount = booking.total_amount || 0;
        const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
        return sum + Math.max(bookingAmount, installmentAmount);
      }, 0);
    };

    // Weekly revenue calculation
    const weeklyRevenue: WeeklyRevenue[] = weeklyPeriods.map(week => {
      const weekBookings = bookingsData.filter(booking => {
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
    const categoryStats = bookingsData.reduce((acc, booking) => {
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
      const categoryBookings = bookingsData.filter(b => 
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
    const studioStats = bookingsData.reduce((acc, booking) => {
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
  }, [bookingsData, weeklyPeriods, monthlyTarget, targetAmount, startDate, endDate]);

  const exportData = useMemo(() => {
    if (!analytics) return undefined;

    const headers = [
      'Item',
      'Kategori Paket',
      'Jumlah Item Terjual',
      'Jumlah Paket Terjual',
      'Pendapatan per Item',
      'Pendapatan per Paket'
    ];

    // Create expanded data for export
    const groupedByItem = analytics.monthlyDetails.reduce((acc, detail) => {
      if (!acc[detail.item]) {
        acc[detail.item] = {
          totalSessions: 0,
          totalRevenue: 0,
          packages: []
        };
      }
      acc[detail.item].totalSessions += detail.sessions_count;
      acc[detail.item].totalRevenue += detail.revenue;
      acc[detail.item].packages.push(detail);
      return acc;
    }, {} as Record<string, { totalSessions: number; totalRevenue: number; packages: any[] }>);

    const data = Object.entries(groupedByItem).flatMap(([item, itemData]) =>
      itemData.packages.map((packageDetail, index) => [
        index === 0 ? item : '',
        packageDetail.category,
        index === 0 ? itemData.totalSessions.toString() : '',
        packageDetail.sessions_count.toString(),
        index === 0 ? `Rp ${itemData.totalRevenue.toLocaleString('id-ID')}` : '',
        `Rp ${packageDetail.revenue.toLocaleString('id-ID')}`
      ])
    );

    return {
      title: `Detail Pendapatan Bulanan ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: id })}`,
      headers,
      data,
      filename: `detail-pendapatan-${selectedMonth}-${selectedYear}`
    };
  }, [analytics, selectedMonth, selectedYear]);

  const handleSaveTarget = () => {
    updateTargetMutation.mutate(targetAmount);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Recaps - Rekapitulasi Bulanan</h1>
            <p className="text-muted-foreground">
              Periode: {format(startDate, 'dd MMMM yyyy', { locale: id })} - {format(endDate, 'dd MMMM yyyy', { locale: id })}
            </p>
          </div>
          <ExportButtons exportData={exportData} />
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
                  Rp {analytics?.totalRevenue.toLocaleString('id-ID') || '0'}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Persentase Achievement</Label>
                <div className={`text-2xl font-bold ${analytics && analytics.achievementPercentage >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {analytics?.achievementPercentage.toFixed(1)}%
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
                    {analytics?.weeklyRevenue.map((week, index) => (
                      <td key={index} className="border border-gray-200 p-3">
                        <div className="text-sm text-gray-600">{week.period}</div>
                        <div className="font-semibold">Rp {week.revenue.toLocaleString('id-ID')}</div>
                      </td>
                    ))}
                    <td className="border border-gray-200 p-3 bg-blue-50">
                      <div className="font-bold text-primary">
                        Rp {analytics?.totalRevenue.toLocaleString('id-ID')}
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
                <BarChart data={[...analytics?.weeklyRevenue || [], { week: 'Total', revenue: analytics?.totalRevenue || 0, period: 'Keseluruhan' }]}>
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

        {/* Top 10 Studios Chart */}
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
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.topStudios || []} layout="horizontal" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="studio_name" width={100} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => [
                      `Rp ${Number(value).toLocaleString('id-ID')}`,
                      'Revenue',
                      `${props.payload.sessions_count} Sesi`
                    ]}
                  />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* New Monthly Revenue Details Component */}
        {analytics && (
          <MonthlyRevenueDetails 
            monthlyDetails={analytics.monthlyDetails}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </ModernLayout>
  );
};

export default RecapsPage;
