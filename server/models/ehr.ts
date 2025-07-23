import mongoose, { Document } from 'mongoose';

// Medical Record Schema
export interface IMedicalRecordDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  recordType: 'consultation' | 'emergency' | 'surgery' | 'follow-up' | 'preventive';
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string[];
  familyHistory: string[];
  socialHistory: {
    smoking: 'never' | 'former' | 'current';
    alcohol: 'never' | 'occasional' | 'regular' | 'heavy';
    drugs: 'never' | 'former' | 'current';
    occupation: string;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  };
  allergies: {
    allergen: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe';
  }[];
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
  }[];
  physicalExamination: {
    generalAppearance: string;
    vitalSigns: mongoose.Types.ObjectId; // Reference to VitalSigns
    systemReview: {
      cardiovascular: string;
      respiratory: string;
      gastrointestinal: string;
      neurological: string;
      musculoskeletal: string;
      dermatological: string;
    };
  };
  assessment: string;
  plan: string;
  followUpInstructions: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Vital Signs Schema
export interface IVitalSignsDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  temperature: {
    value: number;
    unit: 'celsius' | 'fahrenheit';
  };
  bloodPressure: {
    systolic: number;
    diastolic: number;
    unit: 'mmHg';
  };
  heartRate: {
    value: number;
    unit: 'bpm';
  };
  respiratoryRate: {
    value: number;
    unit: 'breaths/min';
  };
  oxygenSaturation: {
    value: number;
    unit: '%';
  };
  height: {
    value: number;
    unit: 'cm' | 'ft';
  };
  weight: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  bmi: number;
  painScale: number; // 0-10
  recordedAt: Date;
  notes: string;
}

// Lab Results Schema
export interface ILabResultDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  testName: string;
  testCategory: 'blood' | 'urine' | 'imaging' | 'pathology' | 'microbiology' | 'other';
  orderDate: Date;
  collectionDate: Date;
  resultDate: Date;
  results: {
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  interpretation: string;
  technician: string;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  attachments: string[]; // File URLs
  notes: string;
}

// Clinical Notes Schema
export interface IClinicalNoteDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  noteType: 'progress' | 'discharge' | 'consultation' | 'nursing' | 'therapy' | 'other';
  title: string;
  content: string;
  tags: string[];
  isConfidential: boolean;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Immunization Record Schema
export interface IImmunizationDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  administeredBy: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  vaccineName: string;
  manufacturer: string;
  lotNumber: string;
  expirationDate: Date;
  administrationDate: Date;
  administrationSite: string;
  route: 'oral' | 'intramuscular' | 'subcutaneous' | 'intradermal' | 'nasal';
  dose: string;
  nextDueDate?: Date;
  reactions: string[];
  notes: string;
}

// Medical Record Schema Definition
const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  recordType: { 
    type: String, 
    enum: ['consultation', 'emergency', 'surgery', 'follow-up', 'preventive'],
    required: true 
  },
  chiefComplaint: { type: String, required: true },
  historyOfPresentIllness: { type: String, required: true },
  pastMedicalHistory: [{ type: String }],
  familyHistory: [{ type: String }],
  socialHistory: {
    smoking: { type: String, enum: ['never', 'former', 'current'] },
    alcohol: { type: String, enum: ['never', 'occasional', 'regular', 'heavy'] },
    drugs: { type: String, enum: ['never', 'former', 'current'] },
    occupation: { type: String },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] }
  },
  allergies: [{
    allergen: { type: String, required: true },
    reaction: { type: String, required: true },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true }
  }],
  currentMedications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date }
  }],
  physicalExamination: {
    generalAppearance: { type: String },
    vitalSigns: { type: mongoose.Schema.Types.ObjectId, ref: 'VitalSigns' },
    systemReview: {
      cardiovascular: { type: String },
      respiratory: { type: String },
      gastrointestinal: { type: String },
      neurological: { type: String },
      musculoskeletal: { type: String },
      dermatological: { type: String }
    }
  },
  assessment: { type: String, required: true },
  plan: { type: String, required: true },
  followUpInstructions: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Vital Signs Schema Definition
const vitalSignsSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  temperature: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' }
  },
  bloodPressure: {
    systolic: { type: Number, required: true },
    diastolic: { type: Number, required: true },
    unit: { type: String, default: 'mmHg' }
  },
  heartRate: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'bpm' }
  },
  respiratoryRate: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'breaths/min' }
  },
  oxygenSaturation: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' }
  },
  height: {
    value: { type: Number },
    unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
  },
  weight: {
    value: { type: Number },
    unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
  },
  bmi: { type: Number },
  painScale: { type: Number, min: 0, max: 10 },
  recordedAt: { type: Date, default: Date.now },
  notes: { type: String }
});

// Lab Results Schema Definition
const labResultSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  testName: { type: String, required: true },
  testCategory: { 
    type: String, 
    enum: ['blood', 'urine', 'imaging', 'pathology', 'microbiology', 'other'],
    required: true 
  },
  orderDate: { type: Date, required: true },
  collectionDate: { type: Date, required: true },
  resultDate: { type: Date, required: true },
  results: [{
    parameter: { type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String, required: true },
    referenceRange: { type: String, required: true },
    status: { type: String, enum: ['normal', 'abnormal', 'critical'], required: true }
  }],
  interpretation: { type: String },
  technician: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{ type: String }],
  notes: { type: String }
});

// Clinical Notes Schema Definition
const clinicalNoteSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  noteType: { 
    type: String, 
    enum: ['progress', 'discharge', 'consultation', 'nursing', 'therapy', 'other'],
    required: true 
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  isConfidential: { type: Boolean, default: false },
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Immunization Schema Definition
const immunizationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  vaccineName: { type: String, required: true },
  manufacturer: { type: String, required: true },
  lotNumber: { type: String, required: true },
  expirationDate: { type: Date, required: true },
  administrationDate: { type: Date, required: true },
  administrationSite: { type: String, required: true },
  route: { 
    type: String, 
    enum: ['oral', 'intramuscular', 'subcutaneous', 'intradermal', 'nasal'],
    required: true 
  },
  dose: { type: String, required: true },
  nextDueDate: { type: Date },
  reactions: [{ type: String }],
  notes: { type: String }
});

// Add pre-save middleware for updated timestamps
medicalRecordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

clinicalNoteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate BMI automatically
vitalSignsSchema.pre('save', function(next) {
  if (this.height?.value && this.weight?.value) {
    let heightInMeters = this.height.value;
    let weightInKg = this.weight.value;
    
    // Convert height to meters if in feet
    if (this.height.unit === 'ft') {
      heightInMeters = this.height.value * 0.3048;
    } else {
      heightInMeters = this.height.value / 100; // cm to meters
    }
    
    // Convert weight to kg if in lbs
    if (this.weight.unit === 'lbs') {
      weightInKg = this.weight.value * 0.453592;
    }
    
    this.bmi = Number((weightInKg / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

export const MedicalRecord = mongoose.models.MedicalRecord || mongoose.model<IMedicalRecordDocument>('MedicalRecord', medicalRecordSchema);
export const VitalSigns = mongoose.models.VitalSigns || mongoose.model<IVitalSignsDocument>('VitalSigns', vitalSignsSchema);
export const LabResult = mongoose.models.LabResult || mongoose.model<ILabResultDocument>('LabResult', labResultSchema);
export const ClinicalNote = mongoose.models.ClinicalNote || mongoose.model<IClinicalNoteDocument>('ClinicalNote', clinicalNoteSchema);
export const Immunization = mongoose.models.Immunization || mongoose.model<IImmunizationDocument>('Immunization', immunizationSchema);

export default {
  MedicalRecord,
  VitalSigns,
  LabResult,
  ClinicalNote,
  Immunization
}; 