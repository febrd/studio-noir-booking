
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

  console.log('ProtectedRoute - User Profile:', userProfile);
  console.log('ProtectedRoute - Current Path:', location.pathname);
  console.log('ProtectedRoute - Allowed Roles:', allowedRoles);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    console.log('ProtectedRoute - No user profile, redirecting to auth');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(userProfile.role as any)) {
    console.log('ProtectedRoute - Role not allowed:', userProfile.role, 'Allowed:', allowedRoles);
    
    // If user is pelanggan but route doesn't allow pelanggan, redirect to customer dashboard
    if (userProfile.role === 'pelanggan') {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute - Access granted for role:', userProfile.role);
  return <>{children}</>;
};
