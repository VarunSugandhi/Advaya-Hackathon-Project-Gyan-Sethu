
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: 'student' | 'educator';
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // If still loading, return a loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-edu-purple animate-spin" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required and profile is loaded but doesn't match required role
  if (requiredRole && profile && profile.role !== requiredRole) {
    return <Navigate to={profile.role === 'student' ? '/student/dashboard' : '/educator/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
