import mongoose, { Document } from 'mongoose';

export interface ISupportTicketDocument extends Document {
  ticketId?: string; // Auto-generated
  hospitalId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'training' | 'integration' | 'general';
  subject: string;
  description: string;
  attachments?: string[];
  tags: string[];
  slaTarget?: Date; // Auto-generated
  firstResponseTime?: Date;
  resolutionTime?: Date;
  customerSatisfaction?: number; // 1-5 rating
  internalNotes?: string;
  isEscalated: boolean;
  escalationReason?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: false, // Will be auto-generated in pre-save middleware
    unique: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false // Make it optional since master admin might not have a hospital
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'],
    default: 'open'
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'feature_request', 'bug_report', 'training', 'integration', 'general'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  attachments: [{
    type: String // File URLs
  }],
  tags: [{
    type: String,
    trim: true
  }],
  slaTarget: {
    type: Date,
    required: false // Will be auto-generated in pre-save middleware
  },
  firstResponseTime: {
    type: Date
  },
  resolutionTime: {
    type: Date
  },
  customerSatisfaction: {
    type: Number,
    min: 1,
    max: 5
  },
  internalNotes: {
    type: String
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalationReason: {
    type: String
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
supportTicketSchema.index({ hospitalId: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ priority: 1, status: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ createdAt: -1 });

// Pre-save middleware to generate ticket ID and SLA target
supportTicketSchema.pre('save', function(next) {
  // Always generate ticket ID if not present
  if (!this.ticketId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.ticketId = `TKT-${timestamp}-${random}`;
  }
  
  // Always set SLA target if not present
  if (!this.slaTarget) {
    const now = new Date();
    switch (this.priority) {
      case 'critical':
        this.slaTarget = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours
        break;
      case 'high':
        this.slaTarget = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
        break;
      case 'medium':
        this.slaTarget = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
        break;
      case 'low':
        this.slaTarget = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        break;
      default:
        this.slaTarget = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // Default to 3 days
    }
  }
  
  next();
});

// Method to check if SLA is breached
supportTicketSchema.methods.isSLABreached = function() {
  return this.status !== 'closed' && this.status !== 'resolved' && new Date() > this.slaTarget;
};

// Method to get time to first response
supportTicketSchema.methods.getTimeToFirstResponse = function() {
  if (!this.firstResponseTime) return null;
  return this.firstResponseTime.getTime() - this.createdAt.getTime();
};

// Method to get time to resolution
supportTicketSchema.methods.getTimeToResolution = function() {
  if (!this.resolutionTime) return null;
  return this.resolutionTime.getTime() - this.createdAt.getTime();
};

export const SupportTicket = mongoose.models.SupportTicket || mongoose.model<ISupportTicketDocument>('SupportTicket', supportTicketSchema); 