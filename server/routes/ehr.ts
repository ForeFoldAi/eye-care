import { Router } from 'express';
import { MedicalRecord, VitalSigns, LabResult, ClinicalNote, Immunization } from '../models/ehr';
import { Patient, User } from '../models';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const medicalRecordSchema = z.object({
  patientId: z.string(),
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
  followUpInstructions: z.string().optional()
});

const vitalSignsSchema = z.object({
  patientId: z.string(),
  temperature: z.object({
    value: z.number(),
    unit: z.enum(['celsius', 'fahrenheit'])
  }),
  bloodPressure: z.object({
    systolic: z.number(),
    diastolic: z.number()
  }),
  heartRate: z.object({
    value: z.number()
  }),
  respiratoryRate: z.object({
    value: z.number()
  }),
  oxygenSaturation: z.object({
    value: z.number()
  }),
  height: z.object({
    value: z.number(),
    unit: z.enum(['cm', 'ft'])
  }).optional(),
  weight: z.object({
    value: z.number(),
    unit: z.enum(['kg', 'lbs'])
  }).optional(),
  painScale: z.number().min(0).max(10).optional(),
  notes: z.string().optional()
});

// Medical Records Routes
router.get('/medical-records/patient/:patientId', authenticateToken, authorizeRole(['doctor', 'sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.params.patientId })
      .populate('doctorId', 'firstName lastName specialization')
      .populate('patientId', 'firstName lastName dateOfBirth')
      .populate('physicalExamination.vitalSigns')
      .sort({ createdAt: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medical records' });
  }
});

router.post('/medical-records', authenticateToken, authorizeRole(['doctor']), async (req: AuthRequest, res) => {
  try {
    const recordData = medicalRecordSchema.parse(req.body);
    
    const record = new MedicalRecord({
      ...recordData,
      doctorId: req.user?.id,
      hospitalId: req.user?.hospitalId,
      branchId: req.user?.branchId
    });

    await record.save();
    await record.populate('doctorId', 'firstName lastName specialization');
    await record.populate('patientId', 'firstName lastName dateOfBirth');
    
    res.status(201).json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Error creating medical record' });
    }
  }
});

router.put('/medical-records/:id', authenticateToken, authorizeRole(['doctor']), async (req: AuthRequest, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check if the doctor owns this record or has permission
    if (record.doctorId.toString() !== req.user?.id && !['admin', 'master_admin'].includes(req.user?.role || '')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = medicalRecordSchema.partial().parse(req.body);
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate('doctorId', 'firstName lastName specialization')
     .populate('patientId', 'firstName lastName dateOfBirth');

    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ message: 'Error updating medical record' });
  }
});

// Vital Signs Routes
router.get('/vital-signs/patient/:patientId', authenticateToken, authorizeRole(['doctor', 'receptionist', 'sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const vitalSigns = await VitalSigns.find({ patientId: req.params.patientId })
      .populate('recordedBy', 'firstName lastName role')
      .sort({ recordedAt: -1 })
      .limit(50); // Last 50 recordings
    
    res.json(vitalSigns);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vital signs' });
  }
});

router.post('/vital-signs', authenticateToken, authorizeRole(['doctor', 'receptionist']), async (req: AuthRequest, res) => {
  try {
    const vitalData = vitalSignsSchema.parse(req.body);
    
    const vitalSigns = new VitalSigns({
      ...vitalData,
      recordedBy: req.user?.id,
      hospitalId: req.user?.hospitalId,
      branchId: req.user?.branchId
    });

    await vitalSigns.save();
    await vitalSigns.populate('recordedBy', 'firstName lastName role');
    
    res.status(201).json(vitalSigns);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Error recording vital signs' });
    }
  }
});

// Lab Results Routes
router.get('/lab-results/patient/:patientId', authenticateToken, authorizeRole(['doctor', 'sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const labResults = await LabResult.find({ patientId: req.params.patientId })
      .populate('doctorId', 'firstName lastName specialization')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ resultDate: -1 });
    
    res.json(labResults);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lab results' });
  }
});

router.post('/lab-results', authenticateToken, authorizeRole(['doctor']), async (req: AuthRequest, res) => {
  try {
    const labData = req.body;
    
    const labResult = new LabResult({
      ...labData,
      doctorId: req.user?.id,
      hospitalId: req.user?.hospitalId,
      branchId: req.user?.branchId
    });

    await labResult.save();
    await labResult.populate('doctorId', 'firstName lastName specialization');
    
    res.status(201).json(labResult);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lab result' });
  }
});

// Clinical Notes Routes
router.get('/clinical-notes/patient/:patientId', authenticateToken, authorizeRole(['doctor', 'sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const notes = await ClinicalNote.find({ 
      patientId: req.params.patientId,
      $or: [
        { isConfidential: false },
        { authorId: req.user?.id },
        { $and: [{ isConfidential: true }, { $or: [{ role: 'admin' }, { role: 'master_admin' }] }] }
      ]
    })
      .populate('authorId', 'firstName lastName role')
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clinical notes' });
  }
});

router.post('/clinical-notes', authenticateToken, authorizeRole(['doctor', 'receptionist']), async (req: AuthRequest, res) => {
  try {
    const noteData = req.body;
    
    const note = new ClinicalNote({
      ...noteData,
      authorId: req.user?.id,
      hospitalId: req.user?.hospitalId,
      branchId: req.user?.branchId
    });

    await note.save();
    await note.populate('authorId', 'firstName lastName role');
    
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error creating clinical note' });
  }
});

// Immunization Routes
router.get('/immunizations/patient/:patientId', authenticateToken, authorizeRole(['doctor', 'receptionist', 'sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const immunizations = await Immunization.find({ patientId: req.params.patientId })
      .populate('administeredBy', 'firstName lastName role')
      .sort({ administrationDate: -1 });
    
    res.json(immunizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching immunizations' });
  }
});

router.post('/immunizations', authenticateToken, authorizeRole(['doctor', 'receptionist']), async (req: AuthRequest, res) => {
  try {
    const immunizationData = req.body;
    
    const immunization = new Immunization({
      ...immunizationData,
      administeredBy: req.user?.id,
      hospitalId: req.user?.hospitalId,
      branchId: req.user?.branchId
    });

    await immunization.save();
    await immunization.populate('administeredBy', 'firstName lastName role');
    
    res.status(201).json(immunization);
  } catch (error) {
    res.status(500).json({ message: 'Error recording immunization' });
  }
});

// EHR Summary for Patient
router.get('/summary/patient/:patientId', authenticateToken, authorizeRole(['doctor', 'sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const patientId = req.params.patientId;
    
    const [
      patient,
      latestVitals,
      recentRecords,
      activeAllergies,
      currentMedications,
      upcomingImmunizations
    ] = await Promise.all([
      Patient.findById(patientId),
      VitalSigns.findOne({ patientId }).sort({ recordedAt: -1 }),
      MedicalRecord.find({ patientId }).sort({ createdAt: -1 }).limit(5).populate('doctorId', 'firstName lastName'),
      MedicalRecord.aggregate([
        { $match: { patientId: new (await import('mongoose')).Types.ObjectId(patientId) } },
        { $unwind: '$allergies' },
        { $group: { _id: '$allergies.allergen', severity: { $last: '$allergies.severity' }, reaction: { $last: '$allergies.reaction' } } }
      ]),
      MedicalRecord.aggregate([
        { $match: { patientId: new (await import('mongoose')).Types.ObjectId(patientId) } },
        { $unwind: '$currentMedications' },
        { $match: { $or: [{ 'currentMedications.endDate': { $exists: false } }, { 'currentMedications.endDate': { $gte: new Date() } }] } },
        { $group: { _id: '$currentMedications.name', dosage: { $last: '$currentMedications.dosage' }, frequency: { $last: '$currentMedications.frequency' } } }
      ]),
      Immunization.find({ 
        patientId, 
        nextDueDate: { $gte: new Date(), $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } // Next 90 days
      }).sort({ nextDueDate: 1 })
    ]);

    res.json({
      patient,
      latestVitals,
      recentRecords,
      activeAllergies,
      currentMedications,
      upcomingImmunizations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching EHR summary' });
  }
});

// Analytics Routes
router.get('/analytics/patient-trends/:patientId', authenticateToken, authorizeRole(['doctor', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const patientId = req.params.patientId;
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const vitalTrends = await VitalSigns.find({
      patientId,
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: 1 });

    const recordCounts = await MedicalRecord.aggregate([
      { $match: { patientId: new (await import('mongoose')).Types.ObjectId(patientId), createdAt: { $gte: startDate } } },
      { $group: { _id: '$recordType', count: { $sum: 1 } } }
    ]);

    res.json({
      vitalTrends,
      recordCounts
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient trends' });
  }
});

export default router; 