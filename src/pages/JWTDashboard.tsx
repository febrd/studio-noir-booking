
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { OwnerDashboard } from '@/components/Dashboard/OwnerDashboard';
import { AdminDashboard } from '@/components/Dashboard/AdminDashboard';
import { KeuanganDashboard } from '@/components/Dashboard/KeuanganDashboard';
import PelangganDashboard from "@/components/Dashboard/PelangganDashboard
import { Loader2 } from 'lucide-react';

const JWTDashboard = () => {
  const { userProfile, loading } = useJWTAuth();

  console.log('JWT Dashboard - User Profile:', userProfile);
  console.log('JWT Dashboard - Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    console.log('JWT Dashboard - No user profile found');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No User Profile Found</h2>
          <p className="text-muted-foreground">Please try logging in again.</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    console.log('JWT Dashboard - Rendering dashboard for role:', userProfile.role);
    
    switch (userProfile.role) {
      case 'owner':
        return <OwnerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'keuangan':
        return <KeuanganDashboard />;
      case 'pelanggan':
        return <PelangganDashboard />;
      default:
        console.warn('JWT Dashboard - Unknown role:', userProfile.role);
        return <PelangganDashboard />;
    }
  };

  return (
    <ModernLayout>
      {renderDashboard()}
    </ModernLayout>
  );
};

export default JWTDashboard;
