import { Router } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { enforceTenantIsolation, buildTenantFilter, TenantRequest } from '../middleware/tenant';
import { AuditQueryHelper, SecurityEvents } from '../utils/audit';
import mongoose from 'mongoose';

const router = Router();

// Apply tenant middleware to all routes
router.use(enforceTenantIsolation);

// Get audit logs (admin and master_admin only)
router.get('/', authenticateToken, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
  try {
    const { 
      userId, 
      action, 
      resource, 
      startDate, 
      endDate, 
      success, 
      page = 1, 
      limit = 50 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const filters: any = {};

    if (userId) filters.userId = new mongoose.Types.ObjectId(userId as string);
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (success !== undefined) filters.success = success === 'true';
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const auditLogs = await AuditQueryHelper.getAuditLogs(
      new mongoose.Types.ObjectId(req.user!.hospitalId),
      filters,
      Number(limit),
      skip
    );

    const total = await AuditQueryHelper.getAuditLogs(
      new mongoose.Types.ObjectId(req.user!.hospitalId),
      filters,
      0,
      0
    ).then(logs => logs.length);

    res.json({
      data: auditLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// Get security events (admin and master_admin only)
router.get('/security', authenticateToken, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const securityEvents = await AuditQueryHelper.getSecurityEvents(
      new mongoose.Types.ObjectId(req.user!.hospitalId),
      start,
      end
    );

    const total = securityEvents.length;
    const paginatedEvents = securityEvents.slice(skip, skip + Number(limit));

    res.json({
      data: paginatedEvents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ message: 'Error fetching security events' });
  }
});

// Get user activity (admin and master_admin only)
router.get('/user/:userId', authenticateToken, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const userActivity = await AuditQueryHelper.getUserActivity(
      userId,
      new mongoose.Types.ObjectId(req.user!.hospitalId),
      Number(days)
    );

    res.json({
      data: userActivity,
      summary: {
        totalActions: userActivity.length,
        successfulActions: userActivity.filter(log => log.success).length,
        failedActions: userActivity.filter(log => !log.success).length,
        mostCommonAction: userActivity.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Error fetching user activity' });
  }
});

// Get audit statistics (admin and master_admin only)
router.get('/stats', authenticateToken, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const filters = { startDate };
    const auditLogs = await AuditQueryHelper.getAuditLogs(
      new mongoose.Types.ObjectId(req.user!.hospitalId),
      filters,
      1000, // Get more logs for statistics
      0
    );

    // Calculate statistics
    const stats = {
      totalActions: auditLogs.length,
      successfulActions: auditLogs.filter(log => log.success).length,
      failedActions: auditLogs.filter(log => !log.success).length,
      actionsByType: auditLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      resourcesByType: auditLogs.reduce((acc, log) => {
        acc[log.resource] = (acc[log.resource] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topUsers: auditLogs.reduce((acc, log) => {
        const userKey = `${log.userEmail} (${log.userRole})`;
        acc[userKey] = (acc[userKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      dailyActivity: auditLogs.reduce((acc, log) => {
        const date = log.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ message: 'Error fetching audit statistics' });
  }
});

// Export audit logs (admin and master_admin only)
router.post('/export', authenticateToken, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
  try {
    const { 
      userId, 
      action, 
      resource, 
      startDate, 
      endDate, 
      success,
      format = 'json'
    } = req.body;

    const filters: any = {};

    if (userId) filters.userId = new mongoose.Types.ObjectId(userId);
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (success !== undefined) filters.success = success;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const auditLogs = await AuditQueryHelper.getAuditLogs(
      new mongoose.Types.ObjectId(req.user!.hospitalId),
      filters,
      10000, // Large limit for export
      0
    );

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = 'Timestamp,User,Role,Action,Resource,Resource ID,Success,IP Address,Details\n';
      const csvRows = auditLogs.map(log => 
        `"${log.timestamp}","${log.userEmail}","${log.userRole}","${log.action}","${log.resource}","${log.resourceId || ''}","${log.success}","${log.ipAddress || ''}","${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeaders + csvRows);
    } else {
      res.json({
        data: auditLogs,
        exportInfo: {
          format,
          totalRecords: auditLogs.length,
          exportedAt: new Date().toISOString(),
          filters
        }
      });
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ message: 'Error exporting audit logs' });
  }
});

export default router; 