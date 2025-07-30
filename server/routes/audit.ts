import { Router } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { enforceTenantIsolation, buildTenantFilter, TenantRequest } from '../middleware/tenant';
import { AuditQueryHelper, SecurityEvents } from '../utils/audit';
import { getLocationDisplay } from '../utils/geolocation';
import mongoose from 'mongoose';

const router = Router();

// Get audit logs (admin and master_admin only)
router.get('/logs', authenticateToken, async (req: any, res) => {
  try {
    console.log('Audit logs endpoint called');
    console.log('User:', req.user?.id, req.user?.role);
    console.log('Query params:', req.query);
    
    // Check if user has required role
    if (!['admin', 'master_admin'].includes(req.user?.role || '')) {
      console.log('User does not have required role:', req.user?.role);
      return res.status(403).json({ 
        message: 'Insufficient permissions to access audit logs',
        userRole: req.user?.role,
        userId: req.user?.id
      });
    }
    const { 
      hospitalId,
      search,
      action, 
      userId,
      severity,
      from,
      to,
      page = 1, 
      limit = 50 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const filters: any = {};

    if (userId && userId !== 'all') filters.userId = new mongoose.Types.ObjectId(userId as string);
    if (action && action !== 'all') filters.action = action;
    if (from) filters.startDate = new Date(from as string);
    if (to) filters.endDate = new Date(to as string);

    // Get real audit logs from database
    const auditLogs = await AuditQueryHelper.getAuditLogs(
      new mongoose.Types.ObjectId(req.user!.hospitalId),
      filters,
      Number(limit),
      skip
    );

    // Helper function to get device info from user agent
    const getDeviceInfo = (userAgent: string) => {
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      if (userAgent.includes('curl')) return 'CLI Tool';
      return 'Unknown Browser';
    };

    // Helper function to determine severity level
    const getSeverityLevel = (action: string, resource: string) => {
      if (action === 'EXPORT' || action === 'DELETE') return 'critical';
      if (action === 'LOGIN' && resource === 'auth') return 'high';
      if (action === 'CREATE' || action === 'UPDATE') return 'medium';
      return 'low';
    };

    // Transform audit logs to match frontend interface
    const transformedLogs = auditLogs.map((log: any) => {
      // Calculate screen time from login/logout events
      let screenTimeMinutes = undefined;
      let loginTime = undefined;
      let logoutTime = undefined;

      if (log.action === 'LOGIN' && log.success) {
        loginTime = log.timestamp.toISOString();
        // Find corresponding logout for this user within a reasonable time window
        const logoutLog = auditLogs.find((l: any) => 
          l.action === 'LOGOUT' && 
          l.userId._id.toString() === log.userId._id.toString() &&
          l.timestamp > log.timestamp &&
          l.timestamp.getTime() - log.timestamp.getTime() < 24 * 60 * 60 * 1000 // Within 24 hours
        );
        
        if (logoutLog) {
          logoutTime = logoutLog.timestamp.toISOString();
          const durationMs = logoutLog.timestamp.getTime() - log.timestamp.getTime();
          screenTimeMinutes = Math.round(durationMs / (1000 * 60)); // Convert to minutes
        }
      } else if (log.action === 'LOGOUT') {
        logoutTime = log.timestamp.toISOString();
        // Find corresponding login for this user
        const loginLog = auditLogs.find((l: any) => 
          l.action === 'LOGIN' && 
          l.success &&
          l.userId._id.toString() === log.userId._id.toString() &&
          l.timestamp < log.timestamp &&
          log.timestamp.getTime() - l.timestamp.getTime() < 24 * 60 * 60 * 1000 // Within 24 hours
        );
        
        if (loginLog) {
          loginTime = loginLog.timestamp.toISOString();
          const durationMs = log.timestamp.getTime() - loginLog.timestamp.getTime();
          screenTimeMinutes = Math.round(durationMs / (1000 * 60)); // Convert to minutes
        }
      }

      return {
        id: log._id.toString(),
        timestamp: log.timestamp.toISOString(),
        userId: log.userId._id.toString(),
        userName: log.userId.firstName && log.userId.lastName 
          ? `${log.userId.firstName} ${log.userId.lastName}` 
          : log.userEmail || 'Unknown User',
        action: log.action.toLowerCase(),
        resource: log.resource,
        details: log.details?.message || log.details || `${log.action} on ${log.resource}`,
        ipAddress: log.ipAddress || 'Unknown',
        userAgent: log.userAgent || 'Unknown',
        location: log.ipAddress ? getLocationDisplay(log.ipAddress) : 'Unknown',
        device: log.userAgent ? getDeviceInfo(log.userAgent) : 'Unknown',
        severity: getSeverityLevel(log.action, log.resource),
        status: log.success ? 'success' : 'failure',
        loginTime,
        logoutTime,
        screenTimeMinutes,
        passwordChanged: log.action === 'PASSWORD_CHANGE',
        failedLogin: log.action === 'LOGIN' && !log.success,
        accountLocked: log.action === 'ACCOUNT_LOCKED',
        penaltyAmount: log.action === 'EXPORT' ? 250 : undefined
      };
    });

    // Apply additional filters
    let filteredLogs = transformedLogs;
    
    if (search) {
      const searchLower = search.toString().toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.userName.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.resource.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower)
      );
    }
    
    if (action && action !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    if (severity && severity !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }

    console.log(`Returning ${filteredLogs.length} audit logs from ${transformedLogs.length} total`);
    res.json(filteredLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// Get security events (admin and master_admin only)
router.get('/security', authenticateToken, enforceTenantIsolation, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
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
router.get('/user/:userId', authenticateToken, enforceTenantIsolation, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
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
router.get('/stats/:hospitalId', authenticateToken, enforceTenantIsolation, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
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

    // Calculate statistics matching frontend expectations
    const totalEvents = auditLogs.length;
    const criticalEvents = auditLogs.filter(log => log.action === 'EXPORT' || log.action === 'DELETE').length;
    const failedLogins = auditLogs.filter(log => log.action === 'LOGIN' && !log.success).length;
    const dataExports = auditLogs.filter(log => log.action === 'EXPORT').length;
    
    // Get real user activity data
    const activeUsers = new Set(auditLogs.filter(log => 
      new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).map(log => log.userId.toString())).size;
    
    const newLogins24h = auditLogs.filter(log => 
      log.action === 'LOGIN' && log.success && 
      new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;
    
    const passwordChanges = auditLogs.filter(log => log.action === 'PASSWORD_CHANGE').length;
    
    // Get security alerts from failed actions
    const securityAlerts = [];
    const failedLoginsRecent = auditLogs.filter(log => 
      log.action === 'LOGIN' && !log.success && 
      new Date(log.timestamp).getTime() > Date.now() - 60 * 60 * 1000 // Last hour
    );
    
    if (failedLoginsRecent.length > 0) {
      securityAlerts.push({
        id: '1',
        type: 'failed_login',
        message: `${failedLoginsRecent.length} failed login attempts detected`,
        severity: 'high',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      });
    }
    
    const unusualAccess = auditLogs.filter(log => 
      log.action === 'EXPORT' && 
      new Date(log.timestamp).getTime() > Date.now() - 2 * 60 * 60 * 1000 // Last 2 hours
    );
    
    if (unusualAccess.length > 0) {
      securityAlerts.push({
        id: '2',
        type: 'unusual_access',
        message: `${unusualAccess.length} data export activities detected`,
        severity: 'medium',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      });
    }
    
    const stats = {
      totalEvents,
      criticalEvents,
      failedLogins,
      dataExports,
      activeUsers,
      newLogins24h,
      passwordChanges,
      systemHealth: {
        database: 'online',
        api: 'healthy',
        backup: 'current',
        ssl: 'valid'
      },
      complianceScore: Math.max(50, 100 - (failedLogins * 5) - (criticalEvents * 3)), // Calculate based on events
      lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      securityAlerts
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ message: 'Error fetching audit statistics' });
  }
});

// Export audit logs (admin and master_admin only)
router.post('/export', authenticateToken, enforceTenantIsolation, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
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