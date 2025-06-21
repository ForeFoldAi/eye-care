import { z } from 'zod';

const dateSchema = z.preprocess((arg) => {
  if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
}, z.date({ required_error: 'Date is required' }));

export const loginSchema = z.object({
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['doctor', 'receptionist'], { required_error: 'Role is required' })
});

export const insertPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: dateSchema,
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  phone: z.string()
    .min(1, 'Phone number is required')
    .refine((val) => /^[0-9]+$/.test(val), { message: 'Phone number must contain only digits' }),
  email: z.string().email('Invalid email').optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalHistory: z.string().optional()
});

export const insertAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  datetime: dateSchema,
  type: z.enum(['consultation', 'checkup', 'follow-up'], { required_error: 'Type is required' }),
  notes: z.string().optional()
});

export const insertPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  medication: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().optional(),
  quantity: z.number().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional()
});

export const insertPaymentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  amount: z.number().positive('Amount must be a positive number'),
  method: z.enum(['cash', 'card', 'insurance'], { required_error: 'Payment method is required' }),
  receiptNumber: z.string().min(1, 'Receipt number is required')
});

export const insertUserSchema = z.object({
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['doctor', 'receptionist'], { required_error: 'Role is required' }),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  specialization: z.string().optional()
});

// Optional: grouped export
export const schemas = {
  login: loginSchema,
  insertPatient: insertPatientSchema,
  insertAppointment: insertAppointmentSchema,
  insertPrescription: insertPrescriptionSchema,
  insertPayment: insertPaymentSchema,
  insertUser: insertUserSchema
};
