import { Router } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { enforceTenantIsolation, buildTenantFilter, TenantRequest } from '../middleware/tenant';
import { Payment } from '../models/payment';
import { Appointment } from '../models/appointment';
import { Patient } from '../models/patient';
import { Billing } from '../models/billing';

const router = Router();

// Get financial dashboard data
router.get('/dashboard', authenticateToken, authorizeRole(['admin', 'master-admin', 'sub-admin']), async (req: AuthRequest & TenantRequest, res) => {
  try {
    const { hospitalId } = req.query;
    const { from, to, branch, department } = req.query;

    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }

    // Build date filter
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from as string);
      if (to) dateFilter.createdAt.$lte = new Date(to as string);
    }

    // Build branch filter
    const branchFilter = branch && branch !== 'all' ? { branchId: branch } : {};

    // Get payments data
    const payments = await Payment.find({
      hospitalId,
      ...dateFilter,
      ...branchFilter
    }).populate('patient', 'firstName lastName');

    // Get appointments data
    const appointments = await Appointment.find({
      hospitalId,
      ...dateFilter,
      ...branchFilter
    });

    // Calculate financial metrics
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    
    const completedRevenue = completedPayments.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0
    );
    
    const pendingRevenue = pendingPayments.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0
    );

    // Calculate payment method distribution
    const paymentMethodStats = payments.reduce((acc: any, payment: any) => {
      const method = payment.method || 'cash';
      if (!acc[method]) {
        acc[method] = { amount: 0, count: 0 };
      }
      acc[method].amount += payment.amount || 0;
      acc[method].count += 1;
      return acc;
    }, {});

    const paymentMethods = Object.entries(paymentMethodStats).map(([method, stats]: [string, any]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount: stats.amount,
      percentage: completedRevenue > 0 ? (stats.amount / completedRevenue) * 100 : 0,
      transactions: stats.count
    }));

    // Calculate appointment type distribution
    const appointmentTypeStats = appointments.reduce((acc: any, appointment: any) => {
      const type = appointment.type || 'consultation';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += 1;
      return acc;
    }, {});

    const revenueByDepartment = Object.entries(appointmentTypeStats).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      revenue: completedRevenue * (Number(count) / appointments.length),
      percentage: appointments.length > 0 ? (Number(count) / appointments.length) * 100 : 0,
      growth: 0 // Would need historical data to calculate
    }));

    // Get recent transactions
    const recentTransactions = payments.slice(0, 10).map((payment: any) => ({
      id: payment._id,
      patientName: payment.patient ? `${payment.patient.firstName} ${payment.patient.lastName}` : 'Unknown Patient',
      amount: payment.amount,
      paymentMethod: payment.method || 'cash',
      status: payment.status,
      date: payment.createdAt,
      description: 'Medical consultation'
    }));

    // Get outstanding invoices
    const outstandingInvoices = pendingPayments.map((payment: any) => ({
      id: payment._id,
      patientName: payment.patient ? `${payment.patient.firstName} ${payment.patient.lastName}` : 'Unknown Patient',
      amount: payment.amount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysPastDue: 0,
      status: 'current'
    }));

    // Generate monthly revenue data (mock data for now)
    const monthlyRevenue = [
      { month: 'Jan', revenue: completedRevenue * 0.8, expenses: 0, profit: completedRevenue * 0.8 },
      { month: 'Feb', revenue: completedRevenue * 0.85, expenses: 0, profit: completedRevenue * 0.85 },
      { month: 'Mar', revenue: completedRevenue * 0.9, expenses: 0, profit: completedRevenue * 0.9 },
      { month: 'Apr', revenue: completedRevenue * 0.95, expenses: 0, profit: completedRevenue * 0.95 },
      { month: 'May', revenue: completedRevenue, expenses: 0, profit: completedRevenue },
      { month: 'Jun', revenue: completedRevenue * 1.05, expenses: 0, profit: completedRevenue * 1.05 }
    ];

    const overview = {
      totalRevenue: completedRevenue,
      revenueGrowth: 0, // Would need historical data
      totalExpenses: 0, // Not available in current schema
      netProfit: completedRevenue, // Assuming all revenue is profit for now
      profitMargin: 100, // Since no expenses tracked
      outstandingAmount: pendingRevenue,
      collectionRate: payments.length > 0 ? (completedPayments.length / payments.length) * 100 : 0,
      averageTransactionValue: completedPayments.length > 0 ? completedRevenue / completedPayments.length : 0
    };

    res.json({
      overview,
      revenueByDepartment,
      paymentMethods,
      recentTransactions,
      outstandingInvoices,
      monthlyRevenue
    });

  } catch (error) {
    console.error('Error fetching financial dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

// Export financial report
router.post('/export', authenticateToken, authorizeRole(['admin', 'master-admin', 'sub-admin']), async (req: AuthRequest & TenantRequest, res) => {
  try {
    const { hospitalId, format, dateRange, branch, department } = req.body;

    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }

    // For now, return a simple response indicating the export would be generated
    // In a real implementation, this would generate and return the actual file
    res.json({
      message: `Financial report export requested in ${format} format`,
      status: 'processing',
      downloadUrl: `/reports/financial-${Date.now()}.${format}`
    });

  } catch (error) {
    console.error('Error exporting financial report:', error);
    res.status(500).json({ error: 'Failed to export financial report' });
  }
});

export default router; 