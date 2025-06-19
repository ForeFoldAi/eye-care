import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  datetime: Date;
  type: 'consultation' | 'checkup' | 'follow-up';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  tokenNumber: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  datetime: {
    type: Date,
    required: [true, 'Appointment date and time is required']
  },
  type: {
    type: String,
    required: [true, 'Appointment type is required'],
    enum: ['consultation', 'checkup', 'follow-up']
  },
  status: {
    type: String,
    required: true,
    default: 'scheduled',
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled']
  },
  tokenNumber: {
    type: Number,
    required: [true, 'Token number is required'],
    min: 1
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes
appointmentSchema.index({ patientId: 1, datetime: 1 });
appointmentSchema.index({ doctorId: 1, datetime: 1 });
appointmentSchema.index({ doctorId: 1, datetime: 1, tokenNumber: 1 }, { unique: true });

export const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', appointmentSchema); 