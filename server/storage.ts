import { 
  users, patients, appointments, prescriptions, payments, doctorAvailability,
  type User, type InsertUser, type Patient, type InsertPatient, 
  type Appointment, type InsertAppointment, type Prescription, type InsertPrescription,
  type Payment, type InsertPayment, type DoctorAvailability, type InsertDoctorAvailability
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllDoctors(): Promise<User[]>;
  
  // Patient methods
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatientById(id: number): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  getAllPatients(): Promise<Patient[]>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  
  // Appointment methods
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentById(id: number): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
  
  // Prescription methods
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescriptionsByPatient(patientId: number): Promise<Prescription[]>;
  getPrescriptionsByDoctor(doctorId: number): Promise<Prescription[]>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByPatient(patientId: number): Promise<Payment[]>;
  getPaymentsByDate(date: string): Promise<Payment[]>;
  
  // Doctor availability methods
  setDoctorAvailability(availability: InsertDoctorAvailability): Promise<DoctorAvailability>;
  getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private patients: Map<number, Patient> = new Map();
  private appointments: Map<number, Appointment> = new Map();
  private prescriptions: Map<number, Prescription> = new Map();
  private paymentsMap: Map<number, Payment> = new Map();
  private availability: Map<number, DoctorAvailability> = new Map();
  
  private currentUserId = 1;
  private currentPatientId = 1;
  private currentAppointmentId = 1;
  private currentPrescriptionId = 1;
  private currentPaymentId = 1;
  private currentAvailabilityId = 1;

  constructor() {
    this.seedDefaultData();
  }

  private async seedDefaultData() {
    // Create default users
    const doctorPassword = await bcrypt.hash("doctor123", 10);
    const receptionistPassword = await bcrypt.hash("receptionist123", 10);
    
    const doctor: User = {
      id: this.currentUserId++,
      email: "doctor@hospital.com",
      password: doctorPassword,
      role: "doctor",
      firstName: "Sarah",
      lastName: "Johnson",
      specialization: "Cardiologist",
      isActive: true,
      createdAt: new Date(),
    };
    
    const receptionist: User = {
      id: this.currentUserId++,
      email: "receptionist@hospital.com", 
      password: receptionistPassword,
      role: "receptionist",
      firstName: "Maria",
      lastName: "Garcia",
      specialization: null,
      isActive: true,
      createdAt: new Date(),
    };
    
    this.users.set(doctor.id, doctor);
    this.users.set(receptionist.id, receptionist);
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllDoctors(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === 'doctor');
  }

  // Patient methods
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const patient: Patient = {
      ...insertPatient,
      id: this.currentPatientId++,
      createdAt: new Date(),
    };
    this.patients.set(patient.id, patient);
    return patient;
  }

  async getPatientById(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.patients.values()).filter(patient => 
      patient.firstName.toLowerCase().includes(lowerQuery) ||
      patient.lastName.toLowerCase().includes(lowerQuery) ||
      patient.phone.includes(query) ||
      patient.email?.toLowerCase().includes(lowerQuery)
    );
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async updatePatient(id: number, updateData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...updateData };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  // Appointment methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const appointment: Appointment = {
      ...insertAppointment,
      id: this.currentAppointmentId++,
      createdAt: new Date(),
    };
    this.appointments.set(appointment.id, appointment);
    return appointment;
  }

  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => apt.patientId === patientId);
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => apt.doctorId === doctorId);
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => 
      apt.datetime.toISOString().split('T')[0] === date
    );
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    appointment.status = status;
    this.appointments.set(id, appointment);
    return appointment;
  }

  // Prescription methods
  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const prescription: Prescription = {
      ...insertPrescription,
      id: this.currentPrescriptionId++,
      createdAt: new Date(),
    };
    this.prescriptions.set(prescription.id, prescription);
    return prescription;
  }

  async getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.patientId === patientId);
  }

  async getPrescriptionsByDoctor(doctorId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.doctorId === doctorId);
  }

  // Payment methods
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const payment: Payment = {
      ...insertPayment,
      id: this.currentPaymentId++,
      createdAt: new Date(),
    };
    this.paymentsMap.set(payment.id, payment);
    return payment;
  }

  async getPaymentsByPatient(patientId: number): Promise<Payment[]> {
    return Array.from(this.paymentsMap.values()).filter(p => p.patientId === patientId);
  }

  async getPaymentsByDate(date: string): Promise<Payment[]> {
    return Array.from(this.paymentsMap.values()).filter(p => 
      p.createdAt?.toISOString().split('T')[0] === date
    );
  }

  // Doctor availability methods
  async setDoctorAvailability(insertAvailability: InsertDoctorAvailability): Promise<DoctorAvailability> {
    const availability: DoctorAvailability = {
      ...insertAvailability,
      id: this.currentAvailabilityId++,
    };
    this.availability.set(availability.id, availability);
    return availability;
  }

  async getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]> {
    return Array.from(this.availability.values()).filter(a => a.doctorId === doctorId);
  }
}

export const storage = new MemStorage();
