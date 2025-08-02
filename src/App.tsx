
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from './pages/Index';
import Auth from './pages/Auth';
import JWTDashboard from './pages/JWTDashboard';
import Users from './pages/admin/Users';
import ExpensesPage from './pages/expenses/ExpensesPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import RecapsPage from './pages/recaps/RecapsPage';
import TransactionReports from './pages/transactions/TransactionReports';
import OnlineBookingsReport from './pages/transactions/OnlineBookingsReport';
import OfflineBookingsReport from './pages/transactions/OfflineBookingsReport';
import Customers from './pages/admin/Customers';
import StudioManagement from './pages/studio/StudioManagement';
import PaymentGateway from './pages/PaymentGateway';
import PaymentProviders from './pages/admin/PaymentProviders';
import { JWTProtectedRoute } from './components/auth/JWTProtectedRoute';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import { JWTAuthProvider } from './hooks/useJWTAuth';

// Customer pages
import BookingSelectionPage from './pages/customer/BookingSelectionPage';
import RegularPackagesPage from './pages/customer/RegularPackagesPage';
import SelfPhotoPackagesPage from './pages/customer/SelfPhotoPackagesPage';
import RegularSchedulePage from './pages/customer/RegularSchedulePage';
import SelfPhotoSchedulePage from './pages/customer/SelfPhotoSchedulePage';
import RegularCheckoutPage from './pages/customer/RegularCheckoutPage';
import SelfPhotoCheckoutPage from './pages/customer/SelfPhotoCheckoutPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import EditProfilePage from '@/pages/customer/EditProfilePage';

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
              
              {/* Dashboard - Allow all authenticated users */}
              <Route path="/dashboard" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan', 'pelanggan']}>
                  <JWTDashboard />
                </JWTProtectedRoute>
              } />

              {/* Studio Management Routes */}
              <Route path="/studio/*" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />

              {/* Direct studio routes for backward compatibility */}
              <Route path="/studios" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />
              <Route path="/packages" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />
              <Route path="/services" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />
              <Route path="/bookings" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />
              <Route path="/walkin-sessions" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />
              <Route path="/custom-orders" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />
              <Route path="/booking-logs" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/users" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Users />
                </JWTProtectedRoute>
              } />
              <Route path="/admin/customers" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <Customers />
                </JWTProtectedRoute>
              } />
              <Route path="/admin/payment-providers" element={
                <JWTProtectedRoute allowedRoles={['owner']}>
                  <PaymentProviders />
                </JWTProtectedRoute>
              } />

              {/* Transaction Routes */}
              <Route path="/transactions" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <TransactionsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/transactions/reports" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <TransactionReports />
                </JWTProtectedRoute>
              } />
              <Route path="/transactions/online-bookings" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <OnlineBookingsReport />
                </JWTProtectedRoute>
              } />
              <Route path="/transactions/offline-bookings" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <OfflineBookingsReport />
                </JWTProtectedRoute>
              } />

              {/* Expenses */}
              <Route path="/expenses" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <ExpensesPage />
                </JWTProtectedRoute>
              } />

              {/* Reports & Recaps */}
              <Route path="/recaps" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <RecapsPage />
                </JWTProtectedRoute>
              } />

              {/* Customer Routes */}
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
              <Route path="/customer/profile" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <EditProfilePage />
                </JWTProtectedRoute>
              } />
              {/* Other Routes */}
              <Route path="/payment-gateway" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <PaymentGateway />
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
