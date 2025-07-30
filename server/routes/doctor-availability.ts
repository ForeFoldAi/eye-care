import { Router } from 'express';
import { DoctorAvailability } from '../models/doctorAvailability';
import { User } from '../models/user';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { enforceTenantIsolation, buildTenantFilter, TenantRequest } from '../middleware/tenant';
import { createAuditLogger } from '../utils/audit';

const router = Router();

// Get all doctor availabilities (for admin/sub-admin)
router.get('/', authenticateToken, authorizeRole(['admin', 'sub_admin']), enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const { doctorId, dayOfWeek } = req.query;
    const tenantFilter = buildTenantFilter(req);
    
    let query = DoctorAvailability.find();
    
    if (doctorId) {
      query = query.where('doctorId', doctorId);
    }
    
    if (dayOfWeek !== undefined) {
      query = query.where('dayOfWeek', parseInt(dayOfWeek as string));
    }
    
    const availabilities = await query
      .populate('doctorId', 'firstName lastName specialization department')
      .sort({ doctorId: 1, dayOfWeek: 1 })
      .exec();
    
    await auditLogger.logRead('doctor_availability', {
      filters: { doctorId, dayOfWeek },
      count: availabilities.length
    });
    
    res.json(availabilities);
  } catch (error) {
    console.error('Error fetching doctor availabilities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get specific doctor's availability (for admin/sub-admin)
router.get('/:doctorId', authenticateToken, authorizeRole(['admin', 'sub_admin']), enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const { doctorId } = req.params;
    const tenantFilter = buildTenantFilter(req);
    
    // Verify doctor exists and belongs to tenant
    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      ...tenantFilter
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const availabilities = await DoctorAvailability.find({ doctorId })
      .sort({ dayOfWeek: 1 })
      .exec();
    
    await auditLogger.logRead('doctor_availability', {
      doctorId,
      count: availabilities.length
    });
    
    res.json(availabilities);
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add/Update doctor availability (for admin/sub-admin)
router.post('/:doctorId', authenticateToken, authorizeRole(['admin', 'sub_admin']), enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const { doctorId } = req.params;
    const { dayOfWeek, slots, isActive } = req.body;
    const tenantFilter = buildTenantFilter(req);
    
    // Verify doctor exists and belongs to tenant
    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      ...tenantFilter
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Validate slots
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'At least one time slot is required' });
    }
    
    // Validate each slot
    for (const slot of slots) {
      if (!slot.startTime || !slot.endTime || !slot.hoursAvailable || !slot.tokenCount) {
        return res.status(400).json({ message: 'Invalid slot data' });
      }
    }
    
    // Prevent editing Sunday slots
    if (dayOfWeek === 0) {
      return res.status(400).json({ message: 'Cannot set availability for Sunday' });
    }
    
    // Get current user details for tracking
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const currentUser = await User.findById(req.user.id).select('firstName lastName');
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    // Update or create availability
    const availability = await DoctorAvailability.findOneAndUpdate(
      { doctorId, dayOfWeek },
      {
        doctorId,
        dayOfWeek,
        slots,
        isActive: isActive !== undefined ? isActive : true,
        addedBy: {
          userId: req.user.id,
          role: req.user.role,
          name: `${currentUser.firstName} ${currentUser.lastName}`
        }
      },
      { upsert: true, new: true }
    );
    
    await auditLogger.logCreate('doctor_availability', {
      doctorId,
      dayOfWeek,
      slotsCount: slots.length,
      isActive,
      addedBy: req.user.id
    });
    
    res.json(availability);
  } catch (error) {
    console.error('Error setting doctor availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update doctor availability (for admin/sub-admin)
router.put('/:doctorId/:dayOfWeek', authenticateToken, authorizeRole(['admin', 'sub_admin']), enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const { doctorId, dayOfWeek } = req.params;
    const { slots, isActive } = req.body;
    const tenantFilter = buildTenantFilter(req);
    
    // Verify doctor exists and belongs to tenant
    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      ...tenantFilter
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Validate slots
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'At least one time slot is required' });
    }
    
    // Validate each slot
    for (const slot of slots) {
      if (!slot.startTime || !slot.endTime || !slot.hoursAvailable || !slot.tokenCount) {
        return res.status(400).json({ message: 'Invalid slot data' });
      }
    }
    
    // Prevent editing Sunday slots
    if (parseInt(dayOfWeek) === 0) {
      return res.status(400).json({ message: 'Cannot update availability for Sunday' });
    }
    
    // Get current user details for tracking
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const currentUser = await User.findById(req.user.id).select('firstName lastName');
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    // Update availability
    const availability = await DoctorAvailability.findOneAndUpdate(
      { doctorId, dayOfWeek: parseInt(dayOfWeek) },
      {
        slots,
        isActive: isActive !== undefined ? isActive : true,
        addedBy: {
          userId: req.user.id,
          role: req.user.role,
          name: `${currentUser.firstName} ${currentUser.lastName}`
        },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }
    
    await auditLogger.logUpdate('doctor_availability', {
      doctorId,
      dayOfWeek: parseInt(dayOfWeek),
      slotsCount: slots.length,
      isActive,
      updatedBy: req.user.id
    });
    
    res.json(availability);
  } catch (error) {
    console.error('Error updating doctor availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete doctor availability (for admin/sub-admin)
router.delete('/:doctorId/:dayOfWeek', authenticateToken, authorizeRole(['admin', 'sub_admin']), enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const { doctorId, dayOfWeek } = req.params;
    const tenantFilter = buildTenantFilter(req);
    
    // Verify doctor exists and belongs to tenant
    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      ...tenantFilter
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Prevent deleting Sunday slots
    if (parseInt(dayOfWeek) === 0) {
      return res.status(400).json({ message: 'Cannot delete Sunday availability' });
    }
    
    const result = await DoctorAvailability.findOneAndDelete({
      doctorId,
      dayOfWeek: parseInt(dayOfWeek)
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Availability not found' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    await auditLogger.logDelete('doctor_availability', {
      doctorId,
      dayOfWeek: parseInt(dayOfWeek),
      deletedBy: req.user.id
    });
    
    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all doctors for selection (for admin/sub-admin)
router.get('/doctors/list', authenticateToken, authorizeRole(['admin', 'sub_admin']), enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const tenantFilter = buildTenantFilter(req);
    
    const doctors = await User.find({
      role: 'doctor',
      isActive: true,
      ...tenantFilter
    })
    .select('firstName lastName specialization department email phoneNumber branchId')
    .populate('branchId', 'branchName')
    .sort({ firstName: 1, lastName: 1 })
    .exec();
    
    await auditLogger.logRead('doctors_list', {
      count: doctors.length
    });
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 