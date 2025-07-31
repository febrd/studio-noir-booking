
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentBookings } from '@/components/Dashboard/RecentBookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di dashboard admin. Kelola studio dan booking dari sini.
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentBookings />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Aksi cepat untuk admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <a href="/studio/bookings" className="text-sm text-blue-600 hover:underline">
                → Kelola Booking
              </a>
              <a href="/studio/packages" className="text-sm text-blue-600 hover:underline">
                → Kelola Paket
              </a>
              <a href="/studio/walkin-sessions" className="text-sm text-blue-600 hover:underline">
                → Walk-in Sessions
              </a>
              <a href="/admin/customers" className="text-sm text-blue-600 hover:underline">
                → Kelola Pelanggan
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
