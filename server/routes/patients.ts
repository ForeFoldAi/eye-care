import { Router } from 'express';
import { Patient } from '../models';
import { insertPatientSchema } from '../../shared/schema';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all patients
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json({
      data: {
        patients: patients.map(p => ({
          ...p.toObject(),
          id: p._id.toString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// Get patient by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient' });
  }
});

// Create new patient
router.post('/', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  try {
    const patientData = insertPatientSchema.parse(req.body);
    const existingPatient = await Patient.findOne({ phone: patientData.phone });

    if (existingPatient) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    const patient = new Patient(patientData);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Update patient
router.put('/:id', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  try {
    const patientData = insertPatientSchema.parse(req.body);
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      patientData,
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Delete patient
router.delete('/:id', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting patient' });
  }
});

export default router; 