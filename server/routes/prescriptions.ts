import { Router } from 'express';
import { Prescription } from '../models/prescription';
import { insertPrescriptionSchema } from '../shared/schema';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { connectDB } from '../db/connect';

const router = Router();

// Get all prescriptions
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const prescriptions = await Prescription.find()
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('appointmentId')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescriptions' });
  }
});

// Get prescription by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('appointmentId');
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescription' });
  }
});

// Create new prescription
router.post('/', authenticateToken, authorizeRole(['doctor']), async (req: AuthRequest, res) => {
  console.log('POST /api/prescriptions body:', req.body);
  await connectDB();
  try {
    const prescriptionData = insertPrescriptionSchema.parse(req.body);
    const prescription = new Prescription(prescriptionData);
    await prescription.save();
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('appointmentId');
    res.status(201).json(populatedPrescription);
  } catch (validationError) {
    console.error('Prescription validation error:', validationError);
    res.status(400).json({ message: 'Invalid request data', error: validationError });
  }
});

// Update prescription
router.put('/:id', authenticateToken, authorizeRole(['doctor']), async (req: AuthRequest, res) => {
  try {
    const prescriptionData = insertPrescriptionSchema.parse(req.body);
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      prescriptionData,
      { new: true }
    ).populate('patientId', 'firstName lastName phone')
     .populate('doctorId', 'firstName lastName specialization')
     .populate('appointmentId');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Delete prescription
router.delete('/:id', authenticateToken, authorizeRole(['doctor']), async (req: AuthRequest, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting prescription' });
  }
});

export default router; 