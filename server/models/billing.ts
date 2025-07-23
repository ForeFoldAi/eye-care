import mongoose, { Document } from 'mongoose';

export interface IBillingDocument extends Document {
  invoiceId: string;
  hospitalId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  billingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: 'bank_transfer' | 'card' | 'upi' | 'cheque' | 'cash';
  transactionId?: string;
  description: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const billingSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    unique: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  billingPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'card', 'upi', 'cheque', 'cash']
  },
  transactionId: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  lineItems: [{
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  notes: {
    type: String
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
billingSchema.index({ hospitalId: 1, status: 1 });
billingSchema.index({ status: 1, dueDate: 1 });
billingSchema.index({ invoiceId: 1 });
billingSchema.index({ createdAt: -1 });

// Pre-save middleware to generate invoice ID and calculate totals
billingSchema.pre('save', function(next) {
  if (!this.invoiceId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.invoiceId = `INV-${timestamp}-${random}`;
  }
  
  // Calculate total amount if not set
  if (!this.totalAmount) {
    this.totalAmount = this.amount + this.taxAmount;
  }
  
  // Set due date if not set (30 days from creation)
  if (!this.dueDate) {
    this.dueDate = new Date(this.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Method to check if invoice is overdue
billingSchema.methods.isOverdue = function() {
  return this.status !== 'paid' && this.status !== 'cancelled' && new Date() > this.dueDate;
};

// Method to get days overdue
billingSchema.methods.getDaysOverdue = function() {
  if (!this.isOverdue()) return 0;
  const now = new Date();
  const diffTime = now.getTime() - this.dueDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Method to mark as paid
billingSchema.methods.markAsPaid = function(paymentMethod: string, transactionId?: string) {
  this.status = 'paid';
  this.paidDate = new Date();
  this.paymentMethod = paymentMethod;
  if (transactionId) {
    this.transactionId = transactionId;
  }
};

export const Billing = mongoose.models.Billing || mongoose.model<IBillingDocument>('Billing', billingSchema); 