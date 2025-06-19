import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';

// Pages
import LoginPage from './pages/LoginPage';
import ReceptionistDashboard from '@/pages/ReceptionistDashboard';
import PatientsPage from '@/pages/receptionist/Patients';
import AppointmentsPage from '@/pages/receptionist/Appointments';
import PaymentsPage from '@/pages/receptionist/Payments';
import DoctorDashboard from '@/pages/DoctorDashboard';
import DoctorAppointmentsPage from '@/pages/doctor/appointments';
import DoctorPatientsPage from '@/pages/doctor/patients';
import DoctorPrescriptionsPage from '@/pages/doctor/prescriptions';
import DoctorAvailabilityPage from '@/pages/doctor/availability';

// Layouts
import DoctorLayout from '@/components/DoctorLayout';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Doctor Routes */}
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorAppointmentsPage />} />
            <Route path="patients" element={<DoctorPatientsPage />} />
            <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
            <Route path="availability" element={<DoctorAvailabilityPage />} />
          </Route>

          {/* Receptionist Routes */}
          <Route path="/receptionist">
            <Route index element={<Navigate to="/receptionist/dashboard" replace />} />
            <Route path="dashboard" element={<ReceptionistDashboard />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
          </Route>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
