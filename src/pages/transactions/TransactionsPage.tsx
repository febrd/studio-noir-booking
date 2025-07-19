
import { Routes, Route } from 'react-router-dom';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import OnlineBookingsReport from './OnlineBookingsReport';
import OfflineBookingsReport from './OfflineBookingsReport';
import TransactionReports from './TransactionReports';

const TransactionsPage = () => {
  return (
    <ModernLayout>
      <Routes>
        <Route path="online" element={<OnlineBookingsReport />} />
        <Route path="offline" element={<OfflineBookingsReport />} />
        <Route path="reports" element={<TransactionReports />} />
      </Routes>
    </ModernLayout>
  );
};

export default TransactionsPage;
