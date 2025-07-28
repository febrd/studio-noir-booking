
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Users, Calendar, Building2, TrendingUp, BookOpen, DollarSign, UserCheck } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AdminDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const currentWeek = new Date();
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      const [bookings, walkinSessions, studios, users, packages] = await Promise.all([
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
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString()),
        
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
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString()),
        
        supabase.from('studios').select('*'),
        supabase.from('users').select('*'),
        supabase.from('studio_packages').select('*')
      ]);

      return {
        bookings: bookings.data || [],
        walkinSessions: walkinSessions.data || [],
        studios: studios.data || [],
        users: users.data || [],
        packages: packages.data || []
      };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  const { bookings, walkinSessions, studios, users, packages } = dashboardData || {};
  const allBookings = [...(bookings || []), ...(walkinSessions || [])];

  // Calculate daily bookings for the week including walk-ins
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const dailyBookings = weekDays.map(day => {
    const dayBookings = allBookings?.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      return format(bookingDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    }) || [];

    const dayWalkins = dayBookings.filter(b => b.is_walking_session);

    const revenue = dayBookings.reduce((sum, booking) => {
      const bookingAmount = booking.total_amount || 0;
      const installmentAmount = booking.installments?.reduce((instSum: number, inst: any) => instSum + (inst.amount || 0), 0) || 0;
      return sum + Math.max(bookingAmount, installmentAmount);
    }, 0);

    return {
      day: format(day, 'EEE', { locale: id }),
      bookings: dayBookings.length,
      walkins: dayWalkins.length,
      revenue
    };
  });

  // Studio utilization for pie chart including walk-ins
  const studioUtilization = studios?.map(studio => {
    const studioBookings = allBookings?.filter(b => b.studio_id === studio.id) || [];
    const studioWalkins = studioBookings.filter(b => b.is_walking_session);
    return {
      name: studio.name,
      bookings: studioBookings.length,
      walkins: studioWalkins.length,
      type: studio.type
    };
  }).filter(s => s.bookings > 0) || [];

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
  const totalBookingsCount = allBookings?.length || 0;
  const totalWalkinCount = walkinSessions?.length || 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Kelola operasional studio minggu ini ({format(weekStart, 'dd MMM', { locale: id })} - {format(weekEnd, 'dd MMM yyyy', { locale: id })})
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
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
            <CardTitle className="text-sm font-medium">Walk-in Sessions</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWalkinCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalBookingsCount > 0 ? ((totalWalkinCount / totalBookingsCount) * 100).toFixed(1) : 0}% dari total booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Minggu Ini</CardTitle>
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
              {studioUtilization.length} studio dengan booking
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
        {/* Daily Bookings Trend - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Booking Harian</CardTitle>
            <CardDescription>Jumlah booking dan walk-in per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                bookings: { label: "Total Bookings", color: "hsl(var(--chart-1))" },
                walkins: { label: "Walk-ins", color: "hsl(var(--chart-2))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyBookings}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorWalkins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="bookings" 
                    stackId="1"
                    stroke="hsl(var(--chart-1))" 
                    fillOpacity={1} 
                    fill="url(#colorBookings)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="walkins" 
                    stackId="2"
                    stroke="hsl(var(--chart-2))" 
                    fillOpacity={1} 
                    fill="url(#colorWalkins)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Studio Utilization - Pie Chart */}
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
                <PieChart>
                  <Pie
                    data={studioUtilization}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, bookings, percent }) => 
                      `${name}: ${bookings} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="bookings"
                  >
                    {studioUtilization.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
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
                <span className="font-medium">{studios?.filter(s => s.type === 'regular').length || 0}</span>
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
              <UserCheck className="h-5 w-5" />
              Walk-in Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Walk-ins:</span>
                <span className="font-medium">{totalWalkinCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Walk-in Rate:</span>
                <span className="font-medium">
                  {totalBookingsCount > 0 ? ((totalWalkinCount / totalBookingsCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Regular Bookings:</span>
                <span className="font-medium">{(bookings?.length || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Walk-ins/Day:</span>
                <span className="font-medium text-blue-600">{(totalWalkinCount / 7).toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
