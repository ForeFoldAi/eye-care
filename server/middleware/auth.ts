import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    hospitalId?: string;
    branchId?: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('authenticateToken: Auth header exists:', !!authHeader, 'Token exists:', !!token);

  if (!token) {
    console.log('authenticateToken: No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    console.log('authenticateToken: Token decoded successfully, userId:', decoded.id);
    
    // Check if token is about to expire (within 1 hour)
    const tokenPayload = jwt.decode(token) as any;
    if (tokenPayload && tokenPayload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = tokenPayload.exp - now;
      console.log('authenticateToken: Token expiry info', { 
        expiresAt: new Date(tokenPayload.exp * 1000).toISOString(),
        timeUntilExpiry: `${Math.floor(timeUntilExpiry / 3600)}h ${Math.floor((timeUntilExpiry % 3600) / 60)}m`,
        isExpiringSoon: timeUntilExpiry < 3600 // 1 hour
      });
    }
    
    const user = await User.findById(decoded.id).select('-password');
    console.log('authenticateToken: User found:', user ? { id: user._id, email: user.email, role: user.role, isActive: user.isActive } : 'No user found');

    if (!user) {
      console.log('authenticateToken: User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      hospitalId: user.hospitalId?.toString(),
      branchId: user.branchId?.toString()
    };
    console.log('authenticateToken: User set in request:', req.user);
    next();
  } catch (error) {
    console.error('authenticateToken: Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    next();
  };
};

export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return null;
    }

    return {
      userId: user._id.toString(),
      role: user.role,
      hospitalId: user.hospitalId?.toString(),
      branchId: user.branchId?.toString()
    };
  } catch (error) {
    return null;
  }
}; 