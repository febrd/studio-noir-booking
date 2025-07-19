
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import JWTAuth from "./pages/JWTAuth";
import JWTDashboard from "./pages/JWTDashboard";
import { JWTProtectedRoute } from "./components/auth/JWTProtectedRoute";
import BookingSelectionPage from "./pages/customer/BookingSelectionPage";
import SelfPhotoPackagesPage from "./pages/customer/SelfPhotoPackagesPage";
import RegularPackagesPage from "./pages/customer/RegularPackagesPage";
import OrderHistoryPage from "./pages/customer/OrderHistoryPage";
import SelfPhotoCheckoutPage from "./pages/customer/SelfPhotoCheckoutPage";
import RegularCheckoutPage from "./pages/customer/RegularCheckoutPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<JWTAuth />} />
            <Route path="/auth" element={<JWTAuth />} />
            <Route path="/dashboard" element={
              <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan', 'pelanggan']}>
                <JWTDashboard />
              </JWTProtectedRoute>
            } />
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
    </QueryClientProvider>
  );
}

export default App;
