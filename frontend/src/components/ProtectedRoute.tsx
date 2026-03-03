//frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  // If allowed roles are specified, check if user's role is included
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's actual role
    if (user.role === 'brand') {
      return <Navigate to="/brand/dashboard" replace />;
    } else if (user.role === 'influencer') {
      return <Navigate to="/influencer/dashboard" replace />;
    } else {
      // For any other role or if role is undefined, redirect to main dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
