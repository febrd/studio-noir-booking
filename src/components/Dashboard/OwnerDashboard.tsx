
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, Users, Calendar, TrendingUp, Building2, Target, UserCheck } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

export const OwnerDashboard = () => {
  // Fetch comprehensive dashboard data including walk-ins
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: async () => {
      const currentMonth = new Date();
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      const lastMonth = subDays(startDate, 1);
      const lastMonthStart = startOfMonth(lastMonth);

      // Fetch bookings data for current and last month including walk-ins
      const [currentBookings, currentWalkins, lastMonthBookings, lastMonthWalkins, studios, users, targets] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            users (name, email),
            studios (name, type),
            studio_packages (title, price),
            installments (amount)
          `)
          .eq('is_walking_session', false)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        supabase
          .from('bookings')
          .select(`
            *,
            users (name, email),
            studios (name, type),
            studio_packages (title, price),
            installments (amount)
          `)
          .eq('is_walking_session', true)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        supabase
          .from('bookings')
          .select('total_amount, installments (amount), is_walking_session')
          .eq('is_walking_session', false)
          .gte('created_at', lastMonthStart.toISOString())
          .lt('created_at', startDate.toISOString()),

        supabase
          .from('bookings')
          .select('total_amount, installments (amount), is_walking_session')
          .eq('is_walking_session', true)
          .gte('created_at', lastMonthStart.toISOString())
          .lt('created_at', startDate.toISOString()),
        
        supabase.from('studios').select('*'),
        supabase.from('users').select('*'),
        supabase.from('monthly_targets').select('*').eq('month', currentMonth.getMonth() + 1).eq('year', currentMonth.getFullYear())
      ]);

      const allCurrentBookings = [...(currentBookings.data || []), ...(currentWalkins.data || [])];
      const allLastMonthBookings = [...(lastMonthBookings.data || []), ...(lastMonthWalkins.data || [])];

      return {
        currentBookings: allCurrentBookings,
        currentWalkins: currentWalkins.data || [],
        lastMonthBookings: allLastMonthBookings,
        studios: studios.data || [],
        users: users.data || [],
        targets: targets.data || []
      };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  const { currentBookings, currentWalkins, lastMonthBookings, studios, users, targets } = dashboardData || {};

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

  // Studio performance analysis including walk-ins
  const studioPerformance = currentBookings?.reduce((acc, booking) => {
    const studioName = booking.studios?.name || 'Unknown';
    if (!acc[studioName]) {
      acc[studioName] = { revenue: 0, bookings: 0, walkins: 0 };
    }
    const bookingRevenue = booking.total_amount || 0;
    const installmentRevenue = booking.installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
    acc[studioName].revenue += Math.max(bookingRevenue, installmentRevenue);
    acc[studioName].bookings += 1;
    if (booking.is_walking_session) {
      acc[studioName].walkins += 1;
    }
    return acc;
  }, {} as Record<string, { revenue: number; bookings: number; walkins: number }>) || {};

  const topStudios = Object.entries(studioPerformance)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Payment method analysis
  const paymentAnalysis = currentBookings?.reduce((acc, booking) => {
    const method = booking.payment_method || 'unknown';
    if (!acc[method]) {
      acc[method] = { count: 0, revenue: 0, walkins: 0 };
    }
    acc[method].count += 1;
    if (booking.is_walking_session) {
      acc[method].walkins += 1;
    }
    const bookingRevenue = booking.total_amount || 0;
    const installmentRevenue = booking.installments?.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0) || 0;
    acc[method].revenue += Math.max(bookingRevenue, installmentRevenue);
    return acc;
  }, {} as Record<string, { count: number; revenue: number; walkins: number }>) || {};

  const paymentData = Object.entries(paymentAnalysis).map(([method, data]) => ({
    method: method === 'online' ? 'Online' : 'Offline',
    ...data
  }));

  // User statistics
  const userStats = {
    total: users?.length || 0,
    owners: users?.filter(u => u.role === 'owner').length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
    keuangan: users?.filter(u => u.role === 'keuangan').length || 0,
    pelanggan: users?.filter(u => u.role === 'pelanggan').length || 0,
  };

  const currentTarget = targets?.[0]?.target_amount || 20000000;
  const targetAchievement = (currentRevenue / currentTarget) * 100;
  const totalWalkinsCount = currentWalkins?.length || 0;
  const totalBookingsCount = currentBookings?.length || 0;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan lengkap performa studio untuk {format(new Date(), 'MMMM yyyy', { locale: id })}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Bulan Ini</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookingsCount}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata: Rp {totalBookingsCount ? Math.round(currentRevenue / totalBookingsCount).toLocaleString('id-ID') : 0} per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Walk-in Sessions</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWalkinsCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalBookingsCount > 0 ? ((totalWalkinsCount / totalBookingsCount) * 100).toFixed(1) : 0}% dari total booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studios?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Self Photo: {studios?.filter(s => s.type === 'self_photo').length || 0} | 
              Regular: {studios?.filter(s => s.type === 'regular').length || 0}
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
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Studios */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Studios Performance</CardTitle>
            <CardDescription>Revenue dan jumlah booking per studio (termasuk walk-in)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
                bookings: { label: "Bookings", color: "hsl(var(--chart-2))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStudios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
            <CardDescription>Distribusi metode pembayaran (termasuk walk-in)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue" }
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
                    formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management Overview
          </CardTitle>
          <CardDescription>
            Statistik pengguna berdasarkan role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{userStats.owners}</div>
              <p className="text-sm text-muted-foreground">Owners</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userStats.admins}</div>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.keuangan}</div>
              <p className="text-sm text-muted-foreground">Keuangan</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats.pelanggan}</div>
              <p className="text-sm text-muted-foreground">Pelanggan</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Studio Management Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Studio Management Summary
          </CardTitle>
          <CardDescription>
            Ringkasan status dan performa studio (termasuk walk-in sessions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Studio Types</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Self Photo:</span>
                  <span className="font-medium">{studios?.filter(s => s.type === 'self_photo').length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Regular Photo:</span>
                  <span className="font-medium">{studios?.filter(s => s.type === 'regular').length || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Average Revenue per Studio</h3>
              <div className="text-2xl font-bold text-primary">
                Rp {studios?.length ? Math.round(currentRevenue / studios.length).toLocaleString('id-ID') : 0}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Most Popular Studio</h3>
              <div className="text-lg font-medium text-primary">
                {topStudios[0]?.name || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">
                {topStudios[0]?.bookings || 0} bookings ({topStudios[0]?.walkins || 0} walk-ins)
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Walk-in Performance</h3>
              <div className="text-2xl font-bold text-blue-600">
                {totalWalkinsCount}
              </div>
              <div className="text-sm text-muted-foreground">
                {totalBookingsCount > 0 ? ((totalWalkinsCount / totalBookingsCount) * 100).toFixed(1) : 0}% conversion rate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
