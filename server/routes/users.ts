import { Router } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User, Hospital, Branch } from '../models';
import { insertUserSchema } from '../shared/schema';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { 
  enforceTenantIsolation, 
  TenantRequest, 
  buildTenantFilter, 
  validateDataCreation,
  requireHospitalAccess,
  requireBranchAccess
} from '../middleware/tenant';
import { createAuditLogger } from '../utils/audit';

// Helper function to get real IP address
const getRealIP = (req: any): string => {
  // Check for forwarded headers (common with proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  // Check for real IP header
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Fallback to connection remote address
  return req.ip || req.connection.remoteAddress || 'Unknown';
};

const router = Router();

// Get all users with tenant isolation
router.get('/', 
  authenticateToken, 
  enforceTenantIsolation,
  async (req: TenantRequest, res) => {
  try {
    const { email, username } = req.query;
    
    // If email or username query params are provided, check for existence
    if (email || username) {
      const query: any = {};
      if (email) query.email = email;
      if (username) query.username = username;
      
      const users = await User.find(query).select('_id email username').lean();
      return res.json(users);
    }
    
    // Build tenant-aware filter
    const filter = buildTenantFilter(req, {});
    
    // Return users based on tenant context
    const users = await User.find(filter)
      .populate('hospitalId', 'name logo')
      .populate('branchId', '_id branchName')
      .populate('createdBy', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get users by hospital (admin only)
router.get('/hospital/:hospitalId', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Verify admin has access to this hospital
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital || hospital.adminId.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Ensure hospitalId is treated as an ObjectId
    const hospitalId = new mongoose.Types.ObjectId(req.params.hospitalId);

    // Fetch users with populated branch and hospital info
    const users = await User.find({ hospitalId })
      .populate('hospitalId', 'name logo')
      .populate('branchId', '_id branchName location') // assuming branch location exists
      .populate('createdBy', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get users by branch (sub-admin, doctor, receptionist)
router.get('/branch/:branchId', authenticateToken, authorizeRole(['sub_admin', 'doctor', 'receptionist']), async (req: AuthRequest, res) => {
  try {
    console.log('Branch access request:', {
      branchId: req.params.branchId,
      userRole: req.user?.role,
      userId: req.user?.id,
      userBranchId: req.user?.branchId,
      userHospitalId: req.user?.hospitalId
    });

    // Verify user has access to this branch
    const branch = await Branch.findById(req.params.branchId);
    if (!branch) {
      console.log('Branch not found:', req.params.branchId);
      return res.status(404).json({ message: 'Branch not found' });
    }

    console.log('Branch found:', {
      branchId: branch._id.toString(),
      branchName: branch.branchName,
      subAdminId: branch.subAdminId?.toString(),
      hospitalId: branch.hospitalId?.toString()
    });

    // Check access based on user role
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (userRole === 'sub_admin') {
      // Sub-admin can only access their assigned branch
      if (branch.subAdminId?.toString() !== userId) {
        console.log('Sub-admin access denied: branch.subAdminId !== userId');
        return res.status(403).json({ message: 'Access denied to other branches' });
      }
    } else if (['doctor', 'receptionist'].includes(userRole || '')) {
      // Doctor/Receptionist can access their assigned branch
      if (branch._id.toString() !== req.user?.branchId) {
        console.log('Doctor/Receptionist access denied: branch._id !== user.branchId');
        return res.status(403).json({ message: 'Access denied to other branches' });
      }
    } else {
      console.log('Insufficient permissions for role:', userRole);
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const users = await User.find({ branchId: req.params.branchId })
      .populate('hospitalId', 'name logo')
      .populate('branchId', '_id branchName')
      .populate('createdBy', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log('Users found for branch:', {
      branchId: req.params.branchId,
      userCount: users.length,
      users: users.map(u => ({
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        email: u.email
      }))
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get single user
router.get('/:id', authenticateToken, authorizeRole(['master_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('hospitalId', 'name logo')
      .populate('branchId', '_id branchName')
      .populate('createdBy', 'firstName lastName email')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions based on role hierarchy
    if (req.user?.role === 'admin') {
      if (user.hospitalId && user.hospitalId.toString() !== req.user.hospitalId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user?.role === 'sub_admin') {
      if (user.branchId && user.branchId.toString() !== req.user.branchId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Create user with tenant validation
router.post('/', 
  authenticateToken, 
  authorizeRole(['master_admin', 'admin', 'sub_admin']),
  enforceTenantIsolation,
  validateDataCreation,
  async (req: TenantRequest, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUserByEmail = await User.findOne({ email: userData.email });
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const existingUserByUsername = await User.findOne({ username: userData.username });
    if (existingUserByUsername) {
      return res.status(409).json({ message: 'User with this username already exists' });
    }

    // Role-based validation
    const creatorRole = req.user?.role;
    const newUserRole = userData.role;

    // Master admin can create any role
    if (creatorRole === 'master_admin') {
      // No restrictions
    }
    // Admin can only create sub-admin, doctor, receptionist
    else if (creatorRole === 'admin') {
      if (['master_admin', 'admin'].includes(newUserRole)) {
        return res.status(403).json({ message: 'Admins can only create sub-admin, doctor, and receptionist accounts' });
      }
      
      // Ensure user is assigned to admin's hospital
      if (userData.hospitalId && userData.hospitalId !== req.user?.hospitalId) {
        return res.status(403).json({ message: 'Can only create users for your hospital' });
      }
    }
    // Sub-admin can only create doctor and receptionist
    else if (creatorRole === 'sub_admin') {
      if (['master_admin', 'admin', 'sub_admin'].includes(newUserRole)) {
        return res.status(403).json({ message: 'Sub-admins can only create doctor and receptionist accounts' });
      }
      
      // Ensure user is assigned to sub-admin's branch
      if (userData.branchId && userData.branchId !== req.user?.branchId) {
        return res.status(403).json({ message: 'Can only create users for your branch' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Set default values based on creator's context
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      createdBy: req.user?.id
    };

    // Auto-assign hospital/branch based on creator's context
    if (creatorRole === 'admin' && !userData.hospitalId) {
      userToCreate.hospitalId = req.user?.hospitalId;
    } else if (creatorRole === 'sub_admin' && !userData.branchId) {
      userToCreate.branchId = req.user?.branchId;
      userToCreate.hospitalId = req.user?.hospitalId;
    }

    const user = new User(userToCreate);
    await user.save();

    // Log user creation
    const auditLogger = createAuditLogger(req);
    await auditLogger.logCreate('user', {
      action: 'User creation',
      newUserEmail: userData.email,
      newUserRole: userData.role,
      newUserId: user._id,
      createdBy: req.user?.id,
      creatorRole: req.user?.role
    }, user._id.toString());

    // Populate references
    await user.populate('hospitalId', 'name');
    await user.populate('branchId', '_id branchName');
    await user.populate('createdBy', 'firstName lastName email');

    const { password, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error creating user' });
    }
  }
});

// Update user
router.put('/:id', authenticateToken, authorizeRole(['master_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    const creatorRole = req.user?.role;
    if (creatorRole === 'admin') {
      if (user.hospitalId && user.hospitalId.toString() !== req.user?.hospitalId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (creatorRole === 'sub_admin') {
      if (user.branchId && user.branchId.toString() !== req.user?.branchId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const updateData = insertUserSchema.partial().parse(req.body);
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Role-based validation for updates
    if (updateData.role) {
      if (creatorRole === 'admin' && ['master_admin', 'admin'].includes(updateData.role)) {
        return res.status(403).json({ message: 'Admins can only update to sub-admin, doctor, and receptionist roles' });
      } else if (creatorRole === 'sub_admin' && ['master_admin', 'admin', 'sub_admin'].includes(updateData.role)) {
        return res.status(403).json({ message: 'Sub-admins can only update to doctor and receptionist roles' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('hospitalId', 'name logo')
    .populate('branchId', '_id branchName')
    .populate('createdBy', 'firstName lastName email')
    .select('-password');

    // Log user update
    const auditLogger = createAuditLogger(req);
    await auditLogger.logUpdate('user', {
      action: 'User update',
      updatedUserId: req.params.id,
      updatedFields: Object.keys(updateData),
      updatedBy: req.user?.id,
      updaterRole: req.user?.role
    }, req.params.id);

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error updating user' });
    }
  }
});

// Delete user
router.delete('/:id', authenticateToken, authorizeRole(['master_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    const creatorRole = req.user?.role;
    if (creatorRole === 'admin') {
      if (user.hospitalId && user.hospitalId.toString() !== req.user?.hospitalId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (creatorRole === 'sub_admin') {
      if (user.branchId && user.branchId.toString() !== req.user?.branchId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Prevent deletion of users with higher roles
    if (creatorRole === 'admin' && ['master_admin', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Cannot delete users with admin or master admin roles' });
    } else if (creatorRole === 'sub_admin' && ['master_admin', 'admin', 'sub_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Cannot delete users with admin, sub-admin, or master admin roles' });
    }

    // Log user deletion before deleting
    const auditLogger = createAuditLogger(req);
    await auditLogger.logDelete('user', {
      action: 'User deletion',
      deletedUserId: req.params.id,
      deletedUserEmail: user.email,
      deletedUserRole: user.role,
      deletedBy: req.user?.id,
      deleterRole: req.user?.role
    }, req.params.id);

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Fix user-hospital relationship
router.post('/fix-hospital-relationship', authenticateToken, authorizeRole(['master_admin']), async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find hospital where this user is the admin
    const hospital = await Hospital.findOne({ adminId: user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'No hospital found for this user' });
    }

    // Update user with hospital ID if not set
    if (!user.hospitalId) {
      await User.findByIdAndUpdate(user._id, { hospitalId: hospital._id });
      res.json({ 
        message: 'User updated with hospital ID successfully',
        userId: user._id,
        hospitalId: hospital._id
      });
    } else {
      res.json({ 
        message: 'User already has hospital ID',
        userId: user._id,
        hospitalId: user.hospitalId
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fixing user-hospital relationship' });
  }
});

// Get user statistics
router.get('/stats/overview', authenticateToken, authorizeRole(['master_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const creatorRole = req.user?.role;
    let stats: number[] = [];

    if (creatorRole === 'master_admin') {
      // Global stats
      stats = await Promise.all([
        User.countDocuments({ role: 'master_admin' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'sub_admin' }),
        User.countDocuments({ role: 'doctor' }),
        User.countDocuments({ role: 'receptionist' }),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false })
      ]);
    } else if (creatorRole === 'admin') {
      // Hospital stats
      stats = await Promise.all([
        User.countDocuments({ role: 'sub_admin', hospitalId: req.user?.hospitalId }),
        User.countDocuments({ role: 'doctor', hospitalId: req.user?.hospitalId }),
        User.countDocuments({ role: 'receptionist', hospitalId: req.user?.hospitalId }),
        User.countDocuments({ isActive: true, hospitalId: req.user?.hospitalId }),
        User.countDocuments({ isActive: false, hospitalId: req.user?.hospitalId })
      ]);
    } else if (creatorRole === 'sub_admin') {
      // Branch stats
      stats = await Promise.all([
        User.countDocuments({ role: 'doctor', branchId: req.user?.branchId }),
        User.countDocuments({ role: 'receptionist', branchId: req.user?.branchId }),
        User.countDocuments({ isActive: true, branchId: req.user?.branchId }),
        User.countDocuments({ isActive: false, branchId: req.user?.branchId })
      ]);
    }

    if (creatorRole === 'master_admin') {
      res.json({
        totalMasterAdmins: stats[0],
        totalAdmins: stats[1],
        totalSubAdmins: stats[2],
        totalDoctors: stats[3],
        totalReceptionists: stats[4],
        activeUsers: stats[5],
        inactiveUsers: stats[6]
      });
    } else if (creatorRole === 'admin') {
      res.json({
        totalSubAdmins: stats[0],
        totalDoctors: stats[1],
        totalReceptionists: stats[2],
        activeUsers: stats[3],
        inactiveUsers: stats[4]
      });
    } else if (creatorRole === 'sub_admin') {
      res.json({
        totalDoctors: stats[0],
        totalReceptionists: stats[1],
        activeUsers: stats[2],
        inactiveUsers: stats[3]
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
});

// Test endpoint to check authentication
router.get('/staff/test', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Test endpoint called by user:', req.user?.id, 'with role:', req.user?.role);
    res.json({ 
      message: 'Authentication successful',
      user: {
        id: req.user?.id,
        role: req.user?.role,
        hospitalId: req.user?.hospitalId,
        branchId: req.user?.branchId
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Test endpoint error' });
  }
});

// Get staff members with filters
router.get('/staff', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Staff endpoint called by user:', req.user?.id, 'with role:', req.user?.role);
    
    // Check if user has required role
    if (!['master_admin', 'admin', 'sub_admin'].includes(req.user?.role || '')) {
      console.log('User does not have required role:', req.user?.role);
      return res.status(403).json({ 
        message: 'Insufficient permissions to access staff data',
        userRole: req.user?.role,
        userId: req.user?.id
      });
    }
    
    const { search, role, department, branch } = req.query;
    
    // Build filter based on user role and query parameters
    let filter: any = {};
    
    // Role-based filtering
    if (req.user?.role === 'admin') {
      if (!req.user.hospitalId) {
        console.log('Admin user has no hospitalId');
        return res.status(400).json({ 
          message: 'Admin user must be associated with a hospital',
          userRole: req.user.role,
          userId: req.user.id
        });
      }
      filter.hospitalId = req.user.hospitalId;
      console.log('Admin filter - hospitalId:', req.user.hospitalId);
    } else if (req.user?.role === 'sub_admin') {
      if (!req.user.branchId) {
        console.log('Sub-admin user has no branchId');
        return res.status(400).json({ 
          message: 'Sub-admin user must be associated with a branch',
          userRole: req.user.role,
          userId: req.user.id
        });
      }
      filter.branchId = req.user.branchId;
      console.log('Sub-admin filter - branchId:', req.user.branchId);
    } else if (req.user?.role === 'master_admin') {
      // Master admin can see all staff
      console.log('Master admin - no hospital/branch filter');
    }
    
    // Apply search filter
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply role filter
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    // Apply department filter
    if (department && department !== 'all') {
      filter.department = department;
    }
    
    // Apply branch filter
    if (branch && branch !== 'all') {
      filter.branchId = branch;
    }
    
    console.log('Final filter:', JSON.stringify(filter, null, 2));
    
    // Fetch staff members with populated data
    const staffMembers = await User.find(filter)
      .populate('hospitalId', 'name logo')
      .populate('branchId', '_id branchName')
      .populate('createdBy', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${staffMembers.length} staff members`);
    res.json(staffMembers || []);
  } catch (error) {
    console.error('Error fetching staff members:', error);
    res.status(500).json({ 
      message: 'Error fetching staff members',
      error: error instanceof Error ? error.message : 'Unknown error',
      userRole: req.user?.role,
      userId: req.user?.id
    });
  }
});

// Get staff members for a specific hospital
router.get('/staff/:hospitalId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Hospital staff endpoint called by user:', req.user?.id, 'with role:', req.user?.role);
    
    // Check if user has required role
    if (!['master_admin', 'admin', 'sub_admin'].includes(req.user?.role || '')) {
      console.log('User does not have required role:', req.user?.role);
      return res.status(403).json({ 
        message: 'Insufficient permissions to access staff data',
        userRole: req.user?.role,
        userId: req.user?.id
      });
    }
    
    const { hospitalId } = req.params;
    const { search, role, department, branch } = req.query;
    
    // Build filter
    let filter: any = { hospitalId };
    
    // Apply search filter
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply role filter
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    // Apply department filter
    if (department && department !== 'all') {
      filter.department = department;
    }
    
    // Apply branch filter
    if (branch && branch !== 'all') {
      filter.branchId = branch;
    }
    
    // Fetch staff members for the specific hospital
    const staffMembers = await User.find(filter)
      .populate('hospitalId', 'name logo')
      .populate('branchId', '_id branchName')
      .populate('createdBy', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${staffMembers.length} staff members for hospital ${hospitalId}`);
    res.json(staffMembers || []);
  } catch (error) {
    console.error('Error fetching staff members for hospital:', error);
    res.status(500).json({ 
      message: 'Error fetching staff members',
      error: error instanceof Error ? error.message : 'Unknown error',
      userRole: req.user?.role,
      userId: req.user?.id
    });
  }
});

// Get staff members for a specific branch
router.get('/staff/branch/:branchId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Branch staff endpoint called by user:', req.user?.id, 'with role:', req.user?.role);
    
    // Check if user has required role
    if (!['master_admin', 'admin', 'sub_admin'].includes(req.user?.role || '')) {
      console.log('User does not have required role:', req.user?.role);
      return res.status(403).json({ 
        message: 'Insufficient permissions to access staff data',
        userRole: req.user?.role,
        userId: req.user?.id
      });
    }
    
    const { branchId } = req.params;
    const { search, role, department } = req.query;
    
    // Build filter - BRANCH SPECIFIC ONLY
    let filter: any = { branchId };
    
    // Apply search filter
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply role filter
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    // Apply department filter
    if (department && department !== 'all') {
      filter.department = department;
    }
    
    // Fetch staff members for the specific branch only
    const staffMembers = await User.find(filter)
      .populate('hospitalId', 'name logo')
      .populate('branchId', '_id branchName')
      .populate('createdBy', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${staffMembers.length} staff members for branch ${branchId}`);
    res.json(staffMembers || []);
  } catch (error) {
    console.error('Error fetching staff members for branch:', error);
    res.status(500).json({ 
      message: 'Error fetching staff members',
      error: error instanceof Error ? error.message : 'Unknown error',
      userRole: req.user?.role,
      userId: req.user?.id
    });
  }
});

export default router; 