
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const KeuanganDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Keuangan Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di dashboard keuangan. Kelola transaksi dan laporan dari sini.
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Laporan Transaksi</CardTitle>
            <CardDescription>
              Ringkasan transaksi terbaru
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <a href="/transactions" className="text-sm text-blue-600 hover:underline">
                → Semua Transaksi
              </a>
              <a href="/transactions/online-bookings" className="text-sm text-blue-600 hover:underline">
                → Booking Online
              </a>
              <a href="/transactions/offline-bookings" className="text-sm text-blue-600 hover:underline">
                → Booking Offline
              </a>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Aksi cepat untuk keuangan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <a href="/expenses" className="text-sm text-blue-600 hover:underline">
                → Kelola Pengeluaran
              </a>
              <a href="/recaps" className="text-sm text-blue-600 hover:underline">
                → Rekap Bulanan
              </a>
              <a href="/transactions/reports" className="text-sm text-blue-600 hover:underline">
                → Laporan Transaksi
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
