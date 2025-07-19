
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JWTAuthProvider } from "./hooks/useJWTAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { JWTProtectedRoute } from "./components/auth/JWTProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import JWTAuth from "./pages/JWTAuth";
import JWTDashboard from "./pages/JWTDashboard";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import PaymentGateway from "./pages/PaymentGateway";

// Studio pages
import StudioDashboard from "./pages/studio/StudioDashboard";
import StudiosPage from "./pages/studio/StudiosPage";
import PackageCategoriesPage from "./pages/studio/PackageCategoriesPage";
import PackagesPage from "./pages/studio/PackagesPage";
import ServicesPage from "./pages/studio/ServicesPage";
import BookingsPage from "./pages/studio/BookingsPage";
import WalkinSessionsPage from "./pages/studio/WalkinSessionsPage";
import BookingLogsPage from "./pages/studio/BookingLogsPage";
import OfflineTransactionsPage from "./pages/studio/OfflineTransactionsPage";

// Transaction pages
import TransactionsPage from "./pages/transactions/TransactionsPage";
import TransactionReports from "./pages/transactions/TransactionReports";
import OnlineBookingsReport from "./pages/transactions/OnlineBookingsReport";
import OfflineBookingsReport from "./pages/transactions/OfflineBookingsReport";

// Admin pages
import { AdminLayout } from "./pages/admin/Layout";
import Users from "./pages/admin/Users";
import Customers from "./pages/admin/Customers";
import PaymentProviders from "./pages/admin/PaymentProviders";

// Recaps
import RecapsPage from "./pages/recaps/RecapsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JWTAuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/jwt-auth" element={<JWTAuth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/payment-gateway" element={<PaymentGateway />} />
              
              {/* JWT Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan', 'pelanggan']}>
                    <JWTDashboard />
                  </JWTProtectedRoute>
                } 
              />

              {/* Studio Management Routes */}
              <Route 
                path="/studio/dashboard" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <StudioDashboard />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/studio/studios" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <StudiosPage />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/studio/package-categories" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <PackageCategoriesPage />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/studio/packages" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <PackagesPage />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/studio/services" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <ServicesPage />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/studio/bookings" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                    <BookingsPage />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/studio/walkin-sessions" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                    <WalkinSessionsPage />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/studio/booking-logs" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <BookingLogsPage />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/studio/offline-transactions" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                    <OfflineTransactionsPage />
                  </JWTProtectedRoute>
                } 
              />

              {/* Transaction Routes */}
              <Route 
                path="/transactions" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                    <TransactionsPage />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/transactions/reports" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                    <TransactionReports />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/transactions/online-bookings" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                    <OnlineBookingsReport />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/transactions/offline-bookings" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                    <OfflineBookingsReport />
                  </JWTProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayout />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <Users />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/admin/customers" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <Customers />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/admin/payment-providers" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                    <PaymentProviders />
                  </JWTProtectedRoute>
                } 
              />

              {/* Recaps */}
              <Route 
                path="/recaps" 
                element={
                  <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                    <RecapsPage />
                  </JWTProtectedRoute>
                } 
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </JWTAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
