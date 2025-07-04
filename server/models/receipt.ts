import mongoose, { Document, Schema } from 'mongoose';

export interface IReceipt extends Document {
  receiptNumber: string;
  paymentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  pdfUrl?: string;
  metadata: {
    patientName: string;
    patientPhone: string;
    doctorName?: string;
    doctorSpecialization?: string;
    appointmentDate?: Date;
    appointmentType?: string;
    receptionistName: string;
  };
}

const receiptSchema = new Schema<IReceipt>({
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required'],
    unique: true,
    index: true
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: [true, 'Payment ID is required']
  },
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
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'card', 'insurance']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'refunded']
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Generated by user ID is required']
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  pdfUrl: {
    type: String
  },
  metadata: {
    patientName: {
      type: String,
      required: [true, 'Patient name is required']
    },
    patientPhone: {
      type: String,
      required: [true, 'Patient phone is required']
    },
    doctorName: String,
    doctorSpecialization: String,
    appointmentDate: Date,
    appointmentType: String,
    receptionistName: {
      type: String,
      required: [true, 'Receptionist name is required']
    }
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
receiptSchema.index({ paymentId: 1 });
receiptSchema.index({ patientId: 1 });
receiptSchema.index({ appointmentId: 1 });
receiptSchema.index({ generatedBy: 1 });
receiptSchema.index({ generatedAt: -1 });
receiptSchema.index({ 'metadata.patientName': 1 });
receiptSchema.index({ 'metadata.doctorName': 1 });

// Virtual populate for related data
receiptSchema.virtual('payment', {
  ref: 'Payment',
  localField: 'paymentId',
  foreignField: '_id',
  justOne: true
});

receiptSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

receiptSchema.virtual('appointment', {
  ref: 'Appointment',
  localField: 'appointmentId',
  foreignField: '_id',
  justOne: true
});

receiptSchema.virtual('generator', {
  ref: 'User',
  localField: 'generatedBy',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON output
receiptSchema.set('toJSON', { virtuals: true });
receiptSchema.set('toObject', { virtuals: true });

export const Receipt = mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', receiptSchema); 