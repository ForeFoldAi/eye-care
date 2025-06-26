import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import DoctorLayout from '@/components/DoctorLayout';

// Pages
import LoginPage from './pages/LoginPage';

// Receptionist Pages
import ReceptionistDashboard from '@/pages/ReceptionistDashboard';
import PatientsPage from '@/pages/receptionist/Patients';
import AppointmentsPage from '@/pages/receptionist/Appointments';
import PaymentsPage from '@/pages/receptionist/Payments';

// Doctor Pages
import DoctorDashboard from '@/pages/DoctorDashboard';
import DoctorAppointmentsPage from '@/pages/doctor/appointments';
import DoctorPatientsPage from '@/pages/doctor/patients';
import DoctorPrescriptionsPage from '@/pages/doctor/prescriptions';
import DoctorAvailabilityPage from '@/pages/doctor/availability';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Doctor Routes - now nested */}
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
            <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
            <Route path="/doctor/prescriptions" element={<DoctorPrescriptionsPage />} />
            <Route path="/doctor/availability" element={<DoctorAvailabilityPage />} />
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          </Route>

          {/* Receptionist Routes */}
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/patients" element={<PatientsPage />} />
          <Route path="/receptionist/appointments" element={<AppointmentsPage />} />
          <Route path="/receptionist/payments" element={<PaymentsPage />} />

          {/* Redirects for base paths */}
          <Route path="/receptionist" element={<Navigate to="/receptionist/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
