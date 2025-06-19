import bcrypt from "bcrypt";
import PatientModel, { IPatient } from './models/patient';
import User from './models/user';

// Define interfaces for the storage layer
export interface IUser {
  _id: any;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'receptionist';
  firstName: string;
  lastName: string;
  specialization?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface IInsertUser {
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'receptionist';
  firstName: string;
  lastName: string;
  specialization?: string;
  isActive?: boolean;
}

export interface IInsertPatient {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
}

export interface IAppointment {
  _id: any;
  patientId: number;
  doctorId: number;
  datetime: Date;
  status: string;
  notes?: string;
  createdAt: Date;
}

export interface IInsertAppointment {
  patientId: number;
  doctorId: number;
  datetime: Date;
  status?: string;
  notes?: string;
}

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

export interface IPayment {
  id: number;
  patientId: number;
  appointmentId?: number;
  amount: number;
  method: string;
  status: string;
  receiptNumber: string;
  processedBy: number;
  createdAt: Date;
}

export interface IInsertPayment {
  patientId: number;
  appointmentId?: number;
  amount: number;
  method: string;
  status?: string;
  receiptNumber: string;
  processedBy: number;
}

export interface IDoctorAvailability {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface IInsertDoctorAvailability {
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface IStorage {
  // User methods
  createUser(user: IInsertUser): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser | undefined>;
  getUserById(id: number): Promise<IUser | undefined>;
  getAllDoctors(): Promise<IUser[]>;
  
  // Patient methods
  createPatient(patient: IInsertPatient): Promise<IPatient>;
  getPatientById(id: number): Promise<IPatient | undefined>;
  searchPatients(query: string): Promise<IPatient[]>;
  getAllPatients(): Promise<IPatient[]>;
  updatePatient(id: number, patient: Partial<IInsertPatient>): Promise<IPatient | undefined>;
  
  // Appointment methods
  createAppointment(appointment: IInsertAppointment): Promise<IAppointment>;
  getAppointmentById(id: number): Promise<IAppointment | undefined>;
  getAppointmentsByPatient(patientId: number): Promise<IAppointment[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<IAppointment[]>;
  getAppointmentsByDate(date: string): Promise<IAppointment[]>;
  updateAppointmentStatus(id: number, status: string): Promise<IAppointment | undefined>;
  
  // Prescription methods
  createPrescription(prescription: IInsertPrescription): Promise<IPrescription>;
  getPrescriptionsByPatient(patientId: number): Promise<IPrescription[]>;
  getPrescriptionsByDoctor(doctorId: number): Promise<IPrescription[]>;
  
  // Payment methods
  createPayment(payment: IInsertPayment): Promise<IPayment>;
  getPaymentById(id: number): Promise<IPayment | undefined>;
  getPaymentsByPatient(patientId: number): Promise<IPayment[]>;
  getPaymentsByDate(date: string): Promise<IPayment[]>;
  
  // Doctor availability methods
  setDoctorAvailability(availability: IInsertDoctorAvailability): Promise<IDoctorAvailability>;
  getDoctorAvailability(doctorId: number): Promise<IDoctorAvailability[]>;
}

export class MongoDBStorage implements IStorage {
  async initializeDefaultUsers(): Promise<void> {
    const defaultUsers: IInsertUser[] = [
      {
        email: 'doctor@hospital.com',
        password: 'doctor123',
        role: 'doctor' as const,
        firstName: 'John',
        lastName: 'Doe',
        specialization: 'General Medicine'
      },
      {
        email: 'receptionist@hospital.com',
        password: 'receptionist123',
        role: 'receptionist' as const,
        firstName: 'Jane',
        lastName: 'Smith'
      }
    ];

    for (const user of defaultUsers) {
      const existingUser = await this.getUserByEmail(user.email);
      if (!existingUser) {
        await this.createUser(user);
      }
    }
  }

  // User methods
  async createUser(user: IInsertUser): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const doc = new User({
      ...user,
      password: hashedPassword,
      isActive: true,
      createdAt: new Date()
    });
    const saved = await doc.save();
    return saved.toObject();
  }

  async getUserByEmail(email: string): Promise<IUser | undefined> {
    const user = await User.findOne({ email });
    return user ? user.toObject() : undefined;
  }

  async getUserById(id: number): Promise<IUser | undefined> {
    const user = await User.findById(id);
    return user ? user.toObject() : undefined;
  }

  async getAllDoctors(): Promise<IUser[]> {
    const doctors = await User.find({ role: 'doctor', isActive: true });
    return doctors.map((d: any) => d.toObject());
  }

  // Patient methods
  async createPatient(patient: IInsertPatient): Promise<IPatient> {
    const doc = new PatientModel({
      ...patient,
      registrationDate: new Date(),
      isActive: true,
    });
    const saved = await doc.save();
    return saved.toObject();
  }

  async getPatientById(id: number): Promise<IPatient | undefined> {
    const patient = await PatientModel.findOne({ patientId: `P-${String(id).padStart(4, '0')}` });
    return patient ? patient.toObject() : undefined;
  }

  async searchPatients(query: string): Promise<IPatient[]> {
    const patients = await PatientModel.find({ $text: { $search: query } });
    return patients.map(p => p.toObject());
  }

  async getAllPatients(): Promise<IPatient[]> {
    const patients = await PatientModel.find();
    return patients.map(p => p.toObject());
  }

  async updatePatient(id: number, patient: Partial<IInsertPatient>): Promise<IPatient | undefined> {
    const updated = await PatientModel.findOneAndUpdate(
      { patientId: `P-${String(id).padStart(4, '0')}` },
      { $set: patient },
      { new: true }
    );
    return updated ? updated.toObject() : undefined;
  }

  // Appointment methods
  async createAppointment(appointment: IInsertAppointment): Promise<IAppointment> { throw new Error('Not implemented'); }
  async getAppointmentById(id: number): Promise<IAppointment | undefined> { throw new Error('Not implemented'); }
  async getAppointmentsByPatient(patientId: number): Promise<IAppointment[]> { throw new Error('Not implemented'); }
  async getAppointmentsByDoctor(doctorId: number): Promise<IAppointment[]> { throw new Error('Not implemented'); }
  async getAppointmentsByDate(date: string): Promise<IAppointment[]> { throw new Error('Not implemented'); }
  async updateAppointmentStatus(id: number, status: string): Promise<IAppointment | undefined> { throw new Error('Not implemented'); }

  // Prescription methods
  async createPrescription(prescription: IInsertPrescription): Promise<IPrescription> { throw new Error('Not implemented'); }
  async getPrescriptionsByPatient(patientId: number): Promise<IPrescription[]> { throw new Error('Not implemented'); }
  async getPrescriptionsByDoctor(doctorId: number): Promise<IPrescription[]> { throw new Error('Not implemented'); }

  // Payment methods
  async createPayment(payment: IInsertPayment): Promise<IPayment> { throw new Error('Not implemented'); }
  async getPaymentById(id: number): Promise<IPayment | undefined> { throw new Error('Not implemented'); }
  async getPaymentsByPatient(patientId: number): Promise<IPayment[]> { throw new Error('Not implemented'); }
  async getPaymentsByDate(date: string): Promise<IPayment[]> { throw new Error('Not implemented'); }

  // Doctor availability methods
  async setDoctorAvailability(availability: IInsertDoctorAvailability): Promise<IDoctorAvailability> { throw new Error('Not implemented'); }
  async getDoctorAvailability(doctorId: number): Promise<IDoctorAvailability[]> { throw new Error('Not implemented'); }
}

export const storage = new MongoDBStorage();
