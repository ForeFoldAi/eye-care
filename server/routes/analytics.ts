import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { Patient, Appointment, Payment, Department, User, Billing } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

// Get comprehensive analytics data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { hospitalId, branch, from, to } = req.query;

    // Validate hospitalId (required)
    if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId as string)) {
      return res.status(400).json({ message: 'Invalid or missing hospitalId' });
    }

    // Build filters
    const hospitalFilter = { hospitalId: new mongoose.Types.ObjectId(hospitalId as string) };
    const branchFilter = branch && branch !== 'all' ? { branchId: new mongoose.Types.ObjectId(branch as string) } : {};
    const dateFilter = from && to ? {
      createdAt: {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      }
    } : {};

    // Fetch data from the database
    const [
      totalPatients,
      totalAppointments,
      totalRevenue,
      totalDoctors,
      totalDepartments,
      recentPayments,
      recentAppointments,
      departments,
      topDoctors,
      billingData
    ] = await Promise.all([
      Patient.countDocuments({ ...hospitalFilter, ...branchFilter }),
      Appointment.countDocuments({ ...hospitalFilter, ...branchFilter, ...dateFilter }),
      Payment.aggregate([
        { $match: { ...hospitalFilter, ...branchFilter, ...dateFilter, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ ...hospitalFilter, ...branchFilter, role: 'doctor', isActive: true }),
      Department.countDocuments({ ...hospitalFilter, ...branchFilter }),
      Payment.find({ ...hospitalFilter, ...branchFilter, ...dateFilter, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(100),
      Appointment.find({ ...hospitalFilter, ...branchFilter, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(100),
      Department.find({ ...hospitalFilter, ...branchFilter })
        .populate('staff', 'firstName lastName')
        .lean(),
      User.find({ ...hospitalFilter, ...branchFilter, role: 'doctor', isActive: true })
        .populate('department', 'name') // Changed from departmentId to department
        .lean(),
      Billing.find({ ...hospitalFilter, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    ]);

    // Calculate metrics
    const totalRevenueAmount = totalRevenue[0]?.total || 0;
    const revenueGrowth = 0; // Replace with real calculation
    const patientGrowth = 0; // Replace with real calculation
    const appointmentGrowth = 0; // Replace with real calculation

    // Format response
    const analyticsData = {
      overview: {
        totalRevenue: totalRevenueAmount,
        revenueGrowth,
        totalPatients,
        patientGrowth,
        totalAppointments,
        appointmentGrowth,
        averageWaitTime: 0, // Replace with real data
        patientSatisfaction: 0, // Replace with real data
        totalDoctors,
        totalDepartments,
        averageAppointmentDuration: 0, // Replace with real data
        cancellationRate: 0 // Replace with real data
      },
      revenueChart: { labels: [], data: [] }, // Replace with real data
      patientChart: { labels: [], data: [] }, // Replace with real data
      departmentPerformance: [], // Replace with real data
      topDoctors: [], // Replace with real data
      operationalMetrics: {}, // Replace with real data
      paymentMethods: [], // Replace with real data
      monthlyTrends: [], // Replace with real data
      patientDemographics: [], // Replace with real data
      appointmentStatus: [] // Replace with real data
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Export analytics report
router.post('/export', authenticateToken, async (req, res) => {
  try {
    const { hospitalId, format, dateRange, branch } = req.body;
    
    // Mock export functionality
    const reportData = {
      generatedAt: new Date().toISOString(),
      hospitalId,
      dateRange,
      branch,
      format
    };

    if (format === 'pdf') {
      // Mock PDF generation
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');
      res.send(Buffer.from('Mock PDF content'));
    } else if (format === 'excel') {
      // Mock Excel generation
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.xlsx"');
      res.send(Buffer.from('Mock Excel content'));
    } else {
      res.status(400).json({ message: 'Unsupported format' });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export report', error: error.message });
  }
});

export default router; 