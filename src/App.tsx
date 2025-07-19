
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { JWTAuthProvider } from '@/hooks/useJWTAuth';
import { JWTProtectedRoute } from '@/components/auth/JWTProtectedRoute';
import Index from './pages/Index';
import Auth from './pages/Auth';
import JWTDashboard from './pages/JWTDashboard';
import StudioDashboard from './pages/studio/StudioDashboard';
import StudiosPage from './pages/studio/StudiosPage';
import PackagesPage from './pages/studio/PackagesPage';
import PackageCategoriesPage from './pages/studio/PackageCategoriesPage';
import ServicesPage from './pages/studio/ServicesPage';
import BookingsPage from './pages/studio/BookingsPage';
import WalkinSessionsPage from './pages/studio/WalkinSessionsPage';
import BookingLogsPage from './pages/studio/BookingLogsPage';
import OfflineTransactionsPage from './pages/studio/OfflineTransactionsPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import TransactionReports from './pages/transactions/TransactionReports';
import OnlineBookingsReport from './pages/transactions/OnlineBookingsReport';
import OfflineBookingsReport from './pages/transactions/OfflineBookingsReport';
import RecapsPage from './pages/recaps/RecapsPage';
import Users from './pages/admin/Users';
import Customers from './pages/admin/Customers';
import PaymentProviders from './pages/admin/PaymentProviders';
import PaymentGateway from './pages/PaymentGateway';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JWTAuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/jwt-auth" element={<Auth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <JWTProtectedRoute>
                  <JWTDashboard />
                </JWTProtectedRoute>
              } />
              
              {/* Studio Management Routes */}
              <Route path="/studio" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudioDashboard />
                </JWTProtectedRoute>
              } />
              <Route path="/studio/studios" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <StudiosPage />
                </JWTProtectedRoute>
              } />
              <Route path="/studio/packages" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <PackagesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/studio/categories" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <PackageCategoriesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/studio/services" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <ServicesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/studio/bookings" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <BookingsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/studio/walkin-sessions" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <WalkinSessionsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/studio/booking-logs" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <BookingLogsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/studio/offline-transactions" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                  <OfflineTransactionsPage />
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
              
              {/* Recap Routes */}
              <Route path="/recaps" element={
                <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                  <RecapsPage />
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
              
             
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </JWTAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
