
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { OwnerDashboard } from '@/components/Dashboard/OwnerDashboard';
import { AdminDashboard } from '@/components/Dashboard/AdminDashboard';
import { KeuanganDashboard } from '@/components/Dashboard/KeuanganDashboard';
import { PelangganDashboard } from '@/components/Dashboard/PelangganDashboard';

const JWTDashboard = () => {
  const { userProfile } = useJWTAuth();

  const renderDashboard = () => {
    switch (userProfile?.role) {
      case 'owner':
        return <OwnerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'keuangan':
        return <KeuanganDashboard />;
      case 'pelanggan':
        return <PelangganDashboard />;
      default:
        return <PelangganDashboard />;
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <ModernLayout>
      {renderDashboard()}
    </ModernLayout>
  );
};

export default JWTDashboard;
