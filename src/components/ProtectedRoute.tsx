import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute component that handles authentication status 
 * and redirects accordingly
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, currentUser, isAdmin } = useAuth();
  const location = useLocation();

  // Wait for auth to be determined
  if (currentUser === undefined) {
    return <Loading text="Checking authentication..." />;
  }

  // If we require authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we require admin and user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If we don't require authentication and user is authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
