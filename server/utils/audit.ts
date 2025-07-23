import mongoose, { Schema, Document } from 'mongoose';

// Audit Log Schema
export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userRole: string;
  hospitalId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userRole: { type: String, required: true },
  hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  action: { type: String, required: true }, // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  resource: { type: String, required: true }, // 'patient', 'appointment', 'user', etc.
  resourceId: { type: String },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
  errorMessage: { type: String }
});

// Indexes for audit logs
auditLogSchema.index({ hospitalId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

// Audit logging utility functions
export interface AuditContext {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userRole: string;
  hospitalId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private context: AuditContext;

  constructor(context: AuditContext) {
    this.context = context;
  }

  async log(
    action: string,
    resource: string,
    details: any,
    success: boolean = true,
    resourceId?: string,
    errorMessage?: string
  ) {
    try {
      const auditLog = new AuditLog({
        userId: this.context.userId,
        userEmail: this.context.userEmail,
        userRole: this.context.userRole,
        hospitalId: this.context.hospitalId,
        branchId: this.context.branchId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: this.context.ipAddress,
        userAgent: this.context.userAgent,
        timestamp: new Date(),
        success,
        errorMessage
      });

      await auditLog.save();
    } catch (error) {
      console.error('Failed to save audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Convenience methods for common actions
  async logCreate(resource: string, details: any, resourceId?: string) {
    return this.log('CREATE', resource, details, true, resourceId);
  }

  async logRead(resource: string, details: any, resourceId?: string) {
    return this.log('READ', resource, details, true, resourceId);
  }

  async logUpdate(resource: string, details: any, resourceId?: string) {
    return this.log('UPDATE', resource, details, true, resourceId);
  }

  async logDelete(resource: string, details: any, resourceId?: string) {
    return this.log('DELETE', resource, details, true, resourceId);
  }

  async logLogin(details: any) {
    return this.log('LOGIN', 'auth', details, true);
  }

  async logLogout(details: any) {
    return this.log('LOGOUT', 'auth', details, true);
  }

  async logError(action: string, resource: string, details: any, errorMessage: string, resourceId?: string) {
    return this.log(action, resource, details, false, resourceId, errorMessage);
  }

  async logSecurityEvent(action: string, details: any, success: boolean = true) {
    return this.log(action, 'security', details, success);
  }
}

// Middleware to create audit logger from request
export function createAuditLogger(req: any): AuditLogger {
  const context: AuditContext = {
    userId: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    hospitalId: req.user.hospitalId,
    branchId: req.user.branchId,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };

  return new AuditLogger(context);
}

// Create audit logger from user data (for login routes)
export function createAuditLoggerFromUser(userData: {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userRole: string;
  hospitalId?: mongoose.Types.ObjectId | null;
  branchId?: mongoose.Types.ObjectId | null;
  ipAddress?: string;
  userAgent?: string;
}): AuditLogger {
  const context: AuditContext = {
    userId: userData.userId,
    userEmail: userData.userEmail,
    userRole: userData.userRole,
    hospitalId: userData.hospitalId || new mongoose.Types.ObjectId('000000000000000000000000'),
    branchId: userData.branchId || undefined,
    ipAddress: userData.ipAddress,
    userAgent: userData.userAgent
  };

  return new AuditLogger(context);
}

// Audit middleware for automatic logging
export function auditMiddleware(action: string, resource: string) {
  return async (req: any, res: any, next: any) => {
    const originalSend = res.send;
    const auditLogger = createAuditLogger(req);
    
    res.send = function(data: any) {
      const success = res.statusCode < 400;
      const details = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        requestBody: req.body,
        responseData: typeof data === 'string' ? data : JSON.stringify(data)
      };

      auditLogger.log(action, resource, details, success, req.params.id);
      originalSend.call(this, data);
    };

    next();
  };
}

// Security audit events
export const SecurityEvents = {
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TENANT_VIOLATION: 'TENANT_VIOLATION',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  DATA_EXPORT: 'DATA_EXPORT',
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE'
} as const;

// Audit query helpers
export class AuditQueryHelper {
  static async getAuditLogs(
    hospitalId: mongoose.Types.ObjectId,
    filters: {
      userId?: mongoose.Types.ObjectId;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
    } = {},
    limit: number = 100,
    skip: number = 0
  ) {
    const query: any = { hospitalId };

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.resource) query.resource = filters.resource;
    if (filters.success !== undefined) query.success = filters.success;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'firstName lastName email')
      .populate('hospitalId', 'name')
      .populate('branchId', 'name');
  }

  static async getSecurityEvents(
    hospitalId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ) {
    const query: any = { 
      hospitalId, 
      resource: 'security',
      success: false 
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'firstName lastName email');
  }

  static async getUserActivity(
    userId: mongoose.Types.ObjectId,
    hospitalId: mongoose.Types.ObjectId,
    days: number = 30
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return AuditLog.find({
      userId,
      hospitalId,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .populate('hospitalId', 'name')
    .populate('branchId', 'name');
  }
} 