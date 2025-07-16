
import { Routes, Route } from 'react-router-dom';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import PaymentProviders from '@/pages/admin/PaymentProviders';

const PaymentGateway = () => {
  const { userProfile } = useJWTAuth();

  // Check if current user can access payment gateway
  const canAccessPaymentGateway = userProfile?.role && ['owner', 'admin', 'keuangan'].includes(userProfile.role);

  if (!canAccessPaymentGateway) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses Payment Gateway.</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <Routes>
        <Route index element={<PaymentProviders />} />
      </Routes>
    </ModernLayout>
  );
};

export default PaymentGateway;
