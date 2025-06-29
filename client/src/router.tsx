import React from 'react'
import { createRouter, createRoute, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Toaster } from '@/components/ui/toaster'

// Pages
import LoginPage from './pages/LoginPage'

// Receptionist Pages
import ReceptionistDashboard from '@/pages/ReceptionistDashboard'
import PatientsPage from '@/pages/receptionist/Patients'
import AppointmentsPage from '@/pages/receptionist/Appointments'
import PaymentsPage from '@/pages/receptionist/Payments'

// Doctor Pages
import DoctorDashboard from '@/pages/DoctorDashboard'
import DoctorAppointmentsPage from '@/pages/doctor/appointments'
import DoctorPatientsPage from '@/pages/doctor/patients'
import DoctorPrescriptionsPage from '@/pages/doctor/prescriptions'
import DoctorAvailabilityPage from '@/pages/doctor/availability'
import DoctorLayout from '@/components/DoctorLayout'

// Root Route
const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <div>
        <Outlet />
        <Toaster />
      </div>
    </QueryClientProvider>
  ),
})

// Login Route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

// Doctor Layout Route
const doctorLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/doctor',
  component: DoctorLayout,
})

// Doctor Dashboard Route
const doctorDashboardRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: '/dashboard',
  component: DoctorDashboard,
})

// Doctor Appointments Route
const doctorAppointmentsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: '/appointments',
  component: DoctorAppointmentsPage,
})

// Doctor Patients Route
const doctorPatientsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: '/patients',
  component: DoctorPatientsPage,
})

// Doctor Prescriptions Route
const doctorPrescriptionsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: '/prescriptions',
  component: DoctorPrescriptionsPage,
})

// Doctor Availability Route
const doctorAvailabilityRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: '/availability',
  component: DoctorAvailabilityPage,
})

// Doctor Index Route (redirect to dashboard)
const doctorIndexRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: '/',
  component: () => {
    const navigate = useNavigate()
    React.useEffect(() => {
      navigate({ to: '/doctor/dashboard', replace: true })
    }, [navigate])
    return null
  },
})

// Receptionist Dashboard Route
const receptionistDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receptionist/dashboard',
  component: ReceptionistDashboard,
})

// Receptionist Patients Route
const receptionistPatientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receptionist/patients',
  component: PatientsPage,
})

// Receptionist Appointments Route
const receptionistAppointmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receptionist/appointments',
  component: AppointmentsPage,
})

// Receptionist Payments Route
const receptionistPaymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receptionist/payments',
  component: PaymentsPage,
})

// Receptionist Index Route (redirect to dashboard)
const receptionistIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receptionist',
  component: () => {
    const navigate = useNavigate()
    React.useEffect(() => {
      navigate({ to: '/receptionist/dashboard', replace: true })
    }, [navigate])
    return null
  },
})

// Root Index Route (redirect to login)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const navigate = useNavigate()
    React.useEffect(() => {
      navigate({ to: '/login', replace: true })
    }, [navigate])
    return null
  },
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  doctorLayoutRoute.addChildren([
    doctorDashboardRoute,
    doctorAppointmentsRoute,
    doctorPatientsRoute,
    doctorPrescriptionsRoute,
    doctorAvailabilityRoute,
    doctorIndexRoute,
  ]),
  receptionistDashboardRoute,
  receptionistPatientsRoute,
  receptionistAppointmentsRoute,
  receptionistPaymentsRoute,
  receptionistIndexRoute,
  indexRoute,
])

// Create the router
export const router = createRouter({ routeTree })

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 