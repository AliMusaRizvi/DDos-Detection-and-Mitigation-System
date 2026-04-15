import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

export default function ProtectedRoute({ requireRole }: { requireRole?: 'admin' | 'user' }) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading || (user && requireRole && !role)) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page, preserving the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Handle role-specific access protection
  if (requireRole && role !== requireRole) {
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/user" replace />;
    }
  }

  return <Outlet />;
}
