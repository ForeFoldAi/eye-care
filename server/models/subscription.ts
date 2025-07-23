import mongoose, { Document } from 'mongoose';

export interface ISubscriptionDocument extends Document {
  hospitalId: mongoose.Types.ObjectId;
  planName: string;
  planType: 'trial' | 'basic' | 'premium' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'expired' | 'cancelled' | 'trial';
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  monthlyCost: number;
  currency: string;
  features: string[]; // Array of enabled features
  maxUsers: number;
  maxBranches: number;
  maxPatients: number;
  autoRenew: boolean;
  paymentMethod: 'monthly' | 'yearly' | 'quarterly';
  nextBillingDate: Date;
  lastPaymentDate?: Date;
  totalPaid: number;
  outstandingAmount: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  planType: {
    type: String,
    enum: ['trial', 'basic', 'premium', 'enterprise', 'custom'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'expired', 'cancelled', 'trial'],
    default: 'trial'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  trialEndDate: {
    type: Date
  },
  monthlyCost: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  features: [{
    type: String,
    enum: [
      'appointments',
      'pharmacy',
      'labs',
      'inpatient',
      'prescriptions',
      'patient_portal',
      'billing',
      'reports',
      'api_access',
      'custom_integrations',
      'support_priority',
      'backup_restore',
      'multi_branch',
      'advanced_analytics'
    ]
  }],
  maxUsers: {
    type: Number,
    default: 10
  },
  maxBranches: {
    type: Number,
    default: 1
  },
  maxPatients: {
    type: Number,
    default: 1000
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: ['monthly', 'yearly', 'quarterly'],
    default: 'monthly'
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  lastPaymentDate: {
    type: Date
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  outstandingAmount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
subscriptionSchema.index({ hospitalId: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Pre-save middleware to set trial end date for trial plans
subscriptionSchema.pre('save', function(next) {
  if (this.planType === 'trial' && !this.trialEndDate) {
    this.trialEndDate = new Date(this.startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days trial
  }
  next();
});

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema); 