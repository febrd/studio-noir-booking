
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { JWTAuthProvider } from "@/hooks/useJWTAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { JWTProtectedRoute } from "@/components/auth/JWTProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import JWTAuth from "./pages/JWTAuth";
import JWTDashboard from "./pages/JWTDashboard";
import Unauthorized from "./pages/Unauthorized";
import PaymentGateway from "./pages/PaymentGateway";
import Users from "./pages/admin/Users";
import PaymentProviders from "./pages/admin/PaymentProviders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <JWTAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/jwt-auth" element={<JWTAuth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* JWT Protected Routes */}
              <Route 
                path="/jwt-dashboard" 
                element={
                  <JWTProtectedRoute allowedRoles={['owner', 'admin', 'keuangan', 'pelanggan']}>
                    <JWTDashboard />
                  </JWTProtectedRoute>
                } 
              />
              <Route 
                path="/jwt-admin/users" 
                element={
                  <JWTProtectedRoute allowedRoles={['owner', 'admin']}>
                    <Users />
                  </JWTProtectedRoute>
                } 
              />
              
              {/* Protected Routes with Supabase Auth */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/payment-gateway/*" 
                element={
                  <ProtectedRoute>
                    <PaymentGateway />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <Users />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </JWTAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
