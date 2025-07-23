export const ROLES = {
  MASTER_ADMIN: 'master_admin',
  ADMIN: 'admin',
  SUB_ADMIN: 'sub_admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
} as const;

export const ROLE_HIERARCHY = {
  master_admin: 4,
  admin: 3,
  sub_admin: 2,
  doctor: 1,
  receptionist: 0,
} as const;

export const ROLE_LABELS = {
  master_admin: 'Master Administrator',
  admin: 'Hospital Administrator',
  sub_admin: 'Branch Manager',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
} as const;

export const ROLE_COLORS = {
  master_admin: 'bg-purple-500',
  admin: 'bg-blue-500',
  sub_admin: 'bg-green-500',
  doctor: 'bg-orange-500',
  receptionist: 'bg-gray-500',
} as const;

export const PERMISSIONS = {
  // Master Admin permissions
  MANAGE_SYSTEM: 'manage_system',
  MANAGE_MASTER_ADMINS: 'manage_master_admins',
  VIEW_ALL_DATA: 'view_all_data',
  
  // Admin permissions
  MANAGE_HOSPITALS: 'manage_hospitals',
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_SUB_ADMINS: 'manage_sub_admins',
  VIEW_HOSPITAL_DATA: 'view_hospital_data',
  
  // Sub-Admin permissions
  MANAGE_BRANCHES: 'manage_branches',
  MANAGE_DOCTORS: 'manage_doctors',
  MANAGE_RECEPTIONISTS: 'manage_receptionists',
  VIEW_BRANCH_DATA: 'view_branch_data',
  
  // Doctor permissions
  MANAGE_PATIENTS: 'manage_patients',
  MANAGE_APPOINTMENTS: 'manage_appointments',
  MANAGE_PRESCRIPTIONS: 'manage_prescriptions',
  VIEW_PATIENT_DATA: 'view_patient_data',
  
  // Receptionist permissions
  MANAGE_PATIENTS_BASIC: 'manage_patients_basic',
  MANAGE_APPOINTMENTS_BASIC: 'manage_appointments_basic',
  MANAGE_PAYMENTS: 'manage_payments',
  VIEW_PATIENT_DATA_BASIC: 'view_patient_data_basic',
} as const;

export const DEFAULT_ROLE_PERMISSIONS = {
  master_admin: [
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.MANAGE_MASTER_ADMINS,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.MANAGE_HOSPITALS,
    PERMISSIONS.MANAGE_ADMINS,
    PERMISSIONS.MANAGE_SUB_ADMINS,
    PERMISSIONS.MANAGE_DOCTORS,
    PERMISSIONS.MANAGE_RECEPTIONISTS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.MANAGE_PRESCRIPTIONS,
    PERMISSIONS.MANAGE_PAYMENTS,
  ],
  admin: [
    PERMISSIONS.MANAGE_HOSPITALS,
    PERMISSIONS.MANAGE_SUB_ADMINS,
    PERMISSIONS.MANAGE_DOCTORS,
    PERMISSIONS.MANAGE_RECEPTIONISTS,
    PERMISSIONS.VIEW_HOSPITAL_DATA,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.MANAGE_PRESCRIPTIONS,
    PERMISSIONS.MANAGE_PAYMENTS,
  ],
  sub_admin: [
    PERMISSIONS.MANAGE_BRANCHES,
    PERMISSIONS.MANAGE_DOCTORS,
    PERMISSIONS.MANAGE_RECEPTIONISTS,
    PERMISSIONS.VIEW_BRANCH_DATA,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.MANAGE_PRESCRIPTIONS,
    PERMISSIONS.MANAGE_PAYMENTS,
  ],
  doctor: [
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.MANAGE_PRESCRIPTIONS,
    PERMISSIONS.VIEW_PATIENT_DATA,
  ],
  receptionist: [
    PERMISSIONS.MANAGE_PATIENTS_BASIC,
    PERMISSIONS.MANAGE_APPOINTMENTS_BASIC,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.VIEW_PATIENT_DATA_BASIC,
  ],
} as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  WAITING: 'waiting',
} as const;

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  REFUNDED: 'refunded',
} as const;

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
] as const;

export const SERVICES = [
  'Consultation',
  'Follow-up',
  'Procedure',
  'Lab Tests',
  'X-Ray',
  'ECG',
  'Blood Test',
  'Vaccination',
] as const;

export const PAYMENT_METHODS = [
  'cash',
  'card',
  'insurance',
  'bank_transfer',
] as const;
