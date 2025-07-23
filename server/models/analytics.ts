import mongoose, { Document } from 'mongoose';

export interface IAnalyticsDocument extends Document {
  hospitalId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  date: Date;
  metrics: {
    // User activity
    totalLogins: number;
    activeUsers: number;
    uniqueUsers: number;
    
    // Patient metrics
    totalPatients: number;
    newPatients: number;
    activePatients: number;
    
    // Appointment metrics
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    
    // Revenue metrics
    totalRevenue: number;
    pendingPayments: number;
    completedPayments: number;
    
    // System usage
    apiCalls: number;
    failedApiCalls: number;
    storageUsed: number; // in MB
    bandwidthUsed: number; // in MB
    
    // Feature usage
    appointmentsUsed: boolean;
    pharmacyUsed: boolean;
    labsUsed: boolean;
    prescriptionsUsed: boolean;
    billingUsed: boolean;
    reportsUsed: boolean;
    
    // Performance metrics
    averageResponseTime: number; // in ms
    errorRate: number; // percentage
    uptime: number; // percentage
  };
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    // User activity
    totalLogins: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    
    // Patient metrics
    totalPatients: {
      type: Number,
      default: 0
    },
    newPatients: {
      type: Number,
      default: 0
    },
    activePatients: {
      type: Number,
      default: 0
    },
    
    // Appointment metrics
    totalAppointments: {
      type: Number,
      default: 0
    },
    completedAppointments: {
      type: Number,
      default: 0
    },
    cancelledAppointments: {
      type: Number,
      default: 0
    },
    noShowAppointments: {
      type: Number,
      default: 0
    },
    
    // Revenue metrics
    totalRevenue: {
      type: Number,
      default: 0
    },
    pendingPayments: {
      type: Number,
      default: 0
    },
    completedPayments: {
      type: Number,
      default: 0
    },
    
    // System usage
    apiCalls: {
      type: Number,
      default: 0
    },
    failedApiCalls: {
      type: Number,
      default: 0
    },
    storageUsed: {
      type: Number,
      default: 0
    },
    bandwidthUsed: {
      type: Number,
      default: 0
    },
    
    // Feature usage
    appointmentsUsed: {
      type: Boolean,
      default: false
    },
    pharmacyUsed: {
      type: Boolean,
      default: false
    },
    labsUsed: {
      type: Boolean,
      default: false
    },
    prescriptionsUsed: {
      type: Boolean,
      default: false
    },
    billingUsed: {
      type: Boolean,
      default: false
    },
    reportsUsed: {
      type: Boolean,
      default: false
    },
    
    // Performance metrics
    averageResponseTime: {
      type: Number,
      default: 0
    },
    errorRate: {
      type: Number,
      default: 0
    },
    uptime: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
analyticsSchema.index({ hospitalId: 1, date: 1 });
analyticsSchema.index({ branchId: 1, date: 1 });
analyticsSchema.index({ date: 1 });

// Compound index for efficient date range queries
analyticsSchema.index({ hospitalId: 1, date: -1 });

// Method to calculate conversion rate
analyticsSchema.methods.getConversionRate = function() {
  if (this.metrics.totalAppointments === 0) return 0;
  return (this.metrics.completedAppointments / this.metrics.totalAppointments) * 100;
};

// Method to calculate API success rate
analyticsSchema.methods.getApiSuccessRate = function() {
  if (this.metrics.apiCalls === 0) return 100;
  return ((this.metrics.apiCalls - this.metrics.failedApiCalls) / this.metrics.apiCalls) * 100;
};

// Method to get revenue per appointment
analyticsSchema.methods.getRevenuePerAppointment = function() {
  if (this.metrics.completedAppointments === 0) return 0;
  return this.metrics.totalRevenue / this.metrics.completedAppointments;
};

export const Analytics = mongoose.models.Analytics || mongoose.model<IAnalyticsDocument>('Analytics', analyticsSchema); 