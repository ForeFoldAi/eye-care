import { z } from 'zod';

// Zod schemas for validation
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
  datetime: z.union([z.string(), z.date()]),
  type: z.enum(['consultation', 'checkup', 'follow-up']),
  tokenNumber: z.number().min(1),
  notes: z.string().optional()
});

export const insertPrescriptionSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  appointmentId: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1, "Medication name is required"),
    dosage: z.string().min(1, "Dosage is required"),
    frequency: z.string().min(1, "Frequency is required"),
    duration: z.string().optional()
  })).min(1, "At least one medication is required"),
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

// Types
export type LoginRequest = z.infer<typeof loginSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
