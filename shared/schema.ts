import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'doctor' | 'receptionist'
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  specialization: text("specialization"), // Only for doctors
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactRelation: text("emergency_contact_relation"),
  emergencyContactPhone: text("emergency_contact_phone"),
  patientId: text("patient_id").notNull().unique(), // PAT001, PAT002, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  medications: text("medications").notNull(), // JSON string of medication details
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  service: text("service").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  status: text("status").notNull().default("paid"), // 'paid', 'pending', 'refunded'
  receiptNumber: text("receipt_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorAvailability = pgTable("doctor_availability", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const doctorLeaves = pgTable("doctor_leaves", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  leaveDate: text("leave_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  patientId: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  receiptNumber: true,
  createdAt: true,
});

export const insertDoctorAvailabilitySchema = createInsertSchema(doctorAvailability).omit({
  id: true,
});

export const insertDoctorLeaveSchema = createInsertSchema(doctorLeaves).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertDoctorAvailability = z.infer<typeof insertDoctorAvailabilitySchema>;
export type DoctorAvailability = typeof doctorAvailability.$inferSelect;

export type InsertDoctorLeave = z.infer<typeof insertDoctorLeaveSchema>;
export type DoctorLeave = typeof doctorLeaves.$inferSelect;

// Extended types for API responses
export type AppointmentWithDetails = Appointment & {
  patient: Patient;
  doctor: User;
};

export type PrescriptionWithDetails = Prescription & {
  patient: Patient;
  doctor: User;
  appointment?: Appointment;
};

export type PaymentWithDetails = Payment & {
  patient: Patient;
  appointment?: Appointment;
};
