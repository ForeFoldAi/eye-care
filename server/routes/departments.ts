import express from 'express';
import { Department } from '../models/department';
import { User } from '../models/user';
import { Patient } from '../models/patient';
import { Appointment } from '../models/appointment';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all departments for a hospital (admin only)
router.get('/hospital/:hospitalId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { hospitalId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user has access to this hospital
    if (user.role !== 'admin' || user.hospitalId !== hospitalId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const departments = await Department.find({ hospitalId })
      .populate('createdBy', 'firstName lastName email')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 });

    // Add calculated fields with real data
    const departmentsWithStats = await Promise.all(departments.map(async (dept) => {
      // Get all staff members assigned to this department (from User model)
      // Try multiple ways to find staff for this department
      let staffInDepartment = await User.find({
        department: dept.name,
        isActive: true,
        hospitalId: user.hospitalId
      }).select('firstName lastName role specialization');
      
      // If no staff found with exact department name, try case-insensitive search
      if (staffInDepartment.length === 0) {
        staffInDepartment = await User.find({
          department: { $regex: new RegExp(dept.name, 'i') },
          isActive: true,
          hospitalId: user.hospitalId
        }).select('firstName lastName role specialization');
      }
      
      // If still no staff found, try to find any active staff in this hospital
      // This is a fallback for departments that might not have staff assigned yet
      if (staffInDepartment.length === 0) {
        console.log(`No staff found for department: ${dept.name}`);
        // For now, we'll keep staffCount as 0 but you might want to assign some staff
        // or create a default staff member for demonstration purposes
      }
      
      const staffCount = staffInDepartment.length;
      
      // Get doctors in this department for patient calculations
      const doctorsInDepartment = staffInDepartment.filter(staff => staff.role === 'doctor');
      
      // Get unique patients who have appointments with doctors in this department
      const doctorIds = doctorsInDepartment.map(doctor => doctor._id);
      const uniquePatients = await Appointment.distinct('patientId', {
        doctorId: { $in: doctorIds }
      });
      
      // Get total appointments for doctors in this department
      const totalAppointments = await Appointment.countDocuments({
        doctorId: { $in: doctorIds }
      });

      return {
        ...dept.toObject(),
        staff: staffInDepartment, // Use the actual staff data from User model
        staffCount,
        activePatients: uniquePatients.length,
        totalAppointments
      };
    }));

    res.json(departmentsWithStats);
  } catch (error) {
    console.error('Error fetching hospital departments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single department by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const department = await Department.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('branchId', 'branchName');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if user has access to this department
    if (user.role === 'doctor' && user.department !== department.name) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (user.role === 'receptionist' && user.department && user.department !== department.name) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (user.role === 'admin' && user.hospitalId !== department.hospitalId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (user.role === 'sub_admin' && user.branchId !== department.branchId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all departments for a branch
router.get('/branch/:branchId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { branchId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user has access to this branch
    if (user.role !== 'admin' && user.branchId !== branchId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const departments = await Department.find({ branchId })
      .populate('createdBy', 'firstName lastName email')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 });

    // Add calculated fields with real data - BRANCH SPECIFIC ONLY
    const departmentsWithStats = await Promise.all(departments.map(async (dept) => {
      // Get all staff members assigned to this department (from User model) - BRANCH SPECIFIC
      const staffInDepartment = await User.find({
        department: dept.name,
        isActive: true,
        branchId: branchId // Use branchId instead of hospitalId for branch-specific filtering
      }).select('firstName lastName role specialization');
      
      const staffCount = staffInDepartment.length;
      
      // Get doctors in this department for patient calculations
      const doctorsInDepartment = staffInDepartment.filter(staff => staff.role === 'doctor');
      
      // Get unique patients who have appointments with doctors in this department
      const doctorIds = doctorsInDepartment.map(doctor => doctor._id);
      const uniquePatients = await Appointment.distinct('patientId', {
        doctorId: { $in: doctorIds }
      });
      
      // Get total appointments for doctors in this department
      const totalAppointments = await Appointment.countDocuments({
        doctorId: { $in: doctorIds }
      });

      return {
        ...dept.toObject(),
        staff: staffInDepartment, // Use the actual staff data from User model
        staffCount,
        activePatients: uniquePatients.length,
        totalAppointments
      };
    }));

    res.json(departmentsWithStats);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new department
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, branchId, headOfDepartment } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user has access to this branch
    if (user.role !== 'admin' && user.branchId !== branchId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if department name already exists in this branch
    const existingDepartment = await Department.findOne({ name, branchId });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department name already exists in this branch' });
    }

    const department = new Department({
      name,
      description,
      branchId,
      hospitalId: user.hospitalId,
      headOfDepartment,
      createdBy: user.id
    });

    await department.save();

    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update department
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, headOfDepartment, isActive } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if user has access to this branch
    if (user.role !== 'admin' && user.branchId !== department.branchId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ 
        name, 
        branchId: department.branchId,
        _id: { $ne: req.params.id }
      });
      if (existingDepartment) {
        return res.status(400).json({ message: 'Department name already exists in this branch' });
      }
    }

    department.name = name || department.name;
    department.description = description || department.description;
    department.headOfDepartment = headOfDepartment || department.headOfDepartment;
    department.isActive = isActive !== undefined ? isActive : department.isActive;

    await department.save();

    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete department
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if user has access to this branch
    if (user.role !== 'admin' && user.branchId !== department.branchId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if department has staff assigned
    const staffInDepartment = await User.find({
      department: department.name,
      isActive: true,
      hospitalId: user.hospitalId
    });

    if (staffInDepartment.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department with assigned staff. Please reassign staff first.' 
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all departments for a hospital (admin only)
router.get('/hospital/:hospitalId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { hospitalId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user has access to this hospital
    if (user.role !== 'admin' || user.hospitalId !== hospitalId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const departments = await Department.find({ hospitalId })
      .populate('createdBy', 'firstName lastName email')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 });

    // Add calculated fields with real data - BRANCH SPECIFIC STAFF
    const departmentsWithStats = await Promise.all(departments.map(async (dept) => {
      // Get all staff members assigned to this department (from User model) - BRANCH SPECIFIC
      const staffInDepartment = await User.find({
        department: dept.name,
        isActive: true,
        branchId: dept.branchId // Use branchId to get staff from the same branch as the department
      }).select('firstName lastName role specialization');
      
      console.log(`Department ${dept.name} (Branch: ${dept.branchId}): Found ${staffInDepartment.length} staff members`);
      
      const staffCount = staffInDepartment.length;
      
      // Get doctors in this department for patient calculations
      const doctorsInDepartment = staffInDepartment.filter(staff => staff.role === 'doctor');
      
      // Get unique patients who have appointments with doctors in this department
      const doctorIds = doctorsInDepartment.map(doctor => doctor._id);
      const uniquePatients = await Appointment.distinct('patientId', {
        doctorId: { $in: doctorIds }
      });
      
      // Get total appointments for doctors in this department
      const totalAppointments = await Appointment.countDocuments({
        doctorId: { $in: doctorIds }
      });

      return {
        ...dept.toObject(),
        staff: staffInDepartment, // Use the actual staff data from User model
        staffCount,
        activePatients: uniquePatients.length,
        totalAppointments
      };
    }));

    res.json(departmentsWithStats);
  } catch (error) {
    console.error('Error fetching hospital departments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check staff department assignments
router.get('/debug/staff', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const allStaff = await User.find({
      hospitalId: user.hospitalId,
      isActive: true
    }).select('firstName lastName role department');

    const departments = await Department.find({ hospitalId: user.hospitalId }).select('name');

    res.json({
      staff: allStaff.map(s => ({
        name: `${s.firstName} ${s.lastName}`,
        role: s.role,
        department: s.department || 'None'
      })),
      departments: departments.map(d => d.name),
      totalStaff: allStaff.length,
      staffWithDepartments: allStaff.filter(s => s.department).length
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 