import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  patientId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  amount: number;
  method: 'cash' | 'card' | 'insurance';
  status: 'pending' | 'completed' | 'refunded';
  receiptNumber: string;
  processedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

const paymentSchema = new Schema<IPayment>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'card', 'insurance']
  },
  status: {
    type: String,
    required: true,
    default: 'completed',
    enum: ['pending', 'completed', 'refunded']
  },
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required'],
    unique: true
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Processed by user ID is required']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
paymentSchema.index({ patientId: 1, createdAt: -1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ receiptNumber: 1 }, { unique: true });
paymentSchema.index({ method: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ processedBy: 1 });

// Virtual populate for related data
paymentSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

paymentSchema.virtual('appointment', {
  ref: 'Appointment',
  localField: 'appointmentId',
  foreignField: '_id',
  justOne: true
});

paymentSchema.virtual('processor', {
  ref: 'User',
  localField: 'processedBy',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON output
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema); 