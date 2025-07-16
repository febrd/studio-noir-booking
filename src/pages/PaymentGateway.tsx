
import { Routes, Route } from 'react-router-dom';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import PaymentProviders from '@/pages/admin/PaymentProviders';

const PaymentGateway = () => {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Gateway</h1>
          <p className="text-muted-foreground">
            Manage payment providers and gateway settings
          </p>
        </div>
        
        <Routes>
          <Route index element={<PaymentProviders />} />
        </Routes>
      </div>
    </ModernLayout>
  );
};

export default PaymentGateway;
