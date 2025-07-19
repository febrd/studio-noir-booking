
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JWTAuthProvider } from "./hooks/useJWTAuth";
import JWTAuth from "./pages/JWTAuth";
import JWTDashboard from "./pages/JWTDashboard";
import { JWTProtectedRoute } from "./components/auth/JWTProtectedRoute";
import BookingSelectionPage from "./pages/customer/BookingSelectionPage";
import SelfPhotoPackagesPage from "./pages/customer/SelfPhotoPackagesPage";
import RegularPackagesPage from "./pages/customer/RegularPackagesPage";
import OrderHistoryPage from "./pages/customer/OrderHistoryPage";
import SelfPhotoCheckoutPage from "./pages/customer/SelfPhotoCheckoutPage";
import RegularCheckoutPage from "./pages/customer/RegularCheckoutPage";
import StudioManagement from "./pages/studio/StudioManagement";
import StudiosPage from "./pages/studio/StudiosPage";
import PackageCategoriesPage from "./pages/studio/PackageCategoriesPage";
import PackagesPage from "./pages/studio/PackagesPage";
import ServicesPage from "./pages/studio/ServicesPage";
import BookingsPage from "./pages/studio/BookingsPage";
import OfflineTransactionsPage from "./pages/studio/OfflineTransactionsPage";
import BookingLogsPage from "./pages/studio/BookingLogsPage";
import WalkinSessionsPage from "./pages/studio/WalkinSessionsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import TransactionReports from "./pages/transactions/TransactionReports";
import OnlineBookingsReport from "./pages/transactions/OnlineBookingsReport";
import OfflineBookingsReport from "./pages/transactions/OfflineBookingsReport";
import RecapsPage from "./pages/recaps/RecapsPage";
import Users from "./pages/admin/Users";
import Customers from "./pages/admin/Customers";
import PaymentProviders from "./pages/admin/PaymentProviders";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JWTAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<JWTAuth />} />
              <Route path="/auth" element={<JWTAuth />} />
              <Route path="/jwt-auth" element={<JWTAuth />} />
              
              {/* Dashboard Route */}
              <Route path="/dashboard" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan', 'pelanggan']}>
                  <JWTDashboard />
                </JWTProtectedRoute>
              } />
              
              {/* Studio Management Routes */}
              <Route path="/studio/*" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <StudioManagement />
                </JWTProtectedRoute>
              } />
              
              {/* Direct Studio Routes */}
              <Route path="/studios" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <StudiosPage />
                </JWTProtectedRoute>
              } />
              <Route path="/categories" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <PackageCategoriesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/packages" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <PackagesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/services" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <ServicesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/bookings" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <BookingsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/walkin-sessions" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <WalkinSessionsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/booking-logs" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <BookingLogsPage />
                </JWTProtectedRoute>
              } />
              
              {/* Transaction Routes */}
              <Route path="/transactions" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                  <TransactionsPage />
                </JWTProtectedRoute>
              } />
              <Route path="/transactions/reports" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                  <TransactionReports />
                </JWTProtectedRoute>
              } />
              <Route path="/transactions/online-bookings" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                  <OnlineBookingsReport />
                </JWTProtectedRoute>
              } />
              <Route path="/transactions/offline-bookings" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                  <OfflineBookingsReport />
                </JWTProtectedRoute>
              } />
              
              {/* Recaps Routes */}
              <Route path="/recaps" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
                  <RecapsPage />
                </JWTProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/users" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Users />
                </JWTProtectedRoute>
              } />
              <Route path="/admin/customers" element={
                <JWTProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Customers />
                </JWTProtectedRoute>
              } />
              <Route path="/admin/payment-providers" element={
                <JWTProtectedRoute allowedRoles={['owner']}>
                  <PaymentProviders />
                </JWTProtectedRoute>
              } />
              
              {/* Customer Routes */}
              <Route path="/customer/booking-selection" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <BookingSelectionPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/self-photo-packages" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <SelfPhotoPackagesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/regular-packages" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <RegularPackagesPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/order-history" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <OrderHistoryPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/self-photo-checkout" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <SelfPhotoCheckoutPage />
                </JWTProtectedRoute>
              } />
              <Route path="/customer/regular-checkout" element={
                <JWTProtectedRoute allowedRoles={['pelanggan']}>
                  <RegularCheckoutPage />
                </JWTProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </JWTAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
