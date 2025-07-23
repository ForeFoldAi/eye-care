import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Branch, Hospital, User } from '../models';
import { insertBranchSchema, insertUserSchema } from '../shared/schema';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all branches (master admin only)
router.get('/', authenticateToken, authorizeRole(['master_admin']), async (req: AuthRequest, res) => {
  try {
    const branches = await Branch.find()
      .populate('hospitalId', 'name')
      .populate('subAdminId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches' });
  }
});

// Get branches by hospital (admin only)
router.get('/hospital/:hospitalId', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Verify admin has access to this hospital
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital || hospital.adminId.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const branches = await Branch.find({ hospitalId: req.params.hospitalId })
      .populate('hospitalId', 'name')
      .populate('subAdminId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches' });
  }
});

// Get branches by sub-admin (sub-admin only)
router.get('/my-branches', authenticateToken, authorizeRole(['sub_admin']), async (req: AuthRequest, res) => {
  try {
    const branches = await Branch.find({ subAdminId: req.user?.id })
      .populate('hospitalId', 'name')
      .populate('subAdminId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches' });
  }
});

// Get single branch
router.get('/:id', authenticateToken, authorizeRole(['master_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('hospitalId', 'name')
      .populate('subAdminId', 'firstName lastName email');
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check permissions
    if (req.user?.role === 'admin') {
      const hospital = await Hospital.findById(branch.hospitalId);
      if (!hospital || hospital.adminId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user?.role === 'sub_admin') {
      // Allow access if user is the sub-admin assigned to this branch OR if user's branchId matches
      if (branch.subAdminId.toString() !== req.user.id && req.user.branchId !== branch._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branch' });
  }
});

// Create branch with sub-admin (admin only)
router.post('/', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Validate the request data manually since we need to create sub-admin first
    const branchData: any = req.body;
    
    // Basic validation
    if (!branchData.branchName || !branchData.hospitalId || !branchData.email || 
        !branchData.phoneNumber || !branchData.country || !branchData.state || 
        !branchData.city || !branchData.addressLine1 || !branchData.postalCode ||
        !branchData.workingDays || branchData.workingDays.length === 0 ||
        !branchData.workingHoursStart || !branchData.workingHoursEnd ||
        !branchData.timezone || !branchData.adminFirstName || !branchData.adminLastName ||
        !branchData.adminEmail || !branchData.adminPassword || !branchData.adminPhone) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
    // Verify admin has access to this hospital
    const hospital = await Hospital.findById(branchData.hospitalId);
    if (!hospital || hospital.adminId.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied to this hospital' });
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: branchData.adminEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin email already exists' });
    }

    // Check if branch email already exists
    const existingBranch = await Branch.findOne({ email: branchData.email });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch email already exists' });
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash(branchData.adminPassword, 10);

    // Create the sub-admin user
    const subAdmin = new User({
      firstName: branchData.adminFirstName,
      lastName: branchData.adminLastName,
      email: branchData.adminEmail,
      username: branchData.adminEmail.split('@')[0], // Generate username from email
      password: hashedPassword,
      role: 'sub_admin',
      phoneNumber: branchData.adminPhone,
      isActive: true,
      hospitalId: branchData.hospitalId,
      createdBy: req.user?.id
    });

    await subAdmin.save();

    // Create the branch
    const branch = new Branch({
      branchName: branchData.branchName,
      hospitalId: branchData.hospitalId,
      branchCode: branchData.branchCode,
      email: branchData.email,
      phoneNumber: branchData.phoneNumber,
      alternatePhone: branchData.alternatePhone,
      
      // Location Details
      country: branchData.country,
      state: branchData.state,
      city: branchData.city,
      addressLine1: branchData.addressLine1,
      addressLine2: branchData.addressLine2,
      postalCode: branchData.postalCode,
      googleMapLink: branchData.googleMapLink,
      
      // Operational Settings
      workingDays: branchData.workingDays,
      workingHoursStart: branchData.workingHoursStart,
      workingHoursEnd: branchData.workingHoursEnd,
      timezone: branchData.timezone,
      maxDailyAppointments: branchData.maxDailyAppointments,
      defaultLanguage: branchData.defaultLanguage,
      
      // Branch Admin Setup
      adminFirstName: branchData.adminFirstName,
      adminLastName: branchData.adminLastName,
      adminEmail: branchData.adminEmail,
      adminPhone: branchData.adminPhone,
      subAdminId: subAdmin._id,
      
      // Status and Activation
      isActive: branchData.isActive,
      activationDate: branchData.activationDate ? new Date(branchData.activationDate) : undefined,
      
      // System fields
      createdBy: req.user?.id
    } as any);

    await branch.save();

    // Update sub-admin's branchId
    await User.findByIdAndUpdate(subAdmin._id, { 
      branchId: branch._id
    });

    // Populate references for response
    await branch.populate('hospitalId', 'name');
    await branch.populate('subAdminId', 'firstName lastName email');

    res.status(201).json({ 
      branch,
      message: 'Branch created successfully with sub-admin account',
      adminCredentials: {
        email: branchData.adminEmail,
        role: 'sub_admin'
      }
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error creating branch' });
    }
  }
});

// Update branch
router.put('/:id', authenticateToken, authorizeRole(['admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check permissions
    if (req.user?.role === 'admin') {
      const hospital = await Hospital.findById(branch.hospitalId);
      if (!hospital || hospital.adminId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user?.role === 'sub_admin' && branch.subAdminId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = insertBranchSchema.partial().parse(req.body);
    
    // If changing sub-admin, verify the new sub-admin exists and is a sub-admin role
    if (req.body.subAdminId) {
      const newSubAdmin = await User.findById(req.body.subAdminId);
      if (!newSubAdmin || newSubAdmin.role !== 'sub_admin') {
        return res.status(400).json({ message: 'Invalid sub-admin ID or user is not a sub-admin' });
      }
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('hospitalId', 'name')
     .populate('subAdminId', 'firstName lastName email');

    res.json(updatedBranch);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error updating branch' });
    }
  }
});

// Delete branch (admin only)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Verify admin has access to this hospital
    const hospital = await Hospital.findById(branch.hospitalId);
    if (!hospital || hospital.adminId.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if branch has any users (doctors, receptionists)
    const userCount = await User.countDocuments({ branchId: req.params.id });
    
    if (userCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete branch. It has ${userCount} user(s). Remove users first.` 
      });
    }

    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting branch' });
  }
});

// Get branch statistics
router.get('/:id/stats', authenticateToken, authorizeRole(['master_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check permissions
    if (req.user?.role === 'admin') {
      const hospital = await Hospital.findById(branch.hospitalId);
      if (!hospital || hospital.adminId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user?.role === 'sub_admin') {
      // Allow access if user is the sub-admin assigned to this branch OR if user's branchId matches
      if (branch.subAdminId.toString() !== req.user.id && req.user.branchId !== branch._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const { Patient, Appointment, Payment, User } = await import('../models');
    
    const stats = await Promise.all([
      Patient.countDocuments({ branchId: req.params.id }),
      Appointment.countDocuments({ branchId: req.params.id }),
      Payment.aggregate([
        { $match: { branchId: new (await import('mongoose')).Types.ObjectId(req.params.id) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ branchId: req.params.id, role: 'doctor' }),
      User.countDocuments({ branchId: req.params.id, role: 'receptionist' })
    ]);

    res.json({
      totalPatients: stats[0],
      totalAppointments: stats[1],
      totalRevenue: stats[2][0]?.total || 0,
      totalDoctors: stats[3],
      totalReceptionists: stats[4]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branch statistics' });
  }
});

// Get recent activities for a branch (sub-admin only)
router.get('/:branchId/activities', authenticateToken, authorizeRole(['sub_admin']), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId);
    if (!branch || branch.subAdminId.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // TODO: Replace with real activity fetching logic
    const activities: any[] = [];
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities' });
  }
});

// Get staff for a branch (sub-admin only)
router.get('/:branchId/staff', authenticateToken, authorizeRole(['sub_admin']), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId);
    if (!branch || branch.subAdminId.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { User } = await import('../models');
    const staff = await User.find({ branchId: req.params.branchId })
      .select('firstName lastName role department isActive profilePhotoUrl')
      .lean();

    const staffList = staff.map(user => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      department: user.department || '',
      status: user.isActive ? 'active' : 'inactive',
      avatar: user.profilePhotoUrl || ''
    }));

    res.json(staffList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff' });
  }
});

// Get department performance for a branch (sub-admin only)
router.get('/:branchId/departments/performance', authenticateToken, authorizeRole(['sub_admin']), async (req: AuthRequest, res) => {
  try {
    const { Department } = await import('../models');
    const departments = await Department.find({ branchId: req.params.branchId })
      .populate('staff', 'firstName lastName')
      .lean();

    // Example: Calculate stats (replace with real logic)
    const performance = departments.map(dept => ({
      name: dept.name,
      patients: Array.isArray(dept.staff) ? dept.staff.length : 0,
      utilization: 0
    }));

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching department performance' });
  }
});

export default router; 