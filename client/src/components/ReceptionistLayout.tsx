import { Outlet } from "@tanstack/react-router";
import { authService, type User as AuthUser } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";

export default function ReceptionistLayout() {
  return (
    <ProtectedRoute requiredRole="receptionist">
      {(currentUser: AuthUser) => (
        <Layout user={currentUser}>
          <Outlet />
        </Layout>
      )}
    </ProtectedRoute>
  );
} 