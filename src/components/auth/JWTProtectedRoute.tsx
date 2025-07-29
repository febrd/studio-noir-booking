
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface JWTProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'admin' | 'keuangan' | 'pelanggan')[];
}

export const JWTProtectedRoute = ({ children, allowedRoles = ['owner', 'admin', 'keuangan'] }: JWTProtectedRouteProps) => {
  const { userProfile, loading, isAuthenticated } = useJWTAuth();

  console.log('JWTProtectedRoute - User Profile:', userProfile);
  console.log('JWTProtectedRoute - Loading:', loading);
  console.log('JWTProtectedRoute - Is Authenticated:', isAuthenticated);
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
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(userProfile.role)) {
    console.log('JWTProtectedRoute - Role not allowed:', userProfile.role, 'Allowed:', allowedRoles);
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
