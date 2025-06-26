import { Outlet } from "react-router-dom";
import { authService, User as AuthUser } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";

export default function DoctorLayout() {
  return (
    <ProtectedRoute requiredRole="doctor">
      {(currentUser: AuthUser) => (
        <Layout user={currentUser}>
          <Outlet />
        </Layout>
      )}
    </ProtectedRoute>
  );
} 