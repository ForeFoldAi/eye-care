import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService, type User } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import LoadingEye from '@/components/ui/LoadingEye';

interface ProtectedRouteProps {
  children: (user: User) => ReactNode;
  requiredRole?: 'doctor' | 'receptionist';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If not authenticated, redirect to login
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingEye size={32} className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    authService.logout();
    return <Navigate to="/login" replace />;
  }

  const user = data.user;

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied or Please Login Again</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
