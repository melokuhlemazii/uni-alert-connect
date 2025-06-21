import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, userData, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-6 space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If allowedRoles is set, check user role
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    // Redirect to role-based landing if not allowed
    return <Navigate to="/" replace />;
  }

  // If authenticated and allowed, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
