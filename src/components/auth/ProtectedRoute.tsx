
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'admin' | 'keuangan' | 'pelanggan')[];
}

export const ProtectedRoute = ({ children, allowedRoles = ['owner', 'admin', 'keuangan'] }: ProtectedRouteProps) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(userProfile.role as any)) {
    
    // If user is pelanggan but route doesn't allow pelanggan, redirect to customer dashboard
    if (userProfile.role === 'pelanggan') {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
