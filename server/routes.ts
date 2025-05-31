import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { 
  insertUserSchema, insertPatientSchema, insertAppointmentSchema,
  insertPrescriptionSchema, insertPaymentSchema, insertDoctorAvailabilitySchema,
  insertDoctorLeaveSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check user role
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          specialization: user.specialization
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          specialization: user.specialization
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        specialization: user.specialization
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Patient routes
  app.get("/api/patients", authenticateToken, async (req, res) => {
    try {
      const { search } = req.query;
      let patients;
      
      if (search) {
        patients = await storage.searchPatients(search as string);
      } else {
        patients = await storage.getAllPatients();
      }
      
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patients/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/patients", authenticateToken, requireRole(['receptionist', 'doctor']), async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ message: "Invalid patient data" });
    }
  });

  app.put("/api/patients/:id", authenticateToken, requireRole(['receptionist', 'doctor']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(id, updates);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(400).json({ message: "Invalid patient data" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", authenticateToken, async (req, res) => {
    try {
      const { date, doctorId, patientId } = req.query;
      let appointments;
      
      if (doctorId) {
        appointments = await storage.getAppointmentsByDoctor(
          parseInt(doctorId as string), 
          date as string
        );
      } else if (patientId) {
        appointments = await storage.getAppointmentsByPatient(parseInt(patientId as string));
      } else {
        appointments = await storage.getAllAppointments(date as string);
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/appointments/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/appointments", authenticateToken, requireRole(['receptionist', 'doctor']), async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ message: "Invalid appointment data" });
    }
  });

  app.patch("/api/appointments/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const appointment = await storage.updateAppointmentStatus(id, status);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/appointments/:id", authenticateToken, requireRole(['receptionist', 'doctor']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.cancelAppointment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json({ message: "Appointment cancelled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Prescription routes
  app.get("/api/prescriptions", authenticateToken, async (req, res) => {
    try {
      const { doctorId, patientId } = req.query;
      let prescriptions;
      
      if (doctorId) {
        prescriptions = await storage.getPrescriptionsByDoctor(parseInt(doctorId as string));
      } else if (patientId) {
        prescriptions = await storage.getPrescriptionsByPatient(parseInt(patientId as string));
      } else {
        prescriptions = await storage.getAllPrescriptions();
      }
      
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/prescriptions", authenticateToken, requireRole(['doctor']), async (req, res) => {
    try {
      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      res.status(400).json({ message: "Invalid prescription data" });
    }
  });

  // Payment routes
  app.get("/api/payments", authenticateToken, async (req, res) => {
    try {
      const { date, patientId } = req.query;
      let payments;
      
      if (patientId) {
        payments = await storage.getPaymentsByPatient(parseInt(patientId as string));
      } else {
        payments = await storage.getAllPayments(date as string);
      }
      
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/payments", authenticateToken, requireRole(['receptionist']), async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  app.get("/api/payments/revenue/:date", authenticateToken, requireRole(['receptionist']), async (req, res) => {
    try {
      const { date } = req.params;
      const revenue = await storage.getRevenueByDate(date);
      res.json({ revenue });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Doctor availability routes
  app.get("/api/doctors", authenticateToken, async (req, res) => {
    try {
      const doctors = await storage.getDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctors/:id/availability", authenticateToken, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const availability = await storage.getDoctorAvailability(doctorId);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/doctors/:id/availability", authenticateToken, requireRole(['doctor']), async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      
      // Ensure doctor can only set their own availability
      if (req.user.role === 'doctor' && req.user.id !== doctorId) {
        return res.status(403).json({ message: "Can only set your own availability" });
      }
      
      const availabilityData = insertDoctorAvailabilitySchema.parse({
        ...req.body,
        doctorId
      });
      
      const availability = await storage.setDoctorAvailability(availabilityData);
      res.status(201).json(availability);
    } catch (error) {
      res.status(400).json({ message: "Invalid availability data" });
    }
  });

  app.get("/api/doctors/:id/leaves", authenticateToken, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const leaves = await storage.getDoctorLeaves(doctorId);
      res.json(leaves);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/doctors/:id/leaves", authenticateToken, requireRole(['doctor']), async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      
      // Ensure doctor can only set their own leave
      if (req.user.role === 'doctor' && req.user.id !== doctorId) {
        return res.status(403).json({ message: "Can only set your own leave" });
      }
      
      const leaveData = insertDoctorLeaveSchema.parse({
        ...req.body,
        doctorId
      });
      
      const leave = await storage.addDoctorLeave(leaveData);
      res.status(201).json(leave);
    } catch (error) {
      res.status(400).json({ message: "Invalid leave data" });
    }
  });

  // Dashboard stats routes
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let stats: any = {};
      
      if (req.user.role === 'doctor') {
        const todayAppointments = await storage.getAppointmentsByDoctor(req.user.id, today);
        const totalPatients = await storage.getAllPatients();
        const doctorPrescriptions = await storage.getPrescriptionsByDoctor(req.user.id);
        
        stats = {
          todayAppointments: todayAppointments.length,
          totalPatients: totalPatients.length,
          prescriptions: doctorPrescriptions.length,
          pendingReviews: todayAppointments.filter(apt => apt.status === 'waiting').length
        };
      } else if (req.user.role === 'receptionist') {
        const todayAppointments = await storage.getAllAppointments(today);
        const allPatients = await storage.getAllPatients();
        const todayPayments = await storage.getAllPayments(today);
        const revenue = await storage.getRevenueByDate(today);
        
        // Calculate new patients today (you might want to add a date filter)
        const newPatientsToday = allPatients.filter(patient => 
          patient.createdAt.toISOString().split('T')[0] === today
        ).length;
        
        stats = {
          newPatientsToday,
          appointmentsToday: todayAppointments.length,
          revenueToday: revenue,
          pendingPayments: todayPayments.filter(payment => payment.status === 'pending').length
        };
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
