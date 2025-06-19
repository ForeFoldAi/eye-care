import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['doctor', 'receptionist'] },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String }, // For doctors
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
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
  createdAt: { type: Date, default: Date.now }
});

// Doctor Availability Schema
const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday, 6 = Saturday
  startTime: { type: String, required: true }, // Format: "HH:mm"
  endTime: { type: String, required: true }, // Format: "HH:mm"
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Create models only if they don't exist
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
export const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export const DoctorAvailability = mongoose.models.DoctorAvailability || mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
export * from './user';
export * from './patient';
export * from './appointment';
export * from './payment';
export * from './receipt'; 