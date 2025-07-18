
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JWTAuthProvider } from "@/hooks/useJWTAuth";
import { JWTProtectedRoute } from "@/components/auth/JWTProtectedRoute";
import JWTAuth from "./pages/JWTAuth";
import JWTDashboard from "./pages/JWTDashboard";
import Unauthorized from "./pages/Unauthorized";
import PaymentGateway from "./pages/PaymentGateway";
import Users from "./pages/admin/Users";
import PaymentProviders from "./pages/admin/PaymentProviders";
import StudioManagement from "./pages/studio/StudioManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <JWTAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<JWTAuth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Main Dashboard - Default Route */}
              <Route 
                path="/" 
                element={
                  <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan', 'pelanggan']}>
                    <JWTDashboard />
                  </JWTProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin/users" 
                element={
                  <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                    <Users />
                  </JWTProtectedRoute>
                } 
              />
              
              {/* Payment Gateway Routes */}
              <Route 
                path="/payment-gateway/*" 
                element={
                  <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                    <PaymentGateway />
                  </JWTProtectedRoute>
                } 
              />
              
              {/* Payment Providers */}
              <Route 
                path="/admin/payment-providers" 
                element={
                  <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan']}>
                    <PaymentProviders />
                  </JWTProtectedRoute>
                } 
              />
              
              {/* Studio Management Routes */}
              <Route 
                path="/studio/*" 
                element={
                  <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                    <StudioManagement />
                  </JWTProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </JWTAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
