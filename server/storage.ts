import { 
  users, patients, appointments, prescriptions, payments, doctorAvailability, doctorLeaves,
  type User, type Patient, type Appointment, type Prescription, type Payment, 
  type DoctorAvailability, type DoctorLeave,
  type InsertUser, type InsertPatient, type InsertAppointment, 
  type InsertPrescription, type InsertPayment, type InsertDoctorAvailability, 
  type InsertDoctorLeave, type AppointmentWithDetails, type PrescriptionWithDetails,
  type PaymentWithDetails
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDoctors(): Promise<User[]>;

  // Patients
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, updates: Partial<InsertPatient>): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  getAllPatients(): Promise<Patient[]>;

  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<AppointmentWithDetails | undefined>;
  getAppointmentsByDoctor(doctorId: number, date?: string): Promise<AppointmentWithDetails[]>;
  getAppointmentsByPatient(patientId: number): Promise<AppointmentWithDetails[]>;
  getAllAppointments(date?: string): Promise<AppointmentWithDetails[]>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
  cancelAppointment(id: number): Promise<boolean>;

  // Prescriptions
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescriptionsByPatient(patientId: number): Promise<PrescriptionWithDetails[]>;
  getPrescriptionsByDoctor(doctorId: number): Promise<PrescriptionWithDetails[]>;
  getAllPrescriptions(): Promise<PrescriptionWithDetails[]>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByPatient(patientId: number): Promise<PaymentWithDetails[]>;
  getAllPayments(date?: string): Promise<PaymentWithDetails[]>;
  getRevenueByDate(date: string): Promise<number>;

  // Doctor Availability
  setDoctorAvailability(availability: InsertDoctorAvailability): Promise<DoctorAvailability>;
  getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]>;
  addDoctorLeave(leave: InsertDoctorLeave): Promise<DoctorLeave>;
  getDoctorLeaves(doctorId: number): Promise<DoctorLeave[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private prescriptions: Map<number, Prescription>;
  private payments: Map<number, Payment>;
  private doctorAvailabilities: Map<number, DoctorAvailability>;
  private doctorLeaves: Map<number, DoctorLeave>;
  
  private currentUserId: number;
  private currentPatientId: number;
  private currentAppointmentId: number;
  private currentPrescriptionId: number;
  private currentPaymentId: number;
  private currentAvailabilityId: number;
  private currentLeaveId: number;
  private currentPatientCounter: number;
  private currentReceiptCounter: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.prescriptions = new Map();
    this.payments = new Map();
    this.doctorAvailabilities = new Map();
    this.doctorLeaves = new Map();
    
    this.currentUserId = 1;
    this.currentPatientId = 1;
    this.currentAppointmentId = 1;
    this.currentPrescriptionId = 1;
    this.currentPaymentId = 1;
    this.currentAvailabilityId = 1;
    this.currentLeaveId = 1;
    this.currentPatientCounter = 1;
    this.currentReceiptCounter = 1;

    // Initialize with sample users
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample doctor
    const doctor: User = {
      id: this.currentUserId++,
      email: "doctor@medcare.com",
      password: "$2b$10$rOjLrPkTq3FZ8qJhKlBqMOKxXyaJ9H8p5UjO4KlmZN2wXyFqCpV6a", // "password123"
      role: "doctor",
      firstName: "Sarah",
      lastName: "Johnson",
      specialization: "Cardiologist",
      createdAt: new Date(),
    };
    this.users.set(doctor.id, doctor);

    // Sample receptionist
    const receptionist: User = {
      id: this.currentUserId++,
      email: "receptionist@medcare.com",
      password: "$2b$10$rOjLrPkTq3FZ8qJhKlBqMOKxXyaJ9H8p5UjO4KlmZN2wXyFqCpV6a", // "password123"
      role: "receptionist",
      firstName: "Emily",
      lastName: "Davis",
      specialization: null,
      createdAt: new Date(),
    };
    this.users.set(receptionist.id, receptionist);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getDoctors(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "doctor");
  }

  // Patients
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(patient => patient.patientId === patientId);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentPatientId++;
    const patientId = `PAT${this.currentPatientCounter.toString().padStart(3, '0')}`;
    this.currentPatientCounter++;
    
    const patient: Patient = {
      ...insertPatient,
      id,
      patientId,
      createdAt: new Date(),
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...updates };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.patients.values()).filter(patient => 
      patient.firstName.toLowerCase().includes(lowercaseQuery) ||
      patient.lastName.toLowerCase().includes(lowercaseQuery) ||
      patient.phone.includes(query) ||
      patient.patientId.toLowerCase().includes(lowercaseQuery) ||
      (patient.email && patient.email.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  // Appointments
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      createdAt: new Date(),
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAppointment(id: number): Promise<AppointmentWithDetails | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const patient = this.patients.get(appointment.patientId);
    const doctor = this.users.get(appointment.doctorId);
    
    if (!patient || !doctor) return undefined;
    
    return { ...appointment, patient, doctor };
  }

  async getAppointmentsByDoctor(doctorId: number, date?: string): Promise<AppointmentWithDetails[]> {
    const appointments = Array.from(this.appointments.values())
      .filter(apt => apt.doctorId === doctorId && (!date || apt.appointmentDate === date));
    
    return this.enrichAppointments(appointments);
  }

  async getAppointmentsByPatient(patientId: number): Promise<AppointmentWithDetails[]> {
    const appointments = Array.from(this.appointments.values())
      .filter(apt => apt.patientId === patientId);
    
    return this.enrichAppointments(appointments);
  }

  async getAllAppointments(date?: string): Promise<AppointmentWithDetails[]> {
    const appointments = Array.from(this.appointments.values())
      .filter(apt => !date || apt.appointmentDate === date);
    
    return this.enrichAppointments(appointments);
  }

  private async enrichAppointments(appointments: Appointment[]): Promise<AppointmentWithDetails[]> {
    return appointments.map(appointment => {
      const patient = this.patients.get(appointment.patientId);
      const doctor = this.users.get(appointment.doctorId);
      
      if (!patient || !doctor) return null;
      
      return { ...appointment, patient, doctor };
    }).filter(Boolean) as AppointmentWithDetails[];
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, status };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async cancelAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Prescriptions
  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = this.currentPrescriptionId++;
    const prescription: Prescription = {
      ...insertPrescription,
      id,
      createdAt: new Date(),
    };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async getPrescriptionsByPatient(patientId: number): Promise<PrescriptionWithDetails[]> {
    const prescriptions = Array.from(this.prescriptions.values())
      .filter(rx => rx.patientId === patientId);
    
    return this.enrichPrescriptions(prescriptions);
  }

  async getPrescriptionsByDoctor(doctorId: number): Promise<PrescriptionWithDetails[]> {
    const prescriptions = Array.from(this.prescriptions.values())
      .filter(rx => rx.doctorId === doctorId);
    
    return this.enrichPrescriptions(prescriptions);
  }

  async getAllPrescriptions(): Promise<PrescriptionWithDetails[]> {
    const prescriptions = Array.from(this.prescriptions.values());
    return this.enrichPrescriptions(prescriptions);
  }

  private async enrichPrescriptions(prescriptions: Prescription[]): Promise<PrescriptionWithDetails[]> {
    return prescriptions.map(prescription => {
      const patient = this.patients.get(prescription.patientId);
      const doctor = this.users.get(prescription.doctorId);
      const appointment = prescription.appointmentId ? 
        this.appointments.get(prescription.appointmentId) : undefined;
      
      if (!patient || !doctor) return null;
      
      return { ...prescription, patient, doctor, appointment };
    }).filter(Boolean) as PrescriptionWithDetails[];
  }

  // Payments
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const receiptNumber = `REC${this.currentReceiptCounter.toString().padStart(4, '0')}`;
    this.currentReceiptCounter++;
    
    const payment: Payment = {
      ...insertPayment,
      id,
      receiptNumber,
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentsByPatient(patientId: number): Promise<PaymentWithDetails[]> {
    const payments = Array.from(this.payments.values())
      .filter(payment => payment.patientId === patientId);
    
    return this.enrichPayments(payments);
  }

  async getAllPayments(date?: string): Promise<PaymentWithDetails[]> {
    let payments = Array.from(this.payments.values());
    
    if (date) {
      payments = payments.filter(payment => 
        payment.createdAt.toISOString().split('T')[0] === date
      );
    }
    
    return this.enrichPayments(payments);
  }

  private async enrichPayments(payments: Payment[]): Promise<PaymentWithDetails[]> {
    return payments.map(payment => {
      const patient = this.patients.get(payment.patientId);
      const appointment = payment.appointmentId ? 
        this.appointments.get(payment.appointmentId) : undefined;
      
      if (!patient) return null;
      
      return { ...payment, patient, appointment };
    }).filter(Boolean) as PaymentWithDetails[];
  }

  async getRevenueByDate(date: string): Promise<number> {
    const payments = Array.from(this.payments.values())
      .filter(payment => 
        payment.createdAt.toISOString().split('T')[0] === date &&
        payment.status === 'paid'
      );
    
    return payments.reduce((total, payment) => total + parseFloat(payment.amount), 0);
  }

  // Doctor Availability
  async setDoctorAvailability(insertAvailability: InsertDoctorAvailability): Promise<DoctorAvailability> {
    const id = this.currentAvailabilityId++;
    const availability: DoctorAvailability = {
      ...insertAvailability,
      id,
    };
    this.doctorAvailabilities.set(id, availability);
    return availability;
  }

  async getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]> {
    return Array.from(this.doctorAvailabilities.values())
      .filter(avail => avail.doctorId === doctorId);
  }

  async addDoctorLeave(insertLeave: InsertDoctorLeave): Promise<DoctorLeave> {
    const id = this.currentLeaveId++;
    const leave: DoctorLeave = {
      ...insertLeave,
      id,
      createdAt: new Date(),
    };
    this.doctorLeaves.set(id, leave);
    return leave;
  }

  async getDoctorLeaves(doctorId: number): Promise<DoctorLeave[]> {
    return Array.from(this.doctorLeaves.values())
      .filter(leave => leave.doctorId === doctorId);
  }
}

export const storage = new MemStorage();
