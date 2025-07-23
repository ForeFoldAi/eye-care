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



// Get branch statistics for sub-admin dashboard
router.get('/:id/stats', authenticateToken, authorizeRole(['sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.params.id;
    const branch = await Branch.findById(branchId);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check permissions for sub-admin
    if (req.user?.role === 'sub_admin' && branch.subAdminId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Aggregate statistics from various collections
    const [
      totalPatients,
      totalStaff,
      totalAppointments,
      totalPayments,
      activeDoctors,
      activeReceptionists
    ] = await Promise.all([
      User.countDocuments({ branchId, role: { $ne: 'patient' } }), // Count non-patient users
      User.countDocuments({ branchId, role: { $in: ['doctor', 'receptionist', 'nurse'] }, isActive: true }),
      // For now, we'll return estimated appointment counts until appointment model is ready
      Promise.resolve(Math.floor(Math.random() * 50) + 20),
      // For now, we'll return estimated payment totals until payment model is ready
      Promise.resolve(Math.floor(Math.random() * 100000) + 50000),
      User.countDocuments({ branchId, role: 'doctor', isActive: true }),
      User.countDocuments({ branchId, role: 'receptionist', isActive: true })
    ]);

    const stats = {
      totalPatients: totalPatients || 0,
      totalStaff: totalStaff || 0,
      totalAppointments: totalAppointments || 0,
      totalRevenue: totalPayments || 0,
      monthlyGrowth: Math.floor(Math.random() * 20) + 5, // 5-25% growth
      activeDoctors: activeDoctors || 0,
      activeReceptionists: activeReceptionists || 0,
      bedOccupancy: Math.floor(Math.random() * 40) + 60, // 60-100% occupancy
      patientSatisfaction: Math.floor(Math.random() * 20) + 80, // 80-100% satisfaction
      avgWaitTime: Math.floor(Math.random() * 20) + 10, // 10-30 minutes
      responseRate: Math.floor(Math.random() * 20) + 80 // 80-100% response rate
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching branch stats:', error);
    res.status(500).json({ message: 'Error fetching branch statistics' });
  }
});

// Helper to safely convert to ISO string
function safeToISOString(date: any) {
  if (!date) return new Date().toISOString();
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// Get branch activities for sub-admin dashboard
router.get('/:id/activities', authenticateToken, authorizeRole(['sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.params.id;
    console.log('Fetching activities for branchId:', branchId);
    const branch = await Branch.findById(branchId);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check permissions for sub-admin
    if (req.user?.role === 'sub_admin' && branch.subAdminId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get recent user activities (registrations, updates)
    const recentUsers = await User.find({ branchId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName role createdAt updatedAt');
    console.log('Recent users for activities:', recentUsers);

    const activities = recentUsers.map((user, index) => {
      const createdAt = safeToISOString(user.createdAt);
      const updatedAt = safeToISOString(user.updatedAt);
      return {
        id: user._id.toString(),
        type: createdAt === updatedAt ? 'staff' : 'staff',
        message: createdAt === updatedAt
          ? `New ${user.role} ${user.firstName} ${user.lastName} joined the branch`
          : `${user.role} ${user.firstName} ${user.lastName} profile updated`,
        timestamp: updatedAt,
        status: 'success'
      };
    });

    // Add some mock appointment activities until appointment system is ready
    const mockActivities = [
      {
        id: 'mock-1',
        type: 'appointment',
        message: 'New appointment scheduled for today',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        status: 'success'
      },
      {
        id: 'mock-2', 
        type: 'patient',
        message: 'Patient check-in completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        status: 'success'
      }
    ];

    res.json([...activities, ...mockActivities]);
  } catch (error) {
    console.error('Error fetching branch activities:', error);
    res.status(500).json({ message: 'Error fetching branch activities', error: error instanceof Error ? error.message : error });
  }
});

// Get branch staff for sub-admin dashboard  
router.get('/:id/staff', authenticateToken, authorizeRole(['sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.params.id;
    const branch = await Branch.findById(branchId);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check permissions for sub-admin
    if (req.user?.role === 'sub_admin' && branch.subAdminId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const staff = await User.find({ 
      branchId, 
      role: { $in: ['doctor', 'receptionist', 'nurse', 'admin'] }
    })
    .select('firstName lastName role specialization isActive createdAt')
    .sort({ createdAt: -1 });

    const staffMembers = staff.map(member => ({
      id: member._id.toString(),
      name: `${member.firstName} ${member.lastName}`,
      role: member.role,
      department: member.specialization || 'General',
      status: member.isActive ? 'active' : 'inactive'
    }));

    res.json(staffMembers);
  } catch (error) {
    console.error('Error fetching branch staff:', error);
    res.status(500).json({ message: 'Error fetching branch staff' });
  }
});

// Get comprehensive analytics data for sub-admin
router.get('/:id/analytics', authenticateToken, authorizeRole(['sub_admin', 'admin', 'master_admin']), async (req: AuthRequest, res) => {
  try {
    const branchId = req.params.id;
    const { period = '30', department = 'all' } = req.query;
    const branch = await Branch.findById(branchId);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check permissions for sub-admin
    if (req.user?.role === 'sub_admin' && branch.subAdminId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period as string));

    // Get real data from various collections
    const [
      totalUsers,
      activeUsers,
      doctorUsers,
      recentUsers,
      departments,
      previousPeriodUsers
    ] = await Promise.all([
      User.countDocuments({ branchId }),
      User.countDocuments({ branchId, isActive: true }),
      User.find({ branchId, role: 'doctor', isActive: true })
        .select('firstName lastName specialization createdAt')
        .sort({ createdAt: -1 }),
      User.find({ branchId, createdAt: { $gte: startDate } })
        .select('firstName lastName role createdAt')
        .sort({ createdAt: -1 })
        .limit(20),
      User.aggregate([
        { $match: { branchId: branch._id } },
        { $group: { _id: '$specialization', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
      ]),
      User.countDocuments({ 
        branchId, 
        createdAt: { 
          $gte: new Date(startDate.getTime() - (parseInt(period as string) * 24 * 60 * 60 * 1000)),
          $lt: startDate 
        }
      })
    ]);

    // Calculate growth metrics
    const userGrowth = previousPeriodUsers > 0 ? ((totalUsers - previousPeriodUsers) / previousPeriodUsers * 100) : 0;

    // Process department performance
    const departmentPerformance = departments.map(dept => ({
      name: dept._id || 'General',
      revenue: Math.floor(Math.random() * 50000) + 25000, // Simulated until billing is ready
      patients: dept.count,
      satisfaction: Math.floor(Math.random() * 20) + 80, // 80-100%
      growth: Math.floor(Math.random() * 30) - 10, // -10% to +20%
      activeStaff: dept.active
    }));

    // Process top doctors
    const topDoctors = doctorUsers.map(doctor => ({
      name: `${doctor.firstName} ${doctor.lastName}`,
      specialty: doctor.specialization || 'General Medicine',
      patients: Math.floor(Math.random() * 50) + 20, // Simulated until appointments are ready
      revenue: Math.floor(Math.random() * 25000) + 15000, // Simulated until billing is ready
      rating: (Math.random() * 1 + 4).toFixed(1) // 4.0 - 5.0 rating
    }));

    // Revenue time series (simulated with realistic patterns)
    const revenueTimeSeries = [];
    for (let i = parseInt(period as string); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      revenueTimeSeries.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 2000 + (Math.sin(i * 0.2) * 1000),
        appointments: Math.floor(Math.random() * 20) + 10 + Math.floor(Math.sin(i * 0.3) * 5),
        patients: Math.floor(Math.random() * 15) + 5 + Math.floor(Math.sin(i * 0.25) * 3)
      });
    }

    const analyticsData = {
      overview: {
        totalRevenue: Math.floor(Math.random() * 200000) + 100000,
        revenueGrowth: Math.floor(Math.random() * 20) + 5,
        totalPatients: totalUsers,
        patientGrowth: userGrowth,
        totalAppointments: Math.floor(Math.random() * 500) + 200,
        appointmentGrowth: Math.floor(Math.random() * 25) + 5,
        averageWaitTime: Math.floor(Math.random() * 15) + 10,
        patientSatisfaction: (Math.random() * 0.5 + 4.5).toFixed(1)
      },
      departmentPerformance,
      topDoctors: topDoctors.slice(0, 5),
      operationalMetrics: {
        bedOccupancy: Math.floor(Math.random() * 30) + 70,
        equipmentUtilization: Math.floor(Math.random() * 20) + 80,
        staffEfficiency: Math.floor(Math.random() * 15) + 85,
        emergencyResponseTime: (Math.random() * 5 + 5).toFixed(1)
      },
      revenueTimeSeries,
      recentActivities: recentUsers.map(user => ({
        id: user._id.toString(),
        type: 'user_registration',
        message: `New ${user.role} ${user.firstName} ${user.lastName} joined`,
        timestamp: user.createdAt,
        value: Math.floor(Math.random() * 5000) + 1000
      })),
      departmentDistribution: departmentPerformance.map(dept => ({
        name: dept.name,
        value: dept.patients,
        revenue: dept.revenue
      }))
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

export default router; 