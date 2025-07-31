import React from 'react'
import { createRouter, createRoute, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/toaster'
import { DepartmentProvider } from '@/contexts/DepartmentContext'
import { StaffProvider } from '@/contexts/StaffContext'
import { ShiftProvider } from '@/contexts/ShiftContext'

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
import ReceptionistLayout from '@/components/ReceptionistLayout'

// Admin Pages
import MasterAdminDashboard from '@/pages/master-admin/Dashboard'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminAnalytics from '@/pages/admin/Analytics'
import AdminStaffManagement from '@/pages/admin/StaffManagement'
import AdminFinancialManagement from '@/pages/admin/FinancialManagement'
import AdminSystemConfiguration from '@/pages/admin/SystemConfiguration'
import AdminDepartmentManagement from '@/pages/admin/DepartmentManagement'
import AdminAuditCompliance from '@/pages/admin/AuditCompliance'
import AdminBranchForm from '@/pages/admin/BranchForm'
import BranchManagement from '@/pages/admin/BranchManagement'
import AdminDoctorAvailability from '@/pages/admin/DoctorAvailability'
import AdminLayout from '@/components/AdminLayout'
import SubAdminDashboard from '@/pages/sub-admin/Dashboard'
import SubAdminLayout from '@/components/SubAdminLayout'
import StaffManagement from '@/pages/sub-admin/StaffManagement'
import DepartmentManagement from '@/pages/sub-admin/DepartmentManagement'
import SubAdminDoctorAvailability from '@/pages/sub-admin/DoctorAvailability'
import Appointments from '@/pages/sub-admin/Appointments'
import Patients from '@/pages/sub-admin/Patients'
import TestPage from '@/pages/sub-admin/TestPage'
import Analytics from '@/pages/sub-admin/Analytics'
import SettingsPage from '@/pages/sub-admin/Settings'
import KnowledgeBasePage from './pages/master-admin/KnowledgeBase';

// Root Route
const rootRoute = createRootRoute({
  component: () => (
    <DepartmentProvider>
      <StaffProvider>
        <ShiftProvider>
          <div>
            <Outlet />
            <Toaster />
          </div>
        </ShiftProvider>
      </StaffProvider>
    </DepartmentProvider>
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

// Receptionist Layout Route
const receptionistLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receptionist',
  component: ReceptionistLayout,
})

// Receptionist Dashboard Route
const receptionistDashboardRoute = createRoute({
  getParentRoute: () => receptionistLayoutRoute,
  path: '/dashboard',
  component: ReceptionistDashboard,
})

// Receptionist Patients Route
const receptionistPatientsRoute = createRoute({
  getParentRoute: () => receptionistLayoutRoute,
  path: '/patients',
  component: PatientsPage,
})

// Receptionist Appointments Route
const receptionistAppointmentsRoute = createRoute({
  getParentRoute: () => receptionistLayoutRoute,
  path: '/appointments',
  component: AppointmentsPage,
})

// Receptionist Payments Route
const receptionistPaymentsRoute = createRoute({
  getParentRoute: () => receptionistLayoutRoute,
  path: '/payments',
  component: PaymentsPage,
})

// Receptionist Search Route
const receptionistSearchRoute = createRoute({
  getParentRoute: () => receptionistLayoutRoute,
  path: '/search',
  component: () => {
    const navigate = useNavigate()
    React.useEffect(() => {
      navigate({ to: '/receptionist/patients', replace: true })
    }, [navigate])
    return null
  },
})

// Receptionist Index Route (redirect to dashboard)
const receptionistIndexRoute = createRoute({
  getParentRoute: () => receptionistLayoutRoute,
  path: '/',
  component: () => {
    const navigate = useNavigate()
    React.useEffect(() => {
      navigate({ to: '/receptionist/dashboard', replace: true })
    }, [navigate])
    return null
  },
})

// Master Admin Routes
import HospitalsPage from '@/pages/master-admin/Hospitals'
import UsersPage from '@/pages/master-admin/Users'
import SystemSettingsPage from '@/pages/master-admin/SystemSettings'
import SubscriptionsPage from '@/pages/master-admin/Subscriptions'
import AnalyticsPage from '@/pages/master-admin/Analytics'
import BillingPage from '@/pages/master-admin/Billing'
import ReportsPage from '@/pages/master-admin/Reports'
import SupportPage from '@/pages/master-admin/Support'
import MasterAdminLayout from '@/components/MasterAdminLayout'

const masterAdminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/master-admin',
  component: MasterAdminLayout,
})

const masterAdminDashboardRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/',
  component: MasterAdminDashboard,
})

const masterAdminHospitalsRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/hospitals',
  component: HospitalsPage,
})

const masterAdminUsersRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/users',
  component: UsersPage,
})

const masterAdminSettingsRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/settings',
  component: SystemSettingsPage,
})

const masterAdminSubscriptionsRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/subscriptions',
  component: SubscriptionsPage,
})

const masterAdminAnalyticsRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/analytics',
  component: AnalyticsPage,
})

const masterAdminBillingRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/billing',
  component: BillingPage,
})

const masterAdminReportsRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/reports',
  component: ReportsPage,
})

const masterAdminSupportRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/support',
  component: SupportPage,
})

const masterAdminKnowledgeBaseRoute = createRoute({
  getParentRoute: () => masterAdminLayoutRoute,
  path: '/knowledge-base',
  component: KnowledgeBasePage,
})

// Admin Routes
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/dashboard',
  component: AdminDashboard,
})

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/analytics',
  component: AdminAnalytics,
})

const adminStaffRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/staff',
  component: AdminStaffManagement,
})

const adminFinancialRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/financial',
  component: AdminFinancialManagement,
})

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/settings',
  component: AdminSystemConfiguration,
})

const adminAuditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/audit',
  component: AdminAuditCompliance,
})

const adminBranchFormRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/add-branch',
  component: AdminBranchForm,
})

const adminBranchManagementRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/branches',
  component: BranchManagement,
})

const adminDepartmentManagementRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/department-management',
  component: AdminDepartmentManagement,
})

const adminDoctorAvailabilityRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/doctor-availability',
  component: AdminDoctorAvailability,
})

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: () => {
    const navigate = useNavigate()
    React.useEffect(() => {
      navigate({ to: '/admin/dashboard', replace: true })
    }, [navigate])
    return null
  },
})

// Sub-Admin Routes
const subAdminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sub-admin',
  component: SubAdminLayout,
})

const subAdminDashboardRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/dashboard',
  component: SubAdminDashboard,
})

const subAdminStaffRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/staff',
  component: StaffManagement,
})

const subAdminDepartmentsRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/departments',
  component: DepartmentManagement,
})

const subAdminDoctorAvailabilityRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/doctor-availability',
  component: SubAdminDoctorAvailability,
})

const subAdminAppointmentsRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/appointments',
  component: Appointments,
})

const subAdminPatientsRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/patients',
  component: Patients,
})

const subAdminTestRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/test',
  component: TestPage,
})

const subAdminAnalyticsRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/analytics',
  component: Analytics,
})

const subAdminSettingsRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/settings',
  component: SettingsPage,
})

const subAdminIndexRoute = createRoute({
  getParentRoute: () => subAdminLayoutRoute,
  path: '/',
  component: () => {
    const navigate = useNavigate()
    React.useEffect(() => {
      navigate({ to: '/sub-admin/dashboard', replace: true })
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
  receptionistLayoutRoute.addChildren([
  receptionistDashboardRoute,
  receptionistPatientsRoute,
  receptionistAppointmentsRoute,
  receptionistPaymentsRoute,
    receptionistSearchRoute,
  receptionistIndexRoute,
  ]),
  masterAdminLayoutRoute.addChildren([
    masterAdminDashboardRoute,
    masterAdminHospitalsRoute,
    masterAdminUsersRoute,
    masterAdminSettingsRoute,
    masterAdminSubscriptionsRoute,
    masterAdminAnalyticsRoute,
    masterAdminBillingRoute,
    masterAdminReportsRoute,
    masterAdminSupportRoute,
    masterAdminKnowledgeBaseRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminAnalyticsRoute,
    adminStaffRoute,
    adminFinancialRoute,
    adminBranchFormRoute,
    adminBranchManagementRoute,
    adminDepartmentManagementRoute,
    adminDoctorAvailabilityRoute,
    adminSettingsRoute,
    adminAuditRoute,
    adminIndexRoute,
  ]),
  subAdminLayoutRoute.addChildren([
    subAdminDashboardRoute,
    subAdminStaffRoute,
    subAdminDepartmentsRoute,
    subAdminDoctorAvailabilityRoute,
    subAdminAppointmentsRoute,
    subAdminPatientsRoute,
    subAdminAnalyticsRoute,
    subAdminSettingsRoute,
    subAdminTestRoute,
    subAdminIndexRoute,
  ]),
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