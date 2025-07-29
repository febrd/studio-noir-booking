
import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import Index from "./pages/Index"
import StudiosPage from "./pages/studio/StudiosPage"
import StudioPackagesPage from "./pages/studio/StudioPackagesPage"
import BookingsPage from "./pages/studio/BookingsPage"
import CustomOrdersPage from "./pages/studio/CustomOrdersPage"
import AdditionalServicesPage from "./pages/studio/AdditionalServicesPage"
import JWTAuth from "./pages/auth/JWTAuth"
import JWTDashboard from "./pages/dashboard/JWTDashboard"
import UsersPage from "./pages/admin/UsersPage"
import Expenses from "./pages/admin/Expenses"
import WalkinBookings from "./pages/studio/WalkinBookings"
import MonthlyTargets from "./pages/admin/MonthlyTargets"
import "./App.css"
import { JWTAuthProvider } from "./hooks/useJWTAuth"
import PackageCategories from "./pages/studio/PackageCategories"
import Customers from "./pages/admin/Customers"
import PaymentProviders from "./pages/admin/PaymentProviders"
import RecapsPage from "./pages/recaps/RecapsPage"
import BookingSelectionPage from "./pages/customer/BookingSelectionPage"
import SelfPhotoPackagesPage from "./pages/customer/SelfPhotoPackagesPage"
import RegularPackagesPage from "./pages/customer/RegularPackagesPage"
import OrderHistoryPage from "./pages/customer/OrderHistoryPage"
import SelfPhotoCheckoutPage from "./pages/customer/SelfPhotoCheckoutPage"
import RegularCheckoutPage from "./pages/customer/RegularCheckoutPage"

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
            
            {/* Customer Routes */}
            <Route path="/customer/booking-selection" element={<BookingSelectionPage />} />
            <Route path="/customer/self-photo-packages" element={<SelfPhotoPackagesPage />} />
            <Route path="/customer/regular-packages" element={<RegularPackagesPage />} />
            <Route path="/customer/order-history" element={<OrderHistoryPage />} />
            <Route path="/customer/self-photo-checkout" element={<SelfPhotoCheckoutPage />} />
            <Route path="/customer/regular-checkout" element={<RegularCheckoutPage />} />
            
            {/* Studio Management Routes */}
            <Route path="/studios" element={<StudiosPage />} />
            <Route path="/studio-packages" element={<StudioPackagesPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/walkin-bookings" element={<WalkinBookings />} />
            <Route path="/custom-orders" element={<CustomOrdersPage />} />
            <Route path="/additional-services" element={<AdditionalServicesPage />} />
            <Route path="/package-categories" element={<PackageCategories />} />
            
            {/* Admin Routes */}
            <Route path="/users" element={<UsersPage />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/monthly-targets" element={<MonthlyTargets />} />
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
