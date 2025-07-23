import express from 'express';
import { Department } from '../models/department';
import { User } from '../models/user';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

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
      .populate('staff', 'firstName lastName role specialization')
      .sort({ createdAt: -1 });

    // Add calculated fields
    const departmentsWithStats = departments.map((dept) => {
      const staffCount = dept.staff.length;
      const activePatients = Math.floor(Math.random() * 50) + 10; // Mock data
      const totalAppointments = Math.floor(Math.random() * 100) + 20; // Mock data

      return {
        ...dept.toObject(),
        staffCount,
        activePatients,
        totalAppointments
      };
    });

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
      headOfDepartment
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
    if (department.staff.length > 0) {
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

export default router; 