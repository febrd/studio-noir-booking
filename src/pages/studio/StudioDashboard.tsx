
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentBookings } from '@/components/Dashboard/RecentBookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const StudioDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Studio Management</h1>
        <p className="text-muted-foreground">
          Manage your studios, packages, and bookings from here.
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentBookings />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common studio management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <a href="/studio/bookings" className="text-sm text-blue-600 hover:underline">
                → View All Bookings
              </a>
              <a href="/studio/packages" className="text-sm text-blue-600 hover:underline">
                → Manage Packages
              </a>
              <a href="/studio/services" className="text-sm text-blue-600 hover:underline">
                → Additional Services
              </a>
              <a href="/studio/walkin-sessions" className="text-sm text-blue-600 hover:underline">
                → Walk-in Sessions
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudioDashboard;
