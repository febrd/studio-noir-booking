
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { JWTAuthProvider } from "./hooks/useJWTAuth"
import Index from "./pages/Index"
import JWTAuth from "./pages/JWTAuth"
import JWTDashboard from "./pages/JWTDashboard"
import NotFound from "./pages/NotFound"
import Unauthorized from "./pages/Unauthorized"
import ExpensesPage from "./pages/expenses/ExpensesPage"
import StudioManagement from "./pages/studio/StudioManagement"
import StudiosPage from "./pages/studio/StudiosPage"
import PackageCategoriesPage from "./pages/studio/PackageCategoriesPage"
import PackagesPage from "./pages/studio/PackagesPage"
import ServicesPage from "./pages/studio/ServicesPage"
import BookingsPage from "./pages/studio/BookingsPage"
import WalkinSessionsPage from "./pages/studio/WalkinSessionsPage"
import CustomOrdersPage from "./pages/studio/CustomOrdersPage"
import TransactionsPage from "./pages/transactions/TransactionsPage"
import TransactionReports from "./pages/transactions/TransactionReports"
import OnlineBookingsReport from "./pages/transactions/OnlineBookingsReport"
import OfflineBookingsReport from "./pages/transactions/OfflineBookingsReport"
import BookingLogsPage from "./pages/studio/BookingLogsPage"
import Users from "./pages/admin/Users"
import Customers from "./pages/admin/Customers"
import PaymentProviders from "./pages/admin/PaymentProviders"
import RecapsPage from "./pages/recaps/RecapsPage"
import BookingSelectionPage from "./pages/customer/BookingSelectionPage"
import SelfPhotoPackagesPage from "./pages/customer/SelfPhotoPackagesPage"
import RegularPackagesPage from "./pages/customer/RegularPackagesPage"
import OrderHistoryPage from "./pages/customer/OrderHistoryPage"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <JWTAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            
            {/* Studio Management Routes */}
            <Route path="/studios" element={<StudiosPage />} />
            <Route path="/categories" element={<PackageCategoriesPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/services" element={<ServicesPage />} />
            
            {/* Booking Routes */}
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/walkin-sessions" element={<WalkinSessionsPage />} />
            <Route path="/custom-orders" element={<CustomOrdersPage />} />
            <Route path="/booking-logs" element={<BookingLogsPage />} />
            
            {/* Transaction Routes */}
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/reports" element={<TransactionReports />} />
            <Route path="/transactions/online-bookings" element={<OnlineBookingsReport />} />
            <Route path="/transactions/offline-bookings" element={<OfflineBookingsReport />} />
            
            {/* Expenses Routes */}
            <Route path="/expenses" element={<ExpensesPage />} />
            
            {/* Reports Routes */}
            <Route path="/recaps" element={<RecapsPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/payment-providers" element={<PaymentProviders />} />
            
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </JWTAuthProvider>
  </QueryClientProvider>
)

export default App
