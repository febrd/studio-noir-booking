
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from './pages/Index';
import StudiosPage from './pages/studio/StudiosPage';
import PackagesPage from './pages/studio/PackagesPage';
import ServicesPage from './pages/studio/ServicesPage';
import Auth from './pages/Auth'; // Using Auth.tsx with captcha
import JWTDashboard from './pages/JWTDashboard';
import Users from './pages/admin/Users';
import ExpensesPage from './pages/expenses/ExpensesPage';
import WalkinSessionsPage from './pages/studio/WalkinSessionsPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import BookingsPage from './pages/studio/BookingsPage';
import PackageCategoriesPage from './pages/studio/PackageCategoriesPage';
import CustomOrdersPage from './pages/studio/CustomOrdersPage';
import BookingSelectionPage from './pages/customer/BookingSelectionPage';
import RegularPackagesPage from './pages/customer/RegularPackagesPage';
import SelfPhotoPackagesPage from './pages/customer/SelfPhotoPackagesPage';
import RegularSchedulePage from './pages/customer/RegularSchedulePage';
import SelfPhotoSchedulePage from './pages/customer/SelfPhotoSchedulePage';
import RegularCheckoutPage from './pages/customer/RegularCheckoutPage';
import SelfPhotoCheckoutPage from './pages/customer/SelfPhotoCheckoutPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import { JWTProtectedRoute } from './components/auth/JWTProtectedRoute';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import RecapsPage from './pages/recaps/RecapsPage';
import BookingLogsPage from './pages/studio/BookingLogsPage';
import TransactionReports from './pages/transactions/TransactionReports';
import OnlineBookingsReport from './pages/transactions/OnlineBookingsReport';
import OfflineBookingsReport from './pages/transactions/OfflineBookingsReport';
import OfflineTransactionsPage from './pages/studio/OfflineTransactionsPage';
import Customers from './pages/admin/Customers';
import StudioManagement from './pages/studio/StudioManagement';
import StudioDashboard from './pages/studio/StudioDashboard';
import PaymentGateway from './pages/PaymentGateway';
import PaymentProviders from './pages/admin/PaymentProviders';
import { JWTAuthProvider } from './hooks/useJWTAuth';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JWTAuthProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={
                <JWTProtectedRoute>
                  <JWTDashboard />
                </JWTProtectedRoute>
              } />
              <Route path="/studios" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudiosPage />
                </JWTProtectedRoute>
              } />
              <Route path="/packages" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <PackagesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/services" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <ServicesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/users" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Users />
                </JWTProtectedRoute>
              } />
              <Route path="/expenses" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <ExpensesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/walkin-sessions" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <WalkinSessionsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/transactions" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <TransactionsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/bookings" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <BookingsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/package-categories" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <PackageCategoriesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/custom-orders" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <CustomOrdersPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/booking-selection" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <BookingSelectionPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/regular-packages" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <RegularPackagesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/self-photo-packages" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <SelfPhotoPackagesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/regular-schedule" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <RegularSchedulePage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/self-photo-schedule" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <SelfPhotoSchedulePage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/regular-checkout" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <RegularCheckoutPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/self-photo-checkout" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <SelfPhotoCheckoutPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/order-history" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <OrderHistoryPage />
                </JWTProtectedRoute>
              } />
              <Route path="/recaps" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <RecapsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/booking-logs" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <BookingLogsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/transaction-reports" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <TransactionReports />
                </JWTProtectedRoute>
              } />
              <Route path="/online-bookings-report" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <OnlineBookingsReport />
                </JWTProtectedRoute>
              } />
              <Route path="/offline-bookings-report" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <OfflineBookingsReport />
                </JWTProtectedRoute>
              } />
              <Route path="/offline-transactions" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <OfflineTransactionsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customers" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Customers />
                </JWTProtectedRoute>
              } />
              <Route path="/studio-management" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />
              <Route path="/studio-dashboard" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioDashboard />
                </JWTProtectedRoute>
              } />
              <Route path="/payment-gateway" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <PaymentGateway />
                </JWTProtectedRoute>
              } />
              <Route path="/payment-providers" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <PaymentProviders />
                </JWTProtectedRoute>
              } />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </TooltipProvider>
      </JWTAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
