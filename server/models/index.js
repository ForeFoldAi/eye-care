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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorAvailability = exports.Payment = exports.Prescription = exports.Appointment = exports.Patient = exports.User = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
// User Schema
var userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['doctor', 'receptionist'] },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    specialization: { type: String }, // For doctors
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
// Patient Schema
var patientSchema = new mongoose_1.default.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    medicalHistory: { type: String },
    createdAt: { type: Date, default: Date.now }
});
// Appointment Schema
var appointmentSchema = new mongoose_1.default.Schema({
    patientId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    datetime: { type: Date, required: true },
    type: { type: String, required: true, enum: ['consultation', 'checkup', 'follow-up'] },
    status: { type: String, required: true, default: 'scheduled', enum: ['scheduled', 'confirmed', 'completed', 'cancelled'] },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});
// Prescription Schema
var prescriptionSchema = new mongoose_1.default.Schema({
    patientId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Appointment' },
    medications: [{
            name: { type: String, required: true },
            dosage: { type: String, required: true },
            frequency: { type: String, required: true },
            duration: { type: String },
            quantity: { type: Number }
        }],
    instructions: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
// Payment Schema
var paymentSchema = new mongoose_1.default.Schema({
    patientId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Appointment' },
    amount: { type: Number, required: true },
    method: { type: String, required: true, enum: ['cash', 'card', 'insurance'] },
    status: { type: String, required: true, default: 'completed', enum: ['pending', 'completed', 'refunded'] },
    receiptNumber: { type: String, required: true },
    processedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});
// Doctor Availability Schema
var doctorAvailabilitySchema = new mongoose_1.default.Schema({
    doctorId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday, 6 = Saturday
    startTime: { type: String, required: true }, // Format: "HH:mm"
    endTime: { type: String, required: true }, // Format: "HH:mm"
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
// Create models only if they don't exist
exports.User = mongoose_1.default.models.User || mongoose_1.default.model('User', userSchema);
exports.Patient = mongoose_1.default.models.Patient || mongoose_1.default.model('Patient', patientSchema);
exports.Appointment = mongoose_1.default.models.Appointment || mongoose_1.default.model('Appointment', appointmentSchema);
exports.Prescription = mongoose_1.default.models.Prescription || mongoose_1.default.model('Prescription', prescriptionSchema);
exports.Payment = mongoose_1.default.models.Payment || mongoose_1.default.model('Payment', paymentSchema);
exports.DoctorAvailability = mongoose_1.default.models.DoctorAvailability || mongoose_1.default.model('DoctorAvailability', doctorAvailabilitySchema);
__exportStar(require("./user"), exports);
__exportStar(require("./patient"), exports);
__exportStar(require("./appointment"), exports);
__exportStar(require("./payment"), exports);
__exportStar(require("./receipt"), exports);
