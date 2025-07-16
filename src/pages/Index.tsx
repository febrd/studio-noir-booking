
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentBookings } from '@/components/Dashboard/RecentBookings';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { userProfile } = useJWTAuth();

  // Redirect to main JWT dashboard
  if (userProfile) {
    return <Navigate to="/" replace />;
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang di sistem manajemen booking Studio Noir
          </p>
        </div>
        
        <StatsCards />
        <RecentBookings />
      </div>
    </ModernLayout>
  );
};

export default Index;
