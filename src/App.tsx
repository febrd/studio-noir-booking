
import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import Index from "./pages/Index"
import StudiosPage from "./pages/studio/StudiosPage"
import PackagesPage from "./pages/studio/PackagesPage"
import BookingsPage from "./pages/studio/BookingsPage"
import CustomOrdersPage from "./pages/studio/CustomOrdersPage"
import ServicesPage from "./pages/studio/ServicesPage"
import JWTAuth from "./pages/JWTAuth"
import JWTDashboard from "./pages/JWTDashboard"
import UsersPage from "./pages/admin/Users"
import ExpensesPage from "./pages/expenses/ExpensesPage"
import WalkinSessionsPage from "./pages/studio/WalkinSessionsPage"
import "./App.css"
import { JWTAuthProvider } from "./hooks/useJWTAuth"
import PackageCategoriesPage from "./pages/studio/PackageCategoriesPage"
import Customers from "./pages/admin/Customers"
import PaymentProviders from "./pages/admin/PaymentProviders"
import RecapsPage from "./pages/recaps/RecapsPage"
import BookingSelectionPage from "./pages/customer/BookingSelectionPage"
import SelfPhotoPackagesPage from "./pages/customer/SelfPhotoPackagesPage"
import RegularPackagesPage from "./pages/customer/RegularPackagesPage"
import OrderHistoryPage from "./pages/customer/OrderHistoryPage"
import SelfPhotoCheckoutPage from "./pages/customer/SelfPhotoCheckoutPage"
import RegularCheckoutPage from "./pages/customer/RegularCheckoutPage"
import { JWTProtectedRoute } from "./components/auth/JWTProtectedRoute"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JWTAuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<JWTAuth />} />
            <Route path="/dashboard/*" element={<JWTDashboard />} />
            <Route path="/dashboard" element={<JWTDashboard />} />
            
            {/* Customer Routes - Protected for pelanggan only */}
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
            
            {/* Studio Management Routes */}
            <Route path="/studios" element={<StudiosPage />} />
            <Route path="/studio-packages" element={<PackagesPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/walkin-sessions" element={<WalkinSessionsPage />} />
            <Route path="/custom-orders" element={<CustomOrdersPage />} />
            <Route path="/additional-services" element={<ServicesPage />} />
            <Route path="/package-categories" element={<PackageCategoriesPage />} />
            
            {/* Admin Routes */}
            <Route path="/users" element={<UsersPage />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/payment-providers" element={<PaymentProviders />} />
            <Route path="/recaps" element={<RecapsPage />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </JWTAuthProvider>
    </QueryClientProvider>
  )
}

export default App
