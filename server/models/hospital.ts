import mongoose, { Document } from 'mongoose';

export interface IHospitalDocument extends Document {
  name: string;
  description?: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Master admin who created this hospital
  adminId: mongoose.Types.ObjectId; // Admin assigned to this hospital
  createdAt: Date;
  updatedAt: Date;
  // Hospital settings
  settings: {
    allowOnlineBooking: boolean;
    maxAppointmentsPerDay: number;
    appointmentDuration: number; // in minutes
    workingHours: {
      start: string; // HH:MM format
      end: string; // HH:MM format
    };
    workingDays: string[]; // ['monday', 'tuesday', etc.]
  };
}

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  logo: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  settings: {
    allowOnlineBooking: { type: Boolean, default: true },
    maxAppointmentsPerDay: { type: Number, default: 50 },
    appointmentDuration: { type: Number, default: 30 },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    workingDays: { 
      type: [String], 
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] 
    }
  }
});

hospitalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Hospital = mongoose.models.Hospital || mongoose.model<IHospitalDocument>('Hospital', hospitalSchema);
export default Hospital; 