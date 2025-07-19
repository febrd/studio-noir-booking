
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { SidebarProvider } from '@/components/ui/sidebar';
import { JWTAuthProvider } from './hooks/useJWTAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { JWTProtectedRoute } from './components/auth/JWTProtectedRoute';

// Layout Components
import { ModernLayout } from './components/Layout/ModernLayout';
import { AdminLayout } from './pages/admin/Layout';

// Pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import JWTAuth from './pages/JWTAuth';
import JWTDashboard from './pages/JWTDashboard';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// Admin Pages
import Users from './pages/admin/Users';
import Customers from './pages/admin/Customers';
import PaymentProviders from './pages/admin/PaymentProviders';

// Studio Pages  
import StudioDashboard from './pages/studio/StudioDashboard';
import StudiosPage from './pages/studio/StudiosPage';
import PackagesPage from './pages/studio/PackagesPage';
import PackageCategoriesPage from './pages/studio/PackageCategoriesPage';
import ServicesPage from './pages/studio/ServicesPage';
import BookingsPage from './pages/studio/BookingsPage';
import WalkinSessionsPage from './pages/studio/WalkinSessionsPage';
import BookingLogsPage from './pages/studio/BookingLogsPage';
import OfflineTransactionsPage from './pages/studio/OfflineTransactionsPage';
import StudioManagement from './pages/studio/StudioManagement';

// Recaps Pages
import RecapsPage from './pages/recaps/RecapsPage';

// Transaction Pages
import TransactionsPage from './pages/transactions/TransactionsPage';
import TransactionReports from './pages/transactions/TransactionReports';
import OnlineBookingsReport from './pages/transactions/OnlineBookingsReport';
import OfflineBookingsReport from './pages/transactions/OfflineBookingsReport';

// Payment Gateway
import PaymentGateway from './pages/PaymentGateway';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <JWTAuthProvider>
          <SidebarProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <Routes>
                  {/* Public routes */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/jwt-auth" element={<JWTAuth />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  {/* Protected routes with ModernLayout */}
                  <Route path="/" element={
                    <JWTProtectedRoute>
                      <ModernLayout>
                        <JWTDashboard />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />

                  {/* Studio routes */}
                  <Route path="/studio" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <StudioDashboard />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/studios" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <StudiosPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/packages" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <PackagesPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/package-categories" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <PackageCategoriesPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/services" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <ServicesPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/bookings" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <BookingsPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/walkin-sessions" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <WalkinSessionsPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/booking-logs" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <BookingLogsPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/offline-transactions" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <OfflineTransactionsPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/studio/management" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <StudioManagement />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />

                  {/* Recaps routes */}
                  <Route path="/recaps" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                      <ModernLayout>
                        <RecapsPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />

                  {/* Transaction routes */}
                  <Route path="/transactions" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                      <ModernLayout>
                        <TransactionsPage />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/transactions/reports" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                      <ModernLayout>
                        <TransactionReports />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/transactions/online-bookings" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                      <ModernLayout>
                        <OnlineBookingsReport />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/transactions/offline-bookings" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                      <ModernLayout>
                        <OfflineBookingsReport />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />

                  {/* Payment Gateway */}
                  <Route path="/payment-gateway" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <PaymentGateway />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />

                  {/* Admin routes now using ModernLayout instead of AdminLayout */}
                  <Route path="/admin" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <div className="p-6">
                          <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
                          <p>Welcome to the admin panel. Use the navigation to access different sections.</p>
                        </div>
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <Users />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/admin/customers" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <Customers />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />
                  <Route path="/admin/payment-providers" element={
                    <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                      <ModernLayout>
                        <PaymentProviders />
                      </ModernLayout>
                    </JWTProtectedRoute>
                  } />

                  {/* Fallback routes */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </div>
              <Toaster />
            </Router>
          </SidebarProvider>
        </JWTAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
