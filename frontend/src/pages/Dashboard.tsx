// frontend/src/pages/Dashboard.tsx
import React from "react";
import { useAuth } from "../useAuth";
import { Navigate } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Redirect to role-specific dashboard
  if (user?.role === 'brand') {
    return <Navigate to="/brand/dashboard" replace />;
  } else if (user?.role === 'influencer') {
    return <Navigate to="/influencer/dashboard" replace />;
  }

  // Fallback for users without a role (shouldn't happen in a properly authenticated session)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your account does not have a valid role assigned.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;