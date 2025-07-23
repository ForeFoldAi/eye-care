import { z } from 'zod';

// Zod schemas for validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist'])
});

export const insertPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalHistory: z.string().optional(),
  branchId: z.string().optional(),
  hospitalId: z.string().optional()
});

export const insertAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  datetime: z.string().min(1, 'Date and time is required'),
  type: z.enum(['consultation', 'checkup', 'follow-up'], { required_error: 'Appointment type is required' }),
  notes: z.string().optional(),
  branchId: z.string().optional(),
  hospitalId: z.string().optional()
});

export const insertPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentId: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1, 'Medication name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration: z.string().optional(),
    quantity: z.number().optional()
  })),
  instructions: z.string().optional(),
  notes: z.string().optional(),
  branchId: z.string().optional(),
  hospitalId: z.string().optional()
});

export const insertPaymentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  method: z.enum(['cash', 'card', 'insurance'], { required_error: 'Payment method is required' }),
  branchId: z.string().optional(),
  hospitalId: z.string().optional()
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6),
  role: z.enum(['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  specialization: z.string().optional(),
  branchId: z.string().optional(),
  hospitalId: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  permissions: z.array(z.string()).optional()
});

// New schemas for hospital and branch management
export const insertHospitalSchema = z.object({
  name: z.string().min(1, 'Hospital name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email'),
  website: z.string().url().optional().or(z.literal('')),
  logo: z.string().optional(),
  adminId: z.string().min(1, 'Admin ID is required'),
  settings: z.object({
    allowOnlineBooking: z.boolean().optional(),
    maxAppointmentsPerDay: z.number().min(1).optional(),
    appointmentDuration: z.number().min(15).optional(),
    workingHours: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    }).optional(),
    workingDays: z.array(z.string()).optional()
  }).optional()
});

export const insertBranchSchema = z.object({
  // Basic Information
  branchName: z.string().min(1, 'Branch name is required'),
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  branchCode: z.string().optional(),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  alternatePhone: z.string().optional(),
  
  // Location Details
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  googleMapLink: z.string().optional(),
  
  // Operational Settings
  workingDays: z.array(z.string()).min(1, 'At least one working day is required'),
  workingHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  workingHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  timezone: z.string().min(1, 'Timezone is required'),
  maxDailyAppointments: z.number().optional(),
  defaultLanguage: z.string().optional(),
  
  // Branch Admin Setup
  adminFirstName: z.string().min(1, 'Admin first name is required'),
  adminLastName: z.string().min(1, 'Admin last name is required'),
  adminEmail: z.string().email('Invalid admin email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminPhone: z.string().min(1, 'Admin phone is required'),
  
  // Status and Activation
  isActive: z.boolean().default(true),
  activationDate: z.string().optional(),
  
  // System fields
  createdBy: z.string().optional()
});

// Types
export type LoginRequest = z.infer<typeof loginSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
