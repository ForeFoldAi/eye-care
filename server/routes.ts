import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { generateReceipt } from "./utils/receipt";
import path from "path";
import { fileURLToPath } from 'url';
import { DoctorAvailability } from './models/doctorAvailability';
import Patient from './models/patient';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { 
  loginSchema, insertPatientSchema, insertAppointmentSchema, 
  insertPrescriptionSchema, insertPaymentSchema, insertUserSchema 
} from "./schemas";
import mongoose from 'mongoose';
import { User, Appointment, Prescription, Payment } from './models'; 
import { authenticateToken, authorizeRole } from './middleware/auth';
import { Router } from 'express';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import appointmentRoutes from './routes/appointments';
import prescriptionRoutes from './routes/prescriptions';
import paymentRoutes from './routes/payments';
import { connectDB } from './db/connect';

const JWT_SECRET = process.env.JWT_SECRET || "c55671afa6ad446ab8a9cf14fac5fa3464e29e4ddbea8af48cf0a4f9c45f2db1645d3158218aed7ee6d8878e3f0637dfba1fb87e4fa0ba739bdd97021d3edc01";
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Middleware to check role
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Helper function to check roles
const hasRole = (user: any, roles: string[]) => {
  return roles.includes(user.role);
};

// Define validation schemas
const patientSchema = z.object({
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

// Update the appointment interface to include type
export interface IAppointment {
  id: number;
  patientId: number;
  doctorId: number;
  datetime: Date;
  status: string;
  type: 'consultation' | 'checkup' | 'follow-up';
  notes?: string;
  createdAt: Date;
}

// Update the schemas to match MongoDB types
const appointmentSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  datetime: z.string().or(z.date()),
  type: z.enum(['consultation', 'checkup', 'follow-up']),
  notes: z.string().optional()
});

// Update the prescription interface
export interface IPrescription {
  id: number;
  patientId: number;
  doctorId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: string;
  instructions?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IInsertPrescription {
  patientId: number;
  doctorId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: string;
  instructions?: string;
  notes?: string;
  isActive?: boolean;
}

// Update the prescription schema
const prescriptionSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  medication: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().optional(),
  quantity: z.string().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional()
});

const paymentSchema = z.object({
  patientId: z.number(),
  appointmentId: z.number().optional(),
  amount: z.number(),
  method: z.enum(['cash', 'card', 'insurance']),
  receiptNumber: z.string()
});

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['doctor', 'receptionist']),
  firstName: z.string(),
  lastName: z.string(),
  specialization: z.string().optional()
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Helper function to check user roles
const checkRole = (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || !roles.includes(user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

interface IPatient {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default users
  await storage.initializeDefaultUsers();
  
  // Connect routes
  app.use('/api/auth', authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/payments', paymentRoutes);

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(loginData.email);
      
      if (!user || user.role !== loginData.role) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Patient routes
  app.post("/api/patients", authenticateToken, async (req: any, res) => {
    try {
      await connectDB(); // Ensure MongoDB connection is established
      const patientData = insertPatientSchema.parse(req.body);
      
      // Check for existing patient with same phone
      const existingPatient = await Patient.findOne({ phone: patientData.phone });
      if (existingPatient) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      // Create new patient
      const patient = new Patient({
        ...patientData,
        dateOfBirth: new Date(patientData.dateOfBirth),
        registrationDate: new Date(),
        isActive: true
      });

      const savedPatient = await patient.save();
      res.status(201).json(savedPatient);
    } catch (error) {
      console.error('Error registering patient:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error registering patient", error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  app.get("/api/patients", authenticateToken, async (req: any, res) => {
    try {
      await connectDB();
      const patients = await Patient.find().sort({ createdAt: -1 });
      res.json({ data: { patients } });
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ message: "Error fetching patients" });
    }
  });

  app.get("/api/patients/search", authenticateToken, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const patients = await storage.searchPatients(query);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patients/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/patients/register', async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const newPatient = new Patient(patientData);
      await newPatient.save();
      res.status(201).json(newPatient);
    } catch (error) {
      console.error('Error registering patient:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error registering patient', error });
      }
    }
  });

  // Prescription routes
  app.post("/api/prescriptions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      const prescription = new Prescription(prescriptionData);
      await prescription.save();
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error creating prescription', error });
      }
    }
  });

  app.get("/api/prescriptions", authenticateToken, async (req: any, res) => {
    try {
      const { patientId } = req.query;
      
      let prescriptions;
      if (patientId) {
        prescriptions = await storage.getPrescriptionsByPatient(parseInt(patientId as string));
      } else if (req.user.role === 'doctor') {
        prescriptions = await storage.getPrescriptionsByDoctor(req.user.id);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment routes
  app.post("/api/payments", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = new Payment({
        ...paymentData,
        processedBy: req.user?.id
      });
      await payment.save();
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error creating payment', error });
      }
    }
  });

  // Add new receipt download endpoint
  app.get("/api/payments/:id/receipt", authenticateToken, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPaymentById(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const [patient, receptionist] = await Promise.all([
        storage.getPatientById(payment.patientId),
        storage.getUserById(payment.processedBy)
      ]);

      if (!patient || !receptionist) {
        return res.status(404).json({ message: "Required data not found" });
      }

      let doctor = undefined;
      let appointment = undefined;
      
      if (payment.appointmentId) {
        appointment = await storage.getAppointmentById(payment.appointmentId);
        if (appointment) {
          doctor = await storage.getUserById(appointment.doctorId);
        }
      }

      const pdfBuffer = await generateReceipt({
        payment: {
          receiptNumber: payment.receiptNumber,
          createdAt: payment.createdAt,
          amount: payment.amount,
          method: payment.method,
          status: payment.status
        },
        patient: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          email: patient.email,
          id: (patient && patient._id ? patient._id.toString() : '')
        },
        doctor: doctor ? {
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialization: doctor.specialization || undefined,
          id: doctor._id?.toString() || ''
        } : undefined,
        appointment: appointment ? {
          id: appointment._id?.toString() || '',
          patientId: appointment.patientId.toString(),
          doctorId: appointment.doctorId.toString(),
          datetime: appointment.datetime,
          status: appointment.status,
          type: (appointment as any).type,
          notes: appointment.notes
        } : undefined,
        receptionist: {
          firstName: receptionist.firstName,
          lastName: receptionist.lastName,
          specialization: receptionist.specialization || undefined,
          id: receptionist._id?.toString() || ''
        }
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${payment.receiptNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating receipt:', error);
      res.status(500).json({ message: "Error generating receipt" });
    }
  });

  app.get("/api/payments", authenticateToken, async (req: any, res) => {
    try {
      const { patientId, date } = req.query;
      
      let payments;
      if (patientId) {
        payments = await storage.getPaymentsByPatient(parseInt(patientId as string));
      } else if (date) {
        payments = await storage.getPaymentsByDate(date as string);
      } else {
        // Show today's payments by default
        const today = new Date().toISOString().split('T')[0];
        payments = await storage.getPaymentsByDate(today);
      }
      
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Doctor routes
  app.get("/api/doctors", authenticateToken, async (req: any, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      const doctorsWithoutPassword = doctors.map(({ password, ...doctor }) => doctor);
      res.json(doctorsWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Doctor-specific routes
  app.get("/api/doctors/:id/appointments", authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      if (doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const appointments = await storage.getAppointmentsByDoctor(doctorId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctors/:id/patients", authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      if (doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const appointments = await storage.getAppointmentsByDoctor(doctorId);
      const patientIds = Array.from(new Set(appointments.map(apt => apt.patientId)));
      const patients = await Promise.all<IPatient | undefined>(
        patientIds.map(id => storage.getPatientById(id))
      );
      res.json(patients.filter((p: IPatient | undefined) => p !== undefined));
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctors/:id/prescriptions", authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      if (doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const prescriptions = await storage.getPrescriptionsByDoctor(doctorId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Doctor availability routes
  app.get("/api/doctors/:id/availability", authenticateToken, async (req: any, res) => {
    try {
      const doctorId = req.params.id;
      const dayOfWeek = parseInt(req.query.dayOfWeek);

      console.log(`[Backend] Received request for doctorId: ${doctorId}, dayOfWeek: ${dayOfWeek}`);

      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({ message: "Invalid day of week" });
      }

      // No need to convert doctorId to ObjectId, it's a string in the schema
      const availability = await DoctorAvailability.findOne({
        doctorId: doctorId,
        dayOfWeek: dayOfWeek
      });

      if (!availability) {
        return res.json({ slots: [] });
      }

      res.json(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctor/availability", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Convert numeric ID to string for MongoDB query
      const availability = await DoctorAvailability.find({ doctorId: req.user.id.toString() })
        .sort({ dayOfWeek: 1 });
      res.json(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/doctor/availability", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { dayOfWeek, slots } = req.body;

      // Prevent editing Sunday slots
      if (dayOfWeek === 0) {
        return res.status(400).json({ message: "Cannot set availability for Sunday" });
      }

      // Validate slots
      if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({ message: "At least one time slot is required" });
      }

      // Validate each slot
      for (const slot of slots) {
        if (!slot.startTime || !slot.endTime || !slot.hoursAvailable || !slot.tokenCount) {
          return res.status(400).json({ message: "Invalid slot data" });
        }
      }

      // Update or create availability using string ID
      const availability = await DoctorAvailability.findOneAndUpdate(
        { doctorId: req.user.id.toString(), dayOfWeek },
        { 
          doctorId: req.user.id.toString(),
          dayOfWeek,
          slots
        },
        { upsert: true, new: true }
      );

      res.json(availability);
    } catch (error) {
      console.error('Error setting availability:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/doctor/availability/:dayOfWeek", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const dayOfWeek = parseInt(req.params.dayOfWeek);

      // Prevent deleting Sunday slots
      if (dayOfWeek === 0) {
        return res.status(400).json({ message: "Cannot delete Sunday availability" });
      }

      await DoctorAvailability.findOneAndDelete({
        doctorId: req.user.id,
        dayOfWeek
      });

      res.json({ message: "Availability deleted successfully" });
    } catch (error) {
      console.error('Error deleting availability:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update the appointment search
  app.get("/api/doctors/:id/appointments/search", authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const query = req.query.q as string;
      
      if (doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const appointments = await storage.getAppointmentsByDoctor(doctorId);
      const searchResults = appointments.filter(apt => 
        apt.status.toLowerCase().includes(query.toLowerCase()) ||
        apt.notes?.toLowerCase().includes(query.toLowerCase())
      );
      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctors/:id/patients/search", authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const query = req.query.q as string;
      
      if (doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const appointments = await storage.getAppointmentsByDoctor(doctorId);
      const patientIds = Array.from(new Set(appointments.map(apt => apt.patientId)));
      const patients = await Promise.all<IPatient | undefined>(
        patientIds.map(id => storage.getPatientById(id))
      );
      const searchResults = patients.filter((p: IPatient | undefined) => p !== undefined).filter((p: IPatient) =>
        p.firstName.toLowerCase().includes(query.toLowerCase()) ||
        p.lastName.toLowerCase().includes(query.toLowerCase()) ||
        (p.email?.toLowerCase() || '').includes(query.toLowerCase()) ||
        (p.phone || '').includes(query)
      );
      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctors/:id/prescriptions/search", authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const query = req.query.q as string;
      
      if (doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const prescriptions = await storage.getPrescriptionsByDoctor(doctorId);
      const searchResults = prescriptions.filter(p =>
        p.medication.toLowerCase().includes(query.toLowerCase()) ||
        p.dosage.toLowerCase().includes(query.toLowerCase()) ||
        p.instructions?.toLowerCase().includes(query.toLowerCase())
      );
      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats routes
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (req.user.role === 'doctor') {
        const todayAppointments = await storage.getAppointmentsByDate(today);
        const doctorAppointments = todayAppointments.filter(apt => apt.doctorId === req.user.id);
        const recentPrescriptions = await storage.getPrescriptionsByDoctor(req.user.id);
        
        res.json({
          todayAppointments: doctorAppointments.length,
          totalPatients: (await storage.getAllPatients()).length,
          prescriptions: recentPrescriptions.filter(p => p.isActive).length,
          revenue: 0 // Doctors don't track revenue directly
        });
      } else {
        const todayAppointments = await storage.getAppointmentsByDate(today);
        const todayPayments = await storage.getPaymentsByDate(today);
        const allPatients = await storage.getAllPatients();
        
        const totalRevenue = todayPayments.reduce((sum, payment) => 
          sum + Number(payment.amount), 0
        );
        
        res.json({
          todayAppointments: todayAppointments.length,
          newPatients: allPatients.filter(p => 
            p.createdAt && p.createdAt.toISOString().split('T')[0] === today
          ).length,
          paymentsToday: totalRevenue,
          cancellations: todayAppointments.filter(apt => apt.status === 'cancelled').length
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
  }

  // Handle client-side routing - must be after all API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }

    // Serve the index.html for client-side routes
    if (process.env.NODE_ENV === 'production') {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    } else {
      res.sendFile(path.join(__dirname, '../client/index.html'));
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

