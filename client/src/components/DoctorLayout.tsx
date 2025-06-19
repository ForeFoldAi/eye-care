import { Outlet } from 'react-router-dom';
import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';
import { type User as AuthUser } from '@/lib/auth';

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