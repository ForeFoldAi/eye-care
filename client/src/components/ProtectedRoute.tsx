import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService, User } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: (user: User) => ReactNode;
  requiredRole?: 'doctor' | 'receptionist';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: authService.isAuthenticated(),
  });

  // If not authenticated, redirect to login
  if (!authService.isAuthenticated()) {
    window.location.href = '/';
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-medical-blue-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    authService.logout();
    window.location.href = '/';
    return null;
  }

  const user = data.user;

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
