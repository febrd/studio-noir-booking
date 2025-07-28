
import { Routes, Route } from 'react-router-dom';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import StudiosPage from './StudiosPage';
import PackageCategoriesPage from './PackageCategoriesPage';
import PackagesPage from './PackagesPage';
import ServicesPage from './ServicesPage';
import BookingsPage from './BookingsPage';
import StudioDashboard from './StudioDashboard';
import OfflineTransactionsPage from './OfflineTransactionsPage';
import BookingLogsPage from './BookingLogsPage';
import ExpensesPage from '../expenses/ExpensesPage';

const StudioManagement = () => {
  return (
    <ModernLayout>
      <Routes>
        <Route index element={<StudioDashboard />} />
        <Route path="studios" element={<StudiosPage />} />
        <Route path="categories" element={<PackageCategoriesPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="transactions" element={<OfflineTransactionsPage />} />
        <Route path="logs" element={<BookingLogsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
      </Routes>
    </ModernLayout>
  );
};

export default StudioManagement;
