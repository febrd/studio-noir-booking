
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface JWTProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'admin' | 'keuangan' | 'pelanggan')[];
}

export const JWTProtectedRoute = ({ children, allowedRoles = ['owner', 'admin', 'keuangan'] }: JWTProtectedRouteProps) => {
  const { userProfile, loading, isAuthenticated } = useJWTAuth();
  const location = useLocation();

  console.log('JWTProtectedRoute - User Profile:', userProfile);
  console.log('JWTProtectedRoute - Loading:', loading);
  console.log('JWTProtectedRoute - Is Authenticated:', isAuthenticated);
  console.log('JWTProtectedRoute - Current Path:', location.pathname);
  console.log('JWTProtectedRoute - Allowed Roles:', allowedRoles);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !userProfile) {
    console.log('JWTProtectedRoute - Redirecting to auth - not authenticated');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Check if user is active
  if (userProfile.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Account Deactivated</h2>
          <p className="text-muted-foreground">Your account has been deactivated. Please contact administrator.</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(userProfile.role)) {
    console.log('JWTProtectedRoute - Role not allowed:', userProfile.role, 'Allowed:', allowedRoles);
    
    // If user is pelanggan but route doesn't allow pelanggan, redirect to customer dashboard
    if (userProfile.role === 'pelanggan') {
      return <Navigate to="/dashboard" replace />;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  console.log('JWTProtectedRoute - Access granted for role:', userProfile.role);
  return <>{children}</>;
};
