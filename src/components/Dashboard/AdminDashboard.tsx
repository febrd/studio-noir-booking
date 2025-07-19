
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Users, Calendar, Building2, TrendingUp, BookOpen, DollarSign } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';

export const AdminDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const currentWeek = new Date();
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      const [bookings, studios, users, packages] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            users (name, email),
            studios (name, type),
            studio_packages (title, price),
            installments (amount)
          `)
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString()),
        
        supabase.from('studios').select('*'),
        supabase.from('users').select('*'),
        supabase.from('studio_packages').select('*')
      ]);

      return {
        bookings: bookings.data || [],
        studios: studios.data || [],
        users: users.data || [],
        packages: packages.data || []
      };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  const { bookings, studios, users, packages } = dashboardData || {};

  // Calculate daily bookings for the week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const dailyBookings = weekDays.map(day => {
    const dayBookings = bookings?.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      return format(bookingDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    }) || [];

    const revenue = dailyBookings.reduce((sum, booking) => {
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
      return sum + Math.max(bookingAmount, installmentAmount);
    }, 0);

    return {
      day: format(day, 'EEE', { locale: id }),
      bookings: dayBookings.length,
      revenue
    };
  });

  // Studio utilization
  const studioUtilization = studios?.map(studio => {
    const studioBookings = bookings?.filter(b => b.studio_id === studio.id) || [];
    return {
      name: studio.name,
      bookings: studioBookings.length,
      type: studio.type
    };
  }) || [];

  // User activity
  const userActivity = {
    totalUsers: users?.length || 0,
    activeUsers: users?.filter(u => u.is_active).length || 0,
    newUsers: users?.filter(u => {
      const createdDate = new Date(u.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length || 0
  };

  const totalRevenue = dailyBookings.reduce((sum, day) => sum + day.revenue, 0);
  const totalBookingsCount = bookings?.length || 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Kelola operasional studio minggu ini ({format(weekStart, 'dd MMM', { locale: id })} - {format(weekEnd, 'dd MMM yyyy', { locale: id })})
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings Minggu Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookingsCount}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata {(totalBookingsCount / 7).toFixed(1)} per hari
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Minggu Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata Rp {totalBookingsCount > 0 ? Math.round(totalRevenue / totalBookingsCount).toLocaleString('id-ID') : 0} per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Studios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studios?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {studioUtilization.filter(s => s.bookings > 0).length} studio dengan booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userActivity.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userActivity.newUsers} user baru minggu ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Bookings Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Booking Harian</CardTitle>
            <CardDescription>Jumlah booking dan revenue per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                bookings: { label: "Bookings", color: "hsl(var(--chart-1))" },
                revenue: { label: "Revenue", color: "hsl(var(--chart-2))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyBookings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="bookings" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Studio Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Utilitas Studio</CardTitle>
            <CardDescription>Penggunaan studio berdasarkan jumlah booking</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                bookings: { label: "Bookings", color: "hsl(var(--chart-1))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studioUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Management Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <span className="font-medium">{userActivity.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span className="font-medium text-green-600">{userActivity.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span>New This Week:</span>
                <span className="font-medium text-blue-600">{userActivity.newUsers}</span>
              </div>
              <div className="flex justify-between">
                <span>Inactive:</span>
                <span className="font-medium text-red-600">{userActivity.totalUsers - userActivity.activeUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Studio Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Studios:</span>
                <span className="font-medium">{studios?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Self Photo:</span>
                <span className="font-medium">{studios?.filter(s => s.type === 'self_photo').length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Regular Photo:</span>
                <span className="font-medium">{studios?.filter(s => s.type === 'regular_photo').length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Most Active:</span>
                <span className="font-medium text-primary">
                  {studioUtilization.sort((a, b) => b.bookings - a.bookings)[0]?.name || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Package Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Packages:</span>
                <span className="font-medium">{packages?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Price:</span>
                <span className="font-medium">
                  Rp {packages?.length ? Math.round(packages.reduce((sum, p) => sum + (p.price || 0), 0) / packages.length).toLocaleString('id-ID') : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Most Expensive:</span>
                <span className="font-medium text-green-600">
                  Rp {packages?.length ? Math.max(...packages.map(p => p.price || 0)).toLocaleString('id-ID') : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Most Affordable:</span>
                <span className="font-medium text-blue-600">
                  Rp {packages?.length ? Math.min(...packages.map(p => p.price || 0)).toLocaleString('id-ID') : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
