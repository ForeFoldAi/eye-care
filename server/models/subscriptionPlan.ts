import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  planName: string;
  planType: 'trial' | 'basic' | 'standard' | 'premium' | 'enterprise' | 'custom';
  description?: string;
  monthlyCost: number;
  yearlyCost: number;
  currency: string;
  trialDays: number;
  maxUsers: number;
  maxBranches: number;
  maxPatients: number;
  maxStorage: number; // in GB
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  isCustom: boolean;
  autoRenew: boolean;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  gracePeriod: number; // days
  setupFee: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  planName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  planType: {
    type: String,
    required: true,
    enum: ['trial', 'basic', 'standard', 'premium', 'enterprise', 'custom'],
    default: 'basic'
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  monthlyCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  yearlyCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR', 'USD', 'EUR', 'GBP'],
    default: 'INR'
  },
  trialDays: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  maxUsers: {
    type: Number,
    required: true,
    min: 1,
    default: 10
  },
  maxBranches: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  maxPatients: {
    type: Number,
    required: true,
    min: 0,
    default: 1000
  },
  maxStorage: {
    type: Number,
    required: true,
    min: 1,
    default: 10
  },
  features: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  billingCycle: {
    type: String,
    required: true,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  gracePeriod: {
    type: Number,
    required: true,
    min: 0,
    default: 7
  },
  setupFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
subscriptionPlanSchema.index({ planType: 1, isActive: 1 });
subscriptionPlanSchema.index({ isPopular: 1, isActive: 1 });
subscriptionPlanSchema.index({ createdAt: -1 });

// Virtual for formatted pricing
subscriptionPlanSchema.virtual('formattedMonthlyCost').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.monthlyCost);
});

subscriptionPlanSchema.virtual('formattedYearlyCost').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.yearlyCost);
});

// Ensure virtuals are included in JSON output
subscriptionPlanSchema.set('toJSON', { virtuals: true });
subscriptionPlanSchema.set('toObject', { virtuals: true });

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan; 