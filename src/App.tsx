import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient } from "@tanstack/react-query";
import { BookingSelectionPage } from "./pages/customer/BookingSelectionPage";
import { SelfPhotoPackagesPage } from "./pages/customer/SelfPhotoPackagesPage";
import { SelfPhotoSchedulePage } from "./pages/customer/SelfPhotoSchedulePage";
import { SelfPhotoCheckoutPage } from "./pages/customer/SelfPhotoCheckoutPage";
import { RegularPackagesPage } from "./pages/customer/RegularPackagesPage";
import { RegularSchedulePage } from "./pages/customer/RegularSchedulePage";
import { RegularCheckoutPage } from "./pages/customer/RegularCheckoutPage";
import { OrderHistoryPage } from "./pages/customer/OrderHistoryPage";

import { EditProfilePage } from '@/pages/customer/EditProfilePage';

function App() {
  return (
    <QueryClient>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Routes>
            {/* Customer routes */}
            <Route path="/customer/booking-selection" element={<BookingSelectionPage />} />
            <Route path="/customer/self-photo/packages" element={<SelfPhotoPackagesPage />} />
            <Route path="/customer/self-photo/schedule" element={<SelfPhotoSchedulePage />} />
            <Route path="/customer/self-photo/checkout" element={<SelfPhotoCheckoutPage />} />
            <Route path="/customer/regular/packages" element={<RegularPackagesPage />} />
            <Route path="/customer/regular/schedule" element={<RegularSchedulePage />} />
            <Route path="/customer/regular/checkout" element={<RegularCheckoutPage />} />
            <Route path="/customer/order-history" element={<OrderHistoryPage />} />
            <Route path="/customer/profile" element={<EditProfilePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;
