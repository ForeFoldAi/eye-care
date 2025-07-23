import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export interface TenantRequest extends AuthRequest {
  tenant?: {
    hospitalId?: string;
    branchId?: string;
    userRole: string;
    userId: string;
  };
}

/**
 * Middleware to enforce tenant isolation
 * Ensures users can only access data from their assigned hospital/branch
 */
export const enforceTenantIsolation = (req: TenantRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Set tenant context
  req.tenant = {
    hospitalId: req.user.hospitalId,
    branchId: req.user.branchId,
    userRole: req.user.role,
    userId: req.user.id
  };

  next();
};

/**
 * Middleware to ensure users can only access their hospital's data
 */
export const requireHospitalAccess = (req: TenantRequest, res: Response, next: NextFunction) => {
  if (!req.tenant?.hospitalId) {
    return res.status(403).json({ 
      message: 'Hospital access required. Please contact your administrator.' 
    });
  }
  next();
};

/**
 * Middleware to ensure users can only access their branch's data
 */
export const requireBranchAccess = (req: TenantRequest, res: Response, next: NextFunction) => {
  if (!req.tenant?.branchId) {
    return res.status(403).json({ 
      message: 'Branch access required. Please contact your administrator.' 
    });
  }
  next();
};

/**
 * Middleware to validate that users can only access data from their scope
 */
export const validateDataAccess = (dataType: 'hospital' | 'branch' | 'user') => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const { tenant } = req;
    
    if (!tenant) {
      return res.status(401).json({ message: 'Tenant context required' });
    }

    // Master admin can access everything
    if (tenant.userRole === 'master_admin') {
      return next();
    }

    // Admin can only access their hospital's data
    if (tenant.userRole === 'admin') {
      if (dataType === 'hospital' && req.params.hospitalId && req.params.hospitalId !== tenant.hospitalId) {
        return res.status(403).json({ message: 'Access denied to other hospitals' });
      }
      if (dataType === 'branch' && req.params.branchId) {
        // Admin can access branches within their hospital
        return next();
      }
      if (dataType === 'user' && req.params.userId) {
        // Admin can access users within their hospital
        return next();
      }
    }

    // Sub-admin can only access their branch's data
    if (tenant.userRole === 'sub_admin') {
      if (dataType === 'branch' && req.params.branchId && req.params.branchId !== tenant.branchId) {
        return res.status(403).json({ message: 'Access denied to other branches' });
      }
      if (dataType === 'user' && req.params.userId) {
        // Sub-admin can access users within their branch
        return next();
      }
    }

    // Doctor/Receptionist can only access their branch's data
    if (['doctor', 'receptionist'].includes(tenant.userRole)) {
      if (dataType === 'branch' && req.params.branchId && req.params.branchId !== tenant.branchId) {
        return res.status(403).json({ message: 'Access denied to other branches' });
      }
      if (dataType === 'user' && req.params.userId && req.params.userId !== tenant.userId) {
        return res.status(403).json({ message: 'Access denied to other users' });
      }
    }

    next();
  };
};

/**
 * Helper function to build tenant-aware query filters
 */
export const buildTenantFilter = (req: TenantRequest, additionalFilters: any = {}) => {
  const { tenant } = req;
  
  if (!tenant) {
    throw new Error('Tenant context required');
  }

  // Master admin can see everything
  if (tenant.userRole === 'master_admin') {
    return additionalFilters;
  }

  // Admin can only see their hospital's data
  if (tenant.userRole === 'admin') {
    return {
      ...additionalFilters,
      hospitalId: tenant.hospitalId
    };
  }

  // Sub-admin, doctor, receptionist can only see their branch's data
  if (['sub_admin', 'doctor', 'receptionist'].includes(tenant.userRole)) {
    return {
      ...additionalFilters,
      hospitalId: tenant.hospitalId,
      branchId: tenant.branchId
    };
  }

  return additionalFilters;
};

/**
 * Middleware to ensure data creation is within user's scope
 */
export const validateDataCreation = (req: TenantRequest, res: Response, next: NextFunction) => {
  const { tenant } = req;
  
  if (!tenant) {
    return res.status(401).json({ message: 'Tenant context required' });
  }

  // Master admin can create data anywhere
  if (tenant.userRole === 'master_admin') {
    return next();
  }

  // Admin can only create data for their hospital
  if (tenant.userRole === 'admin') {
    if (req.body.hospitalId && req.body.hospitalId !== tenant.hospitalId) {
      return res.status(403).json({ message: 'Can only create data for your hospital' });
    }
    // Auto-assign hospitalId if not provided
    if (!req.body.hospitalId) {
      req.body.hospitalId = tenant.hospitalId;
    }
  }

  // Sub-admin can only create data for their branch
  if (tenant.userRole === 'sub_admin') {
    if (req.body.branchId && req.body.branchId !== tenant.branchId) {
      return res.status(403).json({ message: 'Can only create data for your branch' });
    }
    if (req.body.hospitalId && req.body.hospitalId !== tenant.hospitalId) {
      return res.status(403).json({ message: 'Can only create data for your hospital' });
    }
    // Auto-assign hospitalId and branchId if not provided
    if (!req.body.hospitalId) {
      req.body.hospitalId = tenant.hospitalId;
    }
    if (!req.body.branchId) {
      req.body.branchId = tenant.branchId;
    }
  }

  // Doctor/Receptionist can only create data for their branch
  if (['doctor', 'receptionist'].includes(tenant.userRole)) {
    if (req.body.branchId && req.body.branchId !== tenant.branchId) {
      return res.status(403).json({ message: 'Can only create data for your branch' });
    }
    if (req.body.hospitalId && req.body.hospitalId !== tenant.hospitalId) {
      return res.status(403).json({ message: 'Can only create data for your hospital' });
    }
    // Auto-assign hospitalId and branchId if not provided
    if (!req.body.hospitalId) {
      req.body.hospitalId = tenant.hospitalId;
    }
    if (!req.body.branchId) {
      req.body.branchId = tenant.branchId;
    }
  }

  next();
}; 