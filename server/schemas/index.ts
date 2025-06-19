import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['doctor', 'receptionist'])
});

export const insertPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().or(z.date()),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalHistory: z.string().optional()
});

export const insertAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  datetime: z.string().or(z.date()),
  type: z.enum(['consultation', 'checkup', 'follow-up']),
  notes: z.string().optional()
});

export const insertPrescriptionSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  medication: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().optional(),
  quantity: z.number().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional()
});

export const insertPaymentSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  amount: z.number(),
  method: z.enum(['cash', 'card', 'insurance']),
  receiptNumber: z.string()
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['doctor', 'receptionist']),
  firstName: z.string(),
  lastName: z.string(),
  specialization: z.string().optional()
}); 