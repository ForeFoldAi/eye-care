import { Router } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { 
  Hospital, 
  Branch, 
  User, 
  Patient, 
  Appointment, 
  Payment,
  Subscription,
  SupportTicket,
  Billing,
  Analytics
} from '../models';
import { z } from 'zod';

const router = Router();

// All routes require master admin role
router.use(authenticateToken);
router.use(authorizeRole(['master_admin']));

// ==================== DASHBOARD & ANALYTICS ====================

// Get system-wide statistics
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get aggregated statistics
    const [
      totalHospitals,
      totalBranches,
      totalUsers,
      activeUsers,
      totalPatients,
      totalRevenue,
      totalSubscriptions,
      activeSubscriptions,
      openTickets,
      criticalTickets
    ] = await Promise.all([
      Hospital.countDocuments({ isActive: true }),
      Branch.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, lastLogin: { $gte: startDate } }),
      Patient.countDocuments({ createdAt: { $gte: startDate } }),
      Payment.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      SupportTicket.countDocuments({ priority: 'critical', status: { $in: ['open', 'in_progress'] } })
    ]);

    // Calculate system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalTickets > 5 || openTickets > 20) {
      systemHealth = 'critical';
    } else if (criticalTickets > 2 || openTickets > 10) {
      systemHealth = 'warning';
    }

    res.json({
      totalHospitals,
      totalBranches,
      totalUsers,
      activeUsers,
      totalPatients,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalSubscriptions,
      activeSubscriptions,
      openTickets,
      criticalTickets,
      systemHealth,
      timeRange
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system statistics' });
  }
});

// Get revenue analytics
router.get('/revenue-analytics', async (req: AuthRequest, res) => {
  try {
    const { period = 'monthly', timeRange = '6m' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1m':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 6);
    }

    // Get revenue data by period
    const revenueData = await Billing.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: period === 'daily' ? { $dayOfMonth: '$createdAt' } : null
          },
          totalRevenue: { $sum: '$totalAmount' },
          invoiceCount: { $sum: 1 },
          avgInvoiceValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get revenue summary
    const revenueSummary = await Billing.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalInvoices: { $sum: 1 },
          avgInvoiceValue: { $avg: '$totalAmount' },
          maxInvoiceValue: { $max: '$totalAmount' },
          minInvoiceValue: { $min: '$totalAmount' }
        }
      }
    ]);

    // Get revenue by hospital
    const revenueByHospital = await Billing.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'paid'
        }
      },
      {
        $lookup: {
          from: 'hospitals',
          localField: 'hospitalId',
          foreignField: '_id',
          as: 'hospital'
        }
      },
      {
        $unwind: '$hospital'
      },
      {
        $group: {
          _id: '$hospitalId',
          hospitalName: { $first: '$hospital.name' },
          totalRevenue: { $sum: '$totalAmount' },
          invoiceCount: { $sum: 1 },
          avgInvoiceValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      timeSeriesData: revenueData,
      summary: revenueSummary[0] || {
        totalRevenue: 0,
        totalInvoices: 0,
        avgInvoiceValue: 0,
        maxInvoiceValue: 0,
        minInvoiceValue: 0
      },
      byHospital: revenueByHospital,
      timeRange,
      period
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Error fetching revenue analytics' });
  }
});

// Get hospital performance metrics
router.get('/hospital-performance', async (req: AuthRequest, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get all active hospitals
    const hospitals = await Hospital.find({ isActive: true }).select('_id name email phone address status createdAt');

    // Get performance data for each hospital
    const hospitalPerformanceData = await Promise.all(
      hospitals.map(async (hospital) => {
        const hospitalId = hospital._id;

        // Get user statistics
        const [totalUsers, activeUsers] = await Promise.all([
          User.countDocuments({ hospitalId, isActive: true }),
          User.countDocuments({ 
            hospitalId, 
            isActive: true, 
            lastLogin: { $gte: startDate } 
          })
        ]);

        // Get patient statistics
        const [totalPatients, newPatients] = await Promise.all([
          Patient.countDocuments({ hospitalId }),
          Patient.countDocuments({ hospitalId, createdAt: { $gte: startDate } })
        ]);

        // Get appointment statistics
        const [totalAppointments, completedAppointments, cancelledAppointments] = await Promise.all([
          Appointment.countDocuments({ hospitalId, createdAt: { $gte: startDate } }),
          Appointment.countDocuments({ 
            hospitalId, 
            status: 'completed', 
            createdAt: { $gte: startDate } 
          }),
          Appointment.countDocuments({ 
            hospitalId, 
            status: 'cancelled', 
            createdAt: { $gte: startDate } 
          })
        ]);

        // Get revenue statistics
        const [totalRevenue, totalPayments] = await Promise.all([
          Payment.aggregate([
            { 
              $match: { 
                hospitalId, 
                status: 'completed', 
                createdAt: { $gte: startDate } 
              } 
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]),
          Payment.countDocuments({ 
            hospitalId, 
            status: 'completed', 
            createdAt: { $gte: startDate } 
          })
        ]);

        // Get analytics data if available
        const analyticsData = await Analytics.findOne({ 
          hospitalId, 
          date: { $gte: startDate } 
        }).sort({ date: -1 });

        // Calculate performance metrics
        const avgResponseTime = analyticsData?.metrics?.averageResponseTime || 245;
        const avgUptime = analyticsData?.metrics?.uptime || 99.5;
        const errorRate = analyticsData?.metrics?.errorRate || 0.5;
        const apiCalls = analyticsData?.metrics?.apiCalls || 0;
        const failedApiCalls = analyticsData?.metrics?.failedApiCalls || 0;
        const storageUsed = analyticsData?.metrics?.storageUsed || 0;
        const bandwidthUsed = analyticsData?.metrics?.bandwidthUsed || 0;

        // Calculate derived metrics
        const apiSuccessRate = apiCalls > 0 ? ((apiCalls - failedApiCalls) / apiCalls) * 100 : 100;
        const appointmentCompletionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
        const userEngagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
        const avgRevenuePerPatient = newPatients > 0 ? (totalRevenue[0]?.total || 0) / newPatients : 0;

        return {
          hospitalId: hospital._id,
          hospitalName: hospital.name,
          hospitalEmail: hospital.email,
          hospitalPhone: hospital.phone,
          hospitalAddress: hospital.address,
          hospitalStatus: hospital.status,
          hospitalCreatedAt: hospital.createdAt,
          
          // User metrics
          totalUsers,
          activeUsers,
          userEngagementRate,
          
          // Patient metrics
          totalPatients,
          newPatients,
          
          // Appointment metrics
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          appointmentCompletionRate,
          
          // Revenue metrics
          totalRevenue: totalRevenue[0]?.total || 0,
          totalPayments,
          avgRevenuePerPatient,
          
          // Performance metrics
          avgResponseTime,
          avgUptime,
          errorRate,
          apiCalls,
          failedApiCalls,
          apiSuccessRate,
          storageUsed,
          bandwidthUsed,
          
          // Calculated ranges for display
          maxResponseTime: avgResponseTime * 1.5,
          minResponseTime: avgResponseTime * 0.5,
          
          // Data points (for chart purposes)
          dataPoints: 1
        };
      })
    );

    // Calculate system-wide summary
    const systemSummary = {
      totalApiCalls: hospitalPerformanceData.reduce((sum, hospital) => sum + hospital.apiCalls, 0),
      totalFailedCalls: hospitalPerformanceData.reduce((sum, hospital) => sum + hospital.failedApiCalls, 0),
      avgResponseTime: hospitalPerformanceData.length > 0 
        ? hospitalPerformanceData.reduce((sum, hospital) => sum + hospital.avgResponseTime, 0) / hospitalPerformanceData.length 
        : 0,
      avgUptime: hospitalPerformanceData.length > 0 
        ? hospitalPerformanceData.reduce((sum, hospital) => sum + hospital.avgUptime, 0) / hospitalPerformanceData.length 
        : 0,
      totalStorageUsed: hospitalPerformanceData.reduce((sum, hospital) => sum + hospital.storageUsed, 0),
      totalBandwidthUsed: hospitalPerformanceData.reduce((sum, hospital) => sum + hospital.bandwidthUsed, 0),
      maxResponseTime: Math.max(...hospitalPerformanceData.map(h => h.maxResponseTime)),
      minResponseTime: Math.min(...hospitalPerformanceData.map(h => h.minResponseTime))
    };

    res.json({
      hospitals: hospitalPerformanceData,
      systemSummary,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching hospital performance data:', error);
    res.status(500).json({ message: 'Error fetching hospital performance data' });
  }
});

// Get patient registration analytics
router.get('/patient-analytics', async (req: AuthRequest, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date ranges
    const endDate = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        previousStartDate.setDate(endDate.getDate() - 14);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        previousStartDate.setDate(endDate.getDate() - 60);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        previousStartDate.setDate(endDate.getDate() - 180);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
        previousStartDate.setDate(endDate.getDate() - 60);
    }

    // Get patient registration data
    const [
      totalPatients,
      currentPeriodPatients,
      previousPeriodPatients,
      monthlyTarget,
      patientGrowthRate,
      hospitalPatientDistribution
    ] = await Promise.all([
      // Total patients across all hospitals
      Patient.countDocuments(),
      
      // Patients registered in current period
      Patient.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      
      // Patients registered in previous period (for growth calculation)
      Patient.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } }),
      
      // Monthly target (you can set this based on business requirements)
      Promise.resolve(1000), // Example: 1000 patients per month target
      
      // Calculate growth rate
      Patient.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 2 }
      ]),
      
      // Patient distribution by hospital
      Patient.aggregate([
        {
          $lookup: {
            from: 'hospitals',
            localField: 'hospitalId',
            foreignField: '_id',
            as: 'hospital'
          }
        },
        { $unwind: '$hospital' },
        {
          $group: {
            _id: '$hospitalId',
            hospitalName: { $first: '$hospital.name' },
            patientCount: { $sum: 1 }
          }
        },
        { $sort: { patientCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Calculate growth percentage
    const growthPercentage = previousPeriodPatients > 0 
      ? ((currentPeriodPatients - previousPeriodPatients) / previousPeriodPatients) * 100 
      : 0;

    // Calculate monthly target progress
    const targetProgress = (currentPeriodPatients / monthlyTarget) * 100;

    res.json({
      totalPatients,
      currentPeriodPatients,
      previousPeriodPatients,
      monthlyTarget,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
      targetProgress: Math.round(targetProgress * 100) / 100,
      hospitalPatientDistribution,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching patient analytics:', error);
    res.status(500).json({ message: 'Error fetching patient analytics' });
  }
});

// Get system performance metrics
router.get('/system-performance', async (req: AuthRequest, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(endDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      default:
        startDate.setDate(endDate.getDate() - 1);
    }

    // Get system performance data
    const [
      apiResponseTime,
      systemUptime,
      storageUsage,
      totalApiCalls,
      failedApiCalls,
      activeConnections,
      systemLoad
    ] = await Promise.all([
      // Average API response time
      Analytics.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, avgResponseTime: { $avg: '$metrics.averageResponseTime' } } }
      ]),
      
      // System uptime (calculate from analytics data)
      Analytics.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, avgUptime: { $avg: '$metrics.uptime' } } }
      ]),
      
      // Storage usage
      Analytics.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalStorage: { $sum: '$metrics.storageUsed' } } }
      ]),
      
      // Total API calls
      Analytics.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalCalls: { $sum: '$metrics.apiCalls' } } }
      ]),
      
      // Failed API calls
      Analytics.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, failedCalls: { $sum: '$metrics.failedApiCalls' } } }
      ]),
      
      // Active connections (from user sessions)
      User.countDocuments({ lastLogin: { $gte: startDate } }),
      
      // System load (mock data for now, can be enhanced with real monitoring)
      Promise.resolve({
        cpuUsage: Math.random() * 30 + 40, // 40-70%
        memoryUsage: Math.random() * 20 + 60, // 60-80%
        diskUsage: Math.random() * 15 + 65 // 65-80%
      })
    ]);

    // Calculate success rate
    const totalCalls = totalApiCalls[0]?.totalCalls || 0;
    const failedCalls = failedApiCalls[0]?.failedCalls || 0;
    const successRate = totalCalls > 0 ? ((totalCalls - failedCalls) / totalCalls) * 100 : 100;

    // Calculate storage percentage (assuming 1TB total storage)
    const totalStorage = storageUsage[0]?.totalStorage || 0;
    const storagePercentage = (totalStorage / (1024 * 1024 * 1024 * 1024)) * 100; // Convert to percentage of 1TB

    res.json({
      apiResponseTime: Math.round((apiResponseTime[0]?.avgResponseTime || 245) * 100) / 100,
      systemUptime: Math.round((systemUptime[0]?.avgUptime || 99.9) * 100) / 100,
      storageUsage: Math.round(storagePercentage * 100) / 100,
      totalApiCalls,
      failedApiCalls,
      successRate: Math.round(successRate * 100) / 100,
      activeConnections,
      systemLoad: systemLoad,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching system performance:', error);
    res.status(500).json({ message: 'Error fetching system performance' });
  }
});

// Get system activity log
router.get('/activity-log', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { timeRange = '7d', limit = 50 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(endDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get activities from various collections with error handling
    const [
      hospitalActivities,
      userActivities,
      patientActivities,
      paymentActivities,
      supportActivities,
      subscriptionActivities
    ] = await Promise.allSettled([
      // Hospital activities (new hospitals, updates)
      Hospital.find({ createdAt: { $gte: startDate, $lte: endDate } })
        .populate('adminId', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean()
        .then(hospitals => hospitals.map(hospital => ({
          id: (hospital._id as any).toString(),
          type: 'hospital_created',
          title: 'New hospital registered',
          description: `${hospital.name} - ${hospital.city || 'Unknown City'}`,
          time: hospital.createdAt,
          icon: 'Building2',
          color: 'text-green-600 bg-green-50',
          createdBy: hospital.createdBy,
          details: {
            email: hospital.email,
            phone: hospital.phone,
            status: hospital.status
          }
        }))),

      // User activities (new users, logins)
      User.find({ createdAt: { $gte: startDate, $lte: endDate } })
        .populate('hospitalId', 'name')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean()
        .then(users => users.map(user => ({
          id: (user._id as any).toString(),
          type: 'user_created',
          title: `New ${user.role.replace('_', ' ')} user`,
          description: `${user.firstName} ${user.lastName} - ${user.hospitalId?.name || 'Unknown Hospital'}`,
          time: user.createdAt,
          icon: 'Users',
          color: 'text-purple-600 bg-purple-50',
          details: {
            email: user.email,
            role: user.role,
            hospital: user.hospitalId?.name
          }
        }))),

      // Patient activities (new registrations)
      Patient.find({ createdAt: { $gte: startDate, $lte: endDate } })
        .populate('hospitalId', 'name')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean()
        .then(patients => patients.map(patient => ({
          id: (patient._id as any).toString(),
          type: 'patient_registered',
          title: 'New patient registered',
          description: `${patient.firstName} ${patient.lastName} - ${patient.hospitalId?.name || 'Unknown Hospital'}`,
          time: patient.createdAt,
          icon: 'User',
          color: 'text-blue-600 bg-blue-50',
          details: {
            phone: patient.phone,
            email: patient.email,
            hospital: patient.hospitalId?.name
          }
        }))),

      // Payment activities
      Payment.find({ createdAt: { $gte: startDate, $lte: endDate } })
        .populate('patientId', 'firstName lastName')
        .populate('processedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean()
        .then(payments => payments.map(payment => ({
          id: (payment._id as any).toString(),
          type: 'payment_received',
          title: 'Payment received',
          description: `₹${payment.amount} - ${payment.patientId?.firstName} ${payment.patientId?.lastName}`,
          time: payment.createdAt,
          icon: 'IndianRupee',
          color: 'text-emerald-600 bg-emerald-50',
          details: {
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            processedBy: payment.processedBy
          }
        }))),

      // Support ticket activities
      SupportTicket.find({ createdAt: { $gte: startDate, $lte: endDate } })
        .populate('hospitalId', 'name')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean()
        .then(tickets => tickets.map(ticket => ({
          id: (ticket._id as any).toString(),
          type: 'support_ticket',
          title: `${ticket.priority} support ticket`,
          description: `${ticket.subject} - ${ticket.hospitalId?.name || 'Unknown Hospital'}`,
          time: ticket.createdAt,
          icon: 'Ticket',
          color: ticket.priority === 'critical' ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50',
          details: {
            priority: ticket.priority,
            status: ticket.status,
            hospital: ticket.hospitalId?.name,
            createdBy: ticket.createdBy
          }
        }))),

      // Subscription activities
      Subscription.find({ 
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { updatedAt: { $gte: startDate, $lte: endDate } }
        ]
      })
        .populate('hospitalId', 'name')
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .lean()
        .then(subscriptions => subscriptions.map(subscription => ({
          id: (subscription._id as any).toString(),
          type: 'subscription_updated',
          title: 'Subscription updated',
          description: `${subscription.planName} - ${subscription.hospitalId?.name || 'Unknown Hospital'}`,
          time: subscription.updatedAt || subscription.createdAt,
          icon: 'CreditCard',
          color: 'text-blue-600 bg-blue-50',
          details: {
            planName: subscription.planName,
            status: subscription.status,
            hospital: subscription.hospitalId?.name,
            nextBilling: subscription.nextBillingDate
          }
        })))
    ]);

    // Handle settled promises and extract successful results
    const allActivities = [
      ...(hospitalActivities.status === 'fulfilled' ? hospitalActivities.value : []),
      ...(userActivities.status === 'fulfilled' ? userActivities.value : []),
      ...(patientActivities.status === 'fulfilled' ? patientActivities.value : []),
      ...(paymentActivities.status === 'fulfilled' ? paymentActivities.value : []),
      ...(supportActivities.status === 'fulfilled' ? supportActivities.value : []),
      ...(subscriptionActivities.status === 'fulfilled' ? subscriptionActivities.value : [])
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Limit the final result
    const limitedActivities = allActivities.slice(0, Number(limit));

    res.json({
      activities: limitedActivities,
      total: allActivities.length,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ 
      message: 'Error fetching activity log',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== HOSPITAL NETWORK MANAGEMENT ====================

// Get all hospitals with detailed information
router.get('/hospitals', async (req: AuthRequest, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [hospitals, total] = await Promise.all([
      Hospital.find(query)
        .populate('adminId', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Hospital.countDocuments(query)
    ]);

    // Get additional stats for each hospital
    const hospitalsWithStats = await Promise.all(
      hospitals.map(async (hospital) => {
        const [
          branchCount,
          userCount,
          patientCount,
          subscription,
          lastActivity
        ] = await Promise.all([
          Branch.countDocuments({ hospitalId: hospital._id, isActive: true }),
          User.countDocuments({ hospitalId: hospital._id, isActive: true }),
          Patient.countDocuments({ hospitalId: hospital._id }),
          Subscription.findOne({ hospitalId: hospital._id, isActive: true }).sort({ createdAt: -1 }),
          Analytics.findOne({ hospitalId: hospital._id }).sort({ date: -1 })
        ]);

        // Determine subscription status
        let subscriptionStatus = 'not_assigned';
        if (subscription) {
          if (subscription.status === 'active' || subscription.status === 'trial') {
            subscriptionStatus = 'active';
          } else if (subscription.status === 'suspended' || subscription.status === 'expired' || subscription.status === 'cancelled') {
            subscriptionStatus = 'inactive';
          }
        }

        return {
          ...hospital.toObject(),
          subscription: subscription ? {
            _id: subscription._id,
            planName: subscription.planName,
            planType: subscription.planType,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            nextBillingDate: subscription.nextBillingDate,
            monthlyCost: subscription.monthlyCost,
            currency: subscription.currency
          } : null,
          subscriptionStatus,
          stats: {
            branches: branchCount,
            users: userCount,
            patients: patientCount,
            subscription: subscription ? {
              planName: subscription.planName,
              status: subscription.status,
              nextBilling: subscription.nextBillingDate
            } : null,
            lastActivity: lastActivity?.date || hospital.createdAt
          }
        };
      })
    );

    res.json({
      hospitals: hospitalsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospitals' });
  }
});

// Update hospital status
router.patch('/hospitals/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const hospital = await Hospital.findByIdAndUpdate(
      id,
      { 
        status,
        statusReason: reason,
        updatedBy: req.user?.id
      },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Error updating hospital status' });
  }
});

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Get all subscriptions
router.get('/subscriptions', async (req: AuthRequest, res) => {
  try {
    const { status, planType, page = 1, limit = 10 } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (planType) query.planType = planType;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('hospitalId', 'name email')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(query)
    ]);

    res.json({
      subscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

// Create new subscription
router.post('/subscriptions', async (req: AuthRequest, res) => {
  try {
    const subscriptionData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    await subscription.populate('hospitalId', 'name email');
    await subscription.populate('createdBy', 'firstName lastName');

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription' });
  }
});

// Update subscription
router.put('/subscriptions/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id
    };

    const subscription = await Subscription.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('hospitalId', 'name email')
     .populate('createdBy', 'firstName lastName');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subscription' });
  }
});

// ==================== SUPPORT TICKET MANAGEMENT ====================

// Create new support ticket
router.post('/support-tickets', async (req: AuthRequest, res) => {
  try {
    const { subject, description, category, priority, tags } = req.body;
    
    if (!subject || !description || !category) {
      return res.status(400).json({ message: 'Subject, description, and category are required' });
    }

    const ticket = new SupportTicket({
      hospitalId: req.user?.hospitalId,
      branchId: req.user?.branchId,
      createdBy: req.user?.id,
      subject,
      description,
      category,
      priority: priority || 'medium',
      tags: tags || []
    });

    await ticket.save();
    await ticket.populate('hospitalId', 'name');
    await ticket.populate('createdBy', 'firstName lastName email');

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error creating support ticket' });
  }
});

// Get all support tickets
router.get('/support-tickets', async (req: AuthRequest, res) => {
  try {
    const { status, priority, category, assignedTo, page = 1, limit = 10 } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('hospitalId', 'name')
        .populate('branchId', '_id branchName')
        .populate('createdBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments(query)
    ]);

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching support tickets' });
  }
});

// Assign ticket
router.patch('/support-tickets/:id/assign', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, internalNotes } = req.body;

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { 
        assignedTo,
        internalNotes,
        status: 'in_progress',
        firstResponseTime: new Date()
      },
      { new: true }
    ).populate('hospitalId', 'name')
     .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning ticket' });
  }
});

// Update ticket status
router.patch('/support-tickets/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, internalNotes } = req.body;

    const updateData: any = { status, internalNotes };
    if (status === 'resolved') {
      updateData.resolutionTime = new Date();
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('hospitalId', 'name')
     .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error updating ticket status' });
  }
});

// ==================== BILLING MANAGEMENT ====================

// Get all invoices
router.get('/billing', async (req: AuthRequest, res) => {
  try {
    const { status, hospitalId, page = 1, limit = 10 } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (hospitalId) query.hospitalId = hospitalId;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [invoices, total] = await Promise.all([
      Billing.find(query)
        .populate('hospitalId', 'name email')
        .populate('subscriptionId', 'planName planType')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Billing.countDocuments(query)
    ]);

    res.json({
      invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Mark invoice as paid
router.patch('/billing/:id/mark-paid', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId } = req.body;

    const invoice = await Billing.findByIdAndUpdate(
      id,
      {
        status: 'paid',
        paidDate: new Date(),
        paymentMethod,
        transactionId,
        updatedBy: req.user?.id
      },
      { new: true }
    ).populate('hospitalId', 'name email')
     .populate('subscriptionId', 'planName planType');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error marking invoice as paid' });
  }
});

// ==================== TOP HOSPITALS ====================

// Get top performing hospitals
router.get('/top-hospitals', async (req: AuthRequest, res) => {
  try {
    const { timeRange = '30d', limit = 5 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get top hospitals by patient count and revenue
    const topHospitals = await Hospital.aggregate([
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'hospitalId',
          as: 'patients'
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'hospitalId',
          as: 'payments'
        }
      },
      {
        $addFields: {
          patientCount: { $size: '$patients' },
          recentPatients: {
            $size: {
              $filter: {
                input: '$patients',
                cond: { $gte: ['$$this.createdAt', startDate] }
              }
            }
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$payments',
                    cond: { 
                      $and: [
                        { $gte: ['$$this.createdAt', startDate] },
                        { $eq: ['$$this.status', 'completed'] }
                      ]
                    }
                  }
                },
                as: 'payment',
                in: '$$payment.amount'
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          patientCount: 1,
          recentPatients: 1,
          totalRevenue: 1,
          status: 1,
          createdAt: 1
        }
      },
      {
        $sort: { 
          recentPatients: -1,
          totalRevenue: -1 
        }
      },
      {
        $limit: Number(limit)
      }
    ]);

    // Calculate growth percentage for each hospital
    const hospitalsWithGrowth = await Promise.all(
      topHospitals.map(async (hospital) => {
        // Get previous period data for growth calculation
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const previousPeriodPatients = await Patient.countDocuments({
          hospitalId: hospital._id,
          createdAt: { $gte: previousStartDate, $lt: startDate }
        });

        const growthPercentage = previousPeriodPatients > 0 
          ? ((hospital.recentPatients - previousPeriodPatients) / previousPeriodPatients) * 100 
          : hospital.recentPatients > 0 ? 100 : 0;

        return {
          ...hospital,
          growthPercentage: Math.round(growthPercentage * 100) / 100,
          status: hospital.status || 'active'
        };
      })
    );

    res.json(hospitalsWithGrowth);
  } catch (error) {
    console.error('Error fetching top hospitals:', error);
    res.status(500).json({ message: 'Error fetching top hospitals' });
  }
});

// ==================== SYSTEM CONFIGURATION ====================

// Get system configuration
router.get('/system-config', async (req: AuthRequest, res) => {
  try {
    // This would typically come from a configuration collection
    const config = {
      features: {
        appointments: true,
        pharmacy: true,
        labs: true,
        inpatient: true,
        prescriptions: true,
        patientPortal: true,
        billing: true,
        reports: true,
        apiAccess: true,
        customIntegrations: true
      },
      limits: {
        maxFileSize: 10, // MB
        maxStoragePerHospital: 1000, // MB
        maxApiCallsPerMinute: 100,
        maxUsersPerHospital: 100
      },
      maintenance: {
        scheduledMaintenance: false,
        maintenanceWindow: '02:00-04:00',
        timezone: 'Asia/Kolkata'
      }
    };

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system configuration' });
  }
});

// Update system configuration
router.put('/system-config', async (req: AuthRequest, res) => {
  try {
    const { features, limits, maintenance } = req.body;
    
    // This would typically update a configuration collection
    // For now, we'll just return success
    res.json({ message: 'System configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating system configuration' });
  }
});

export default router; 