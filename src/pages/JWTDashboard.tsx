import { useJWTAuth } from '@/hooks/useJWTAuth';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { OwnerDashboard } from '@/components/customer/Dashboard/OwnerDashboard';
import { AdminDashboard } from '@/components/customer/Dashboard/AdminDashboard';
import { KeuanganDashboard } from '@/components/customer/Dashboard/KeuanganDashboard';
import PelangganDashboard from '@/components/customer/Dashboard/PelangganDashboard';
import { Loader2 } from 'lucide-react';
import { InvoiceTestPanel } from '@/components/InvoiceTestPanel';

const JWTDashboard = () => {
  const { userProfile, loading } = useJWTAuth();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
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
    
    switch (userProfile.role) {
      case 'owner':
        return (
          <div className="space-y-6">
            <OwnerDashboard />
            {/* Add test panel for owner */}
            <div className="flex justify-center">
              <InvoiceTestPanel />
            </div>
          </div>
        );
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
