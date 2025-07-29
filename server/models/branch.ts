import mongoose, { Document } from 'mongoose';

export interface IBranchDocument extends Document {
  // Basic Information
  branchName: string;
  hospitalId: mongoose.Types.ObjectId;
  branchType: 'main' | 'sub'; // New field for branch type
  branchCode?: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  
  // Location Details
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  googleMapLink?: string;
  
  // Operational Settings
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
  maxDailyAppointments?: number;
  defaultLanguage?: string;
  
  // Branch Admin Setup
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  subAdminId: mongoose.Types.ObjectId; // Reference to created sub-admin user
  
  // Status and Activation
  isActive: boolean;
  activationDate?: Date;
  
  // System fields
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy/Extended fields for backward compatibility
  stats: {
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    totalRevenue: number;
  };
}

const branchSchema = new mongoose.Schema({
  // Basic Information
  branchName: { type: String, required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  branchType: { type: String, enum: ['main', 'sub'], required: true, default: 'sub' },
  branchCode: { type: String, unique: true, sparse: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  alternatePhone: { type: String },
  
  // Location Details
  country: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  postalCode: { type: String, required: true },
  googleMapLink: { type: String },
  
  // Operational Settings
  workingDays: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one working day is required'
    }
  },
  workingHoursStart: { type: String, required: true },
  workingHoursEnd: { type: String, required: true },
  timezone: { type: String, required: true },
  maxDailyAppointments: { type: Number, default: 50 },
  defaultLanguage: { type: String, default: 'en' },
  
  // Branch Admin Setup
  adminFirstName: { type: String, required: true },
  adminLastName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  adminPhone: { type: String, required: true },
  subAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Status and Activation
  isActive: { type: Boolean, default: true },
  activationDate: { type: Date },
  
  // System fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Legacy/Extended fields for backward compatibility
  stats: {
    totalPatients: { type: Number, default: 0 },
    totalDoctors: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  }
});

// Generate branch code automatically if not provided
branchSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Generate branch code if not provided
  if (!this.branchCode) {
    // Generate code based on branch name and timestamp
    const nameCode = this.branchName.substring(0, 3).toUpperCase();
    const timestampCode = Date.now().toString().slice(-4);
    this.branchCode = `${nameCode}${timestampCode}`;
  }
  
  // Validate that only one main branch exists per hospital
  if (this.branchType === 'main') {
    const existingMainBranch = await Branch.findOne({
      hospitalId: this.hospitalId,
      branchType: 'main',
      _id: { $ne: this._id } // Exclude current document if updating
    });
    
    if (existingMainBranch) {
      return next(new Error('Only one main branch is allowed per hospital'));
    }
  }
  
  next();
});

// Create index for efficient querying
branchSchema.index({ hospitalId: 1, isActive: 1 });
branchSchema.index({ branchCode: 1 });
branchSchema.index({ subAdminId: 1 });

export const Branch = mongoose.models.Branch || mongoose.model<IBranchDocument>('Branch', branchSchema);
export default Branch; 