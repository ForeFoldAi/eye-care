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

// Dashboard stats route (for /dashboard/stats)
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get this week's date range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Count new patients this week
    const newPatients = await User.countDocuments({
      createdAt: { $gte: startOfWeek },
      role: 'patient',
      isActive: true
    });

    // Count total active patients
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });

    // Count patients registered today
    const patientsToday = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      role: 'patient',
      isActive: true
    });

    // TODO: Add appointments, payments, cancellations if needed
    const stats = {
      todayAppointments: 0,
      newPatients,
      paymentsToday: 0,
      cancellations: 0,
      totalPatients,
      patientsToday
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/payments', paymentRoutes);

export default router; 