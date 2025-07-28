
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
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </JWTAuthProvider>
  </QueryClientProvider>
)

export default App
