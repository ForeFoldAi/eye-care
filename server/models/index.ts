import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true }, // Optional username
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist'] 
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String }, // For doctors
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  // New fields for role-based access
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  permissions: [{ type: String }],
  lastLogin: { type: Date },
  phoneNumber: { type: String },
  address: { type: String }
});

// Patient Schema
const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  address: { type: String },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  medicalHistory: { type: String },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // New field
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }, // New field
  createdAt: { type: Date, default: Date.now }
});

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  datetime: { type: Date, required: true },
  type: { type: String, required: true, enum: ['consultation', 'checkup', 'follow-up'] },
  status: { type: String, required: true, default: 'scheduled', enum: ['scheduled', 'confirmed', 'completed', 'cancelled'] },
  notes: { type: String },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // New field
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }, // New field
  createdAt: { type: Date, default: Date.now }
});

// Prescription Schema
const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String },
    quantity: { type: Number }
  }],
  instructions: { type: String },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // New field
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }, // New field
  createdAt: { type: Date, default: Date.now }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  amount: { type: Number, required: true },
  method: { type: String, required: true, enum: ['cash', 'card', 'insurance'] },
  status: { type: String, required: true, default: 'completed', enum: ['pending', 'completed', 'refunded'] },
  receiptNumber: { type: String, required: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // New field
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }, // New field
  createdAt: { type: Date, default: Date.now }
});

// Create models only if they don't exist
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
export const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

// Export new models
export * from './user';
export * from './patient';
export * from './appointment';
export * from './payment';
export * from './receipt';
export * from './hospital';
export * from './branch';
export * from './ehr';
export * from './department';
export * from './doctorAvailability';
export * from './subscription';
export * from './supportTicket';
export * from './chat';
export * from './notification';
export * from './billing';
export * from './analytics';
export * from './subscriptionPlan'; 