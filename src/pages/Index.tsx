
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentBookings } from '@/components/Dashboard/RecentBookings';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { userProfile, loading } = useJWTAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!userProfile) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to JWT dashboard if logged in
  return <Navigate to="/jwt-dashboard" replace />;
};

export default Index;
