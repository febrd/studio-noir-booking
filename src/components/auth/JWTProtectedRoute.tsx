
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface JWTProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'admin' | 'keuangan' | 'pelanggan')[];
}

export const JWTProtectedRoute = ({ children, allowedRoles = ['owner', 'admin', 'keuangan'] }: JWTProtectedRouteProps) => {
  const { userProfile, loading, isAuthenticated } = useJWTAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !userProfile) {
    return <Navigate to="/jwt-auth" replace />;
  }

  if (!allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
