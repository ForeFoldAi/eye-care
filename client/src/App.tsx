import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/protected-route";
import { ROLES } from "@/lib/constants";
import NotFound from "@/pages/not-found";

// Auth pages
import Login from "@/pages/auth/login";

// Doctor pages
import DoctorDashboard from "@/pages/doctor/dashboard";
import DoctorAppointments from "@/pages/doctor/appointments";
import DoctorPatients from "@/pages/doctor/patients";
import DoctorPrescriptions from "@/pages/doctor/prescriptions";
import DoctorAvailability from "@/pages/doctor/availability";

// Receptionist pages
import ReceptionistDashboard from "@/pages/receptionist/dashboard";
import ReceptionistPatients from "@/pages/receptionist/patients";
import ReceptionistAppointments from "@/pages/receptionist/appointments";
import ReceptionistPayments from "@/pages/receptionist/payments";

// Other pages
import Unauthorized from "@/pages/unauthorized";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/unauthorized" component={Unauthorized} />

      {/* Doctor routes */}
      <Route path="/doctor">
        <ProtectedRoute requiredRole={ROLES.DOCTOR}>
          <DoctorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/appointments">
        <ProtectedRoute requiredRole={ROLES.DOCTOR}>
          <DoctorAppointments />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/patients">
        <ProtectedRoute requiredRole={ROLES.DOCTOR}>
          <DoctorPatients />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/prescriptions">
        <ProtectedRoute requiredRole={ROLES.DOCTOR}>
          <DoctorPrescriptions />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/availability">
        <ProtectedRoute requiredRole={ROLES.DOCTOR}>
          <DoctorAvailability />
        </ProtectedRoute>
      </Route>

      {/* Receptionist routes */}
      <Route path="/receptionist">
        <ProtectedRoute requiredRole={ROLES.RECEPTIONIST}>
          <ReceptionistDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/receptionist/patients">
        <ProtectedRoute requiredRole={ROLES.RECEPTIONIST}>
          <ReceptionistPatients />
        </ProtectedRoute>
      </Route>
      <Route path="/receptionist/appointments">
        <ProtectedRoute requiredRole={ROLES.RECEPTIONIST}>
          <ReceptionistAppointments />
        </ProtectedRoute>
      </Route>
      <Route path="/receptionist/payments">
        <ProtectedRoute requiredRole={ROLES.RECEPTIONIST}>
          <ReceptionistPayments />
        </ProtectedRoute>
      </Route>

      {/* Default redirects */}
      <Route path="/">
        <Login />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <DoctorDashboard />
        </ProtectedRoute>
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
