
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'admin' | 'keuangan' | 'pelanggan')[];
}

export const ProtectedRoute = ({ children, allowedRoles = ['owner', 'admin', 'keuangan'] }: ProtectedRouteProps) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(userProfile.role as any)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
