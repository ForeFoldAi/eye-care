"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
var mongoose_1 = __importStar(require("mongoose"));
var paymentSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required']
    },
    appointmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.Payment = mongoose_1.default.models.Payment || mongoose_1.default.model('Payment', paymentSchema);
