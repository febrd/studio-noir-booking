
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import JWTAuth from "./pages/JWTAuth";
import JWTDashboard from "./pages/JWTDashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import RecapsPage from "./pages/recaps/RecapsPage";
import PaymentGateway from "./pages/PaymentGateway";
import StudioManagement from "./pages/studio/StudioManagement";
import Users from "./pages/admin/Users";
import Customers from "./pages/admin/Customers";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { JWTProtectedRoute } from "./components/auth/JWTProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/jwt-auth" element={<JWTAuth />} />
          <Route path="/jwt-dashboard" element={
            <JWTProtectedRoute>
              <JWTDashboard />
            </JWTProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <JWTProtectedRoute>
              <Users />
            </JWTProtectedRoute>
          } />
          <Route path="/admin/customers" element={
            <JWTProtectedRoute>
              <Customers />
            </JWTProtectedRoute>
          } />
          <Route path="/studio/*" element={
            <JWTProtectedRoute>
              <StudioManagement />
            </JWTProtectedRoute>
          } />
          <Route path="/transactions/*" element={
            <JWTProtectedRoute>
              <TransactionsPage />
            </JWTProtectedRoute>
          } />
          <Route path="/recaps" element={
            <JWTProtectedRoute>
              <RecapsPage />
            </JWTProtectedRoute>
          } />
          <Route path="/payment-gateway" element={
            <JWTProtectedRoute>
              <PaymentGateway />
            </JWTProtectedRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
