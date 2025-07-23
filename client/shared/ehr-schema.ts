import { z } from 'zod';

// Medical Record Schema
export const medicalRecordSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string(),
  doctorId: z.string(),
  hospitalId: z.string(),
  branchId: z.string(),
  recordType: z.enum(['consultation', 'emergency', 'surgery', 'follow-up', 'preventive']),
  chiefComplaint: z.string(),
  historyOfPresentIllness: z.string(),
  pastMedicalHistory: z.array(z.string()).optional(),
  familyHistory: z.array(z.string()).optional(),
  socialHistory: z.object({
    smoking: z.enum(['never', 'former', 'current']).optional(),
    alcohol: z.enum(['never', 'occasional', 'regular', 'heavy']).optional(),
    drugs: z.enum(['never', 'former', 'current']).optional(),
    occupation: z.string().optional(),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional()
  }).optional(),
  allergies: z.array(z.object({
    allergen: z.string(),
    reaction: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe'])
  })).optional(),
  currentMedications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.string(),
    endDate: z.string().optional()
  })).optional(),
  physicalExamination: z.object({
    generalAppearance: z.string().optional(),
    vitalSigns: z.string().optional(), // ObjectId reference
    systemReview: z.object({
      cardiovascular: z.string().optional(),
      respiratory: z.string().optional(),
      gastrointestinal: z.string().optional(),
      neurological: z.string().optional(),
      musculoskeletal: z.string().optional(),
      dermatological: z.string().optional()
    }).optional()
  }).optional(),
  assessment: z.string(),
  plan: z.string(),
  followUpInstructions: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Vital Signs Schema
export const vitalSignsSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string(),
  recordedBy: z.string(),
  hospitalId: z.string(),
  branchId: z.string(),
  temperature: z.object({
    value: z.number(),
    unit: z.enum(['celsius', 'fahrenheit'])
  }),
  bloodPressure: z.object({
    systolic: z.number(),
    diastolic: z.number(),
    unit: z.string().default('mmHg')
  }),
  heartRate: z.object({
    value: z.number(),
    unit: z.string().default('bpm')
  }),
  respiratoryRate: z.object({
    value: z.number(),
    unit: z.string().default('breaths/min')
  }),
  oxygenSaturation: z.object({
    value: z.number(),
    unit: z.string().default('%')
  }),
  height: z.object({
    value: z.number(),
    unit: z.enum(['cm', 'ft'])
  }).optional(),
  weight: z.object({
    value: z.number(),
    unit: z.enum(['kg', 'lbs'])
  }).optional(),
  bmi: z.number().optional(),
  painScale: z.number().min(0).max(10).optional(),
  recordedAt: z.string(),
  notes: z.string().optional()
});

// Lab Results Schema
export const labResultSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string(),
  doctorId: z.string(),
  hospitalId: z.string(),
  branchId: z.string(),
  testName: z.string(),
  testCategory: z.enum(['blood', 'urine', 'imaging', 'pathology', 'microbiology', 'other']),
  orderDate: z.string(),
  collectionDate: z.string(),
  resultDate: z.string(),
  results: z.array(z.object({
    parameter: z.string(),
    value: z.string(),
    unit: z.string(),
    referenceRange: z.string(),
    status: z.enum(['normal', 'abnormal', 'critical'])
  })),
  interpretation: z.string().optional(),
  technician: z.string(),
  isVerified: z.boolean().default(false),
  verifiedBy: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  notes: z.string().optional()
});

// Clinical Notes Schema
export const clinicalNoteSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string(),
  authorId: z.string(),
  hospitalId: z.string(),
  branchId: z.string(),
  noteType: z.enum(['progress', 'discharge', 'consultation', 'nursing', 'therapy', 'other']),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().default(false),
  attachments: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Immunization Schema
export const immunizationSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string(),
  administeredBy: z.string(),
  hospitalId: z.string(),
  branchId: z.string(),
  vaccineName: z.string(),
  manufacturer: z.string(),
  lotNumber: z.string(),
  expirationDate: z.string(),
  administrationDate: z.string(),
  administrationSite: z.string(),
  route: z.enum(['oral', 'intramuscular', 'subcutaneous', 'intradermal', 'nasal']),
  dose: z.string(),
  nextDueDate: z.string().optional(),
  reactions: z.array(z.string()).optional(),
  notes: z.string().optional()
});

// EHR Summary Schema
export const ehrSummarySchema = z.object({
  patient: z.object({
    _id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    gender: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string().optional()
  }),
  latestVitals: vitalSignsSchema.optional(),
  recentRecords: z.array(medicalRecordSchema).optional(),
  activeAllergies: z.array(z.object({
    _id: z.string(),
    severity: z.string(),
    reaction: z.string()
  })).optional(),
  currentMedications: z.array(z.object({
    _id: z.string(),
    dosage: z.string(),
    frequency: z.string()
  })).optional(),
  upcomingImmunizations: z.array(immunizationSchema).optional()
});

// Type exports
export type MedicalRecord = z.infer<typeof medicalRecordSchema>;
export type VitalSigns = z.infer<typeof vitalSignsSchema>;
export type LabResult = z.infer<typeof labResultSchema>;
export type ClinicalNote = z.infer<typeof clinicalNoteSchema>;
export type Immunization = z.infer<typeof immunizationSchema>;
export type EHRSummary = z.infer<typeof ehrSummarySchema>;

// Form schemas for creating/updating
export const createMedicalRecordSchema = medicalRecordSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
  doctorId: true,
  hospitalId: true,
  branchId: true
});

export const createVitalSignsSchema = vitalSignsSchema.omit({
  _id: true,
  recordedAt: true,
  recordedBy: true,
  hospitalId: true,
  branchId: true,
  bmi: true
});

export const createLabResultSchema = labResultSchema.omit({
  _id: true,
  doctorId: true,
  hospitalId: true,
  branchId: true,
  isVerified: true,
  verifiedBy: true
});

export const createClinicalNoteSchema = clinicalNoteSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  hospitalId: true,
  branchId: true
});

export const createImmunizationSchema = immunizationSchema.omit({
  _id: true,
  administeredBy: true,
  hospitalId: true,
  branchId: true
});

export type CreateMedicalRecord = z.infer<typeof createMedicalRecordSchema>;
export type CreateVitalSigns = z.infer<typeof createVitalSignsSchema>;
export type CreateLabResult = z.infer<typeof createLabResultSchema>;
export type CreateClinicalNote = z.infer<typeof createClinicalNoteSchema>;
export type CreateImmunization = z.infer<typeof createImmunizationSchema>; 