import { Router } from 'express';
import authRoutes from './auth';
import patientRoutes from './patients';
import appointmentRoutes from './appointments';
import prescriptionRoutes from './prescriptions';
import paymentRoutes from './payments';
import { User, Appointment, Prescription, Payment } from '../models';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all doctors
router.get('/doctors', authenticateToken, async (req, res) => {
  try {
    const doctors = await User.find({ 
      role: 'doctor',
      isActive: true 
    }).select('firstName lastName specialization');
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Dashboard stats route
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const [
      totalPatients,
      totalAppointments,
      totalPrescriptions,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Prescription.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      totalPatients,
      totalAppointments,
      totalPrescriptions,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/payments', paymentRoutes);

export default router; 