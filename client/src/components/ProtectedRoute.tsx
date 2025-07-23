import { ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService, User } from "@/lib/auth";
import LoadingEye from '@/components/ui/LoadingEye';
import { useNavigate } from "@tanstack/react-router";

interface ProtectedRouteProps {
  children: (user: User) => ReactNode;
  requiredRole?: 'doctor' | 'receptionist' | 'admin' | 'master_admin' | 'sub_admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If not authenticated, redirect to login
  if (!authService.isAuthenticated()) {
    useEffect(() => {
      navigate({ to: '/login', replace: true });
    }, [navigate]);
    return null;
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
    console.log('ProtectedRoute: Error or no user data, logging out', { error, hasData: !!data, hasUser: !!data?.user });
    
    // Only logout if it's a clear authentication error, not a network error
    if (error && error.message && (
      error.message.includes('401') || 
      error.message.includes('403') || 
      error.message.includes('No auth token') ||
      error.message.includes('Failed to get current user')
    )) {
      authService.logout();
      useEffect(() => {
        navigate({ to: '/login', replace: true });
      }, [navigate]);
      return null;
    }
    
    // For other errors, just show loading state and retry
    console.log('ProtectedRoute: Non-auth error, not logging out');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingEye size={32} className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
