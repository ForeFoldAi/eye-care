import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models';
import { loginSchema, insertUserSchema } from '../shared/schema';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { createAuditLogger, createAuditLoggerFromUser, SecurityEvents } from '../utils/audit';

const router = Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password, role } = loginSchema.parse(req.body);
    console.log('Parsed login data:', { email, role });
    const user = await User.findOne({ email, role });
    console.log('Found user:', user ? { id: user._id, email: user.email, role: user.role, isActive: user.isActive } : 'No user found');

    if (!user) {
      // Create audit logger for failed login attempt
      const auditLogger = createAuditLoggerFromUser({
        userId: new mongoose.Types.ObjectId('000000000000000000000000'), // Dummy ID for failed login
        userEmail: email,
        userRole: role,
        hospitalId: null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      await auditLogger.logSecurityEvent(SecurityEvents.UNAUTHORIZED_ACCESS, {
        action: 'Failed login attempt',
        email,
        role,
        reason: 'User not found'
      }, false);
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Create audit logger for failed login attempt
      const auditLogger = createAuditLoggerFromUser({
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        hospitalId: user.hospitalId,
        branchId: user.branchId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      await auditLogger.logSecurityEvent(SecurityEvents.UNAUTHORIZED_ACCESS, {
        action: 'Failed login attempt',
        email,
        role,
        reason: 'Invalid password'
      }, false);
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      const auditLogger = createAuditLoggerFromUser({
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        hospitalId: user.hospitalId,
        branchId: user.branchId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      await auditLogger.logSecurityEvent(SecurityEvents.UNAUTHORIZED_ACCESS, {
        action: 'Failed login attempt',
        email,
        role,
        reason: 'User account inactive'
      }, false);
      
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Login: JWT token generated', { 
      userId: user._id, 
      tokenLength: token.length,
      expiresIn: '24h',
      currentTime: new Date().toISOString()
    });

    // Log successful login
    const auditLogger = createAuditLoggerFromUser({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      hospitalId: user.hospitalId,
      branchId: user.branchId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    await auditLogger.logLogin({
      action: 'Successful login',
      email,
      role,
      loginTime: new Date().toISOString()
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        hospitalId: user.hospitalId,
        branchId: user.branchId,
        specialization: user.specialization,
        isActive: user.isActive,
        permissions: user.permissions,
        phoneNumber: user.phoneNumber,
        address: user.address,
        profilePhotoUrl: user.profilePhotoUrl,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Register route (admin only)
router.post('/register', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new User({
      ...userData,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('/me endpoint: Request received', { userId: req.user?.id, userRole: req.user?.role });
    
    if (!req.user) {
      console.log('/me endpoint: No user in request');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await User.findById(req.user.id).select('-password');
    console.log('/me endpoint: User found:', user ? { id: user._id, email: user.email, role: user.role, isActive: user.isActive } : 'No user found');
    
    if (!user) {
      console.log('/me endpoint: User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('/me endpoint: Returning user data');
    res.json({ 
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        hospitalId: user.hospitalId,
        branchId: user.branchId,
        specialization: user.specialization,
        isActive: user.isActive,
        permissions: user.permissions,
        phoneNumber: user.phoneNumber,
        address: user.address,
        profilePhotoUrl: user.profilePhotoUrl,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('/me endpoint: Error:', error);
    res.status(500).json({ message: 'Error fetching user info' });
  }
});

export default router; 