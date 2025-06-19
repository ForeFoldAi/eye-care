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
exports.Appointment = void 0;
var mongoose_1 = __importStar(require("mongoose"));
var appointmentSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required']
    },
    doctorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Doctor ID is required']
    },
    datetime: {
        type: Date,
        required: [true, 'Appointment date and time is required']
    },
    type: {
        type: String,
        required: [true, 'Appointment type is required'],
        enum: ['consultation', 'checkup', 'follow-up']
    },
    status: {
        type: String,
        required: true,
        default: 'scheduled',
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled']
    },
    tokenNumber: {
        type: Number,
        required: [true, 'Token number is required'],
        min: 1
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});
// Create indexes
appointmentSchema.index({ patientId: 1, datetime: 1 });
appointmentSchema.index({ doctorId: 1, datetime: 1 });
appointmentSchema.index({ doctorId: 1, datetime: 1, tokenNumber: 1 }, { unique: true });
exports.Appointment = mongoose_1.default.models.Appointment || mongoose_1.default.model('Appointment', appointmentSchema);
