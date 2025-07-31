
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentBookings } from '@/components/Dashboard/RecentBookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const OwnerDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Owner Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di dashboard owner. Kelola seluruh sistem dari sini.
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentBookings />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Aksi cepat untuk owner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <a href="/studio/studios" className="text-sm text-blue-600 hover:underline">
                → Kelola Studio
              </a>
              <a href="/admin/users" className="text-sm text-blue-600 hover:underline">
                → Kelola User
              </a>
              <a href="/transactions" className="text-sm text-blue-600 hover:underline">
                → Laporan Transaksi
              </a>
              <a href="/expenses" className="text-sm text-blue-600 hover:underline">
                → Kelola Pengeluaran
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
