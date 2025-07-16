
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentBookings } from '@/components/Dashboard/RecentBookings';

const Index = () => {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Studio Noir booking management system
          </p>
        </div>
        
        <StatsCards />
        <RecentBookings />
      </div>
    </ModernLayout>
  );
};

export default Index;
