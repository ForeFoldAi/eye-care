import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { 
  loginSchema, insertPatientSchema, insertAppointmentSchema, 
  insertPrescriptionSchema, insertPaymentSchema, insertUserSchema 
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

// Middleware to check role
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  
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
        { id: user.id, email: user.email, role: user.role },
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
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ message: "Invalid patient data" });
    }
  });

  app.get("/api/patients", authenticateToken, async (req: any, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
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

  app.get("/api/patients/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatientById(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Appointment routes
  app.post("/api/appointments", authenticateToken, async (req: any, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error: any) {
      console.error('Appointment validation error:', error);
      res.status(400).json({ 
        message: error.message || "Invalid appointment data",
        errors: error.errors || []
      });
    }
  });

  app.get("/api/appointments", authenticateToken, async (req: any, res) => {
    try {
      const { doctorId, patientId, date } = req.query;
      
      let appointments;
      if (doctorId) {
        appointments = await storage.getAppointmentsByDoctor(parseInt(doctorId as string));
      } else if (patientId) {
        appointments = await storage.getAppointmentsByPatient(parseInt(patientId as string));
      } else if (date) {
        appointments = await storage.getAppointmentsByDate(date as string);
      } else {
        // If user is doctor, only show their appointments
        if (req.user.role === 'doctor') {
          appointments = await storage.getAppointmentsByDoctor(req.user.id);
        } else {
          // For receptionists, show today's appointments by default
          const today = new Date().toISOString().split('T')[0];
          appointments = await storage.getAppointmentsByDate(today);
        }
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/appointments/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const appointment = await storage.updateAppointmentStatus(id, status);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Prescription routes
  app.post("/api/prescriptions", authenticateToken, requireRole(['doctor']), async (req: any, res) => {
    try {
      const prescriptionData = {
        ...insertPrescriptionSchema.parse(req.body),
        doctorId: req.user.id
      };
      
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      res.status(400).json({ message: "Invalid prescription data" });
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
  app.post("/api/payments", authenticateToken, requireRole(['receptionist']), async (req: any, res) => {
    try {
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const paymentData = {
        ...insertPaymentSchema.parse(req.body),
        receiptNumber,
        processedBy: req.user.id
      };
      
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error: any) {
      console.error('Payment validation error:', error);
      res.status(400).json({ 
        message: error.message || "Invalid payment data",
        errors: error.errors || []
      });
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
          sum + parseFloat(payment.amount), 0
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

  const httpServer = createServer(app);
  return httpServer;
}
