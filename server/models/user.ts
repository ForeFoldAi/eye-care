import mongoose, { Document } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  username: string;
  password: string;
  role: 'master_admin' | 'admin' | 'sub_admin' | 'doctor' | 'receptionist' | 'nurse';
  firstName: string;
  lastName: string;
  specialization?: string;
  isActive: boolean;
  createdAt: Date;
  // New fields for role-based access
  branchId?: mongoose.Types.ObjectId; // For sub-admin, doctor, receptionist
  hospitalId?: mongoose.Types.ObjectId; // For admin, sub-admin, doctor, receptionist
  createdBy?: mongoose.Types.ObjectId; // Who created this user
  permissions?: string[]; // Custom permissions array
  lastLogin?: Date;
  phoneNumber?: string;
  address?: string;
  profilePhotoUrl?: string;
  
  // Extended staff information
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  emergencyContact?: string;
  employeeId?: string;
  joiningDate?: Date;
  shiftTiming?: 'morning' | 'evening' | 'night' | 'other';

  highestQualification?: string;
  medicalLicenseNumber?: string;
  yearsOfExperience?: number;
  certifications?: string;
  previousHospitals?: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  department?: string;
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist', 'nurse'] 
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  // New fields
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  permissions: [{ type: String }],
  lastLogin: { type: Date },
  phoneNumber: { type: String },
  address: { type: String },
  profilePhotoUrl: { type: String },
  
  // Extended staff information
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: { type: Date },
  emergencyContact: { type: String },
  employeeId: { type: String },
  joiningDate: { type: Date },
  shiftTiming: { type: String, enum: ['morning', 'evening', 'night', 'other'] },

  highestQualification: { type: String },
  medicalLicenseNumber: { type: String },
  yearsOfExperience: { type: Number },
  certifications: { type: String },
  previousHospitals: { type: String },
  currentAddress: { type: String },
  permanentAddress: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  department: { type: String }
});

export const User = mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
export default User; 