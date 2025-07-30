import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Hospital, User, Subscription } from '../models';
import { insertHospitalSchema, insertUserSchema } from '../shared/schema';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';

const router = Router();



// Get all hospitals (master admin only)
router.get('/', authenticateToken, authorizeRole(['master_admin']), async (req: AuthRequest, res) => {
  try {
    const hospitals = await Hospital.find()
      .populate('createdBy', 'firstName lastName email')
      .populate('adminId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    // Get subscription information for each hospital
    const hospitalsWithSubscription = await Promise.all(
      hospitals.map(async (hospital) => {
        const subscription = await Subscription.findOne({ 
          hospitalId: hospital._id,
          isActive: true 
        }).sort({ createdAt: -1 });

        // Determine subscription status
        let subscriptionStatus = 'not_assigned';
        if (subscription) {
          if (subscription.status === 'active' || subscription.status === 'trial') {
            subscriptionStatus = 'active';
          } else if (subscription.status === 'suspended' || subscription.status === 'expired' || subscription.status === 'cancelled') {
            subscriptionStatus = 'inactive';
          }
        }

        return {
          ...hospital.toObject(),
          subscription: subscription ? {
            _id: subscription._id,
            planName: subscription.planName,
            planType: subscription.planType,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            nextBillingDate: subscription.nextBillingDate,
            monthlyCost: subscription.monthlyCost,
            currency: subscription.currency
          } : null,
          subscriptionStatus
        };
      })
    );
    
    res.json(hospitalsWithSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospitals' });
  }
});

// Get hospitals by admin (admin only)
router.get('/my-hospitals', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const hospitals = await Hospital.find({ adminId: req.user?.id })
      .populate('createdBy', 'firstName lastName email')
      .populate('adminId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    // Get subscription information for each hospital
    const hospitalsWithSubscription = await Promise.all(
      hospitals.map(async (hospital) => {
        const subscription = await Subscription.findOne({ 
          hospitalId: hospital._id,
          isActive: true 
        }).sort({ createdAt: -1 });

        // Determine subscription status
        let subscriptionStatus = 'not_assigned';
        if (subscription) {
          if (subscription.status === 'active' || subscription.status === 'trial') {
            subscriptionStatus = 'active';
          } else if (subscription.status === 'suspended' || subscription.status === 'expired' || subscription.status === 'cancelled') {
            subscriptionStatus = 'inactive';
          }
        }

        return {
          ...hospital.toObject(),
          subscription: subscription ? {
            _id: subscription._id,
            planName: subscription.planName,
            planType: subscription.planType,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            nextBillingDate: subscription.nextBillingDate,
            monthlyCost: subscription.monthlyCost,
            currency: subscription.currency
          } : null,
          subscriptionStatus
        };
      })
    );
    
    res.json(hospitalsWithSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospitals' });
  }
});

// Get single hospital
router.get('/:id', authenticateToken, authorizeRole(['master_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('adminId', 'firstName lastName email');
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check if user has access to this hospital
    if (req.user?.role === 'admin' && hospital.adminId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospital' });
  }
});

// Create hospital (master admin only)
router.post('/', authenticateToken, authorizeRole(['master_admin']), async (req: AuthRequest, res) => {
  try {
    const hospitalData = insertHospitalSchema.parse(req.body);
    
    // Check if admin exists and is an admin role
    const admin = await User.findById(hospitalData.adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid admin ID or user is not an admin' });
    }

    const hospital = new Hospital({
      ...hospitalData,
      createdBy: req.user?.id
    });

    await hospital.save();

    // Update admin's hospitalId
    await User.findByIdAndUpdate(hospitalData.adminId, { hospitalId: hospital._id });

    res.status(201).json(hospital);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error creating hospital' });
    }
  }
});

// Update hospital
router.put('/:id', authenticateToken, authorizeRole(['master_admin', 'admin']), async (req: AuthRequest, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check permissions (hospital.adminId is ObjectId here, not populated)
    if (req.user?.role === 'admin' && hospital.adminId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = insertHospitalSchema.partial().parse(req.body);
    
    // If changing admin, verify the new admin exists and is an admin role
    if (updateData.adminId) {
      const newAdmin = await User.findById(updateData.adminId);
      if (!newAdmin || newAdmin.role !== 'admin') {
        return res.status(400).json({ message: 'Invalid admin ID or user is not an admin' });
      }
    }

    const updatedHospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('adminId', 'firstName lastName email');

    res.json(updatedHospital);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error updating hospital' });
    }
  }
});

// Delete hospital (master admin only)
router.delete('/:id', authenticateToken, authorizeRole(['master_admin']), async (req: AuthRequest, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check if hospital has any branches
    const { Branch } = await import('../models/branch');
    const branchCount = await Branch.countDocuments({ hospitalId: req.params.id });
    
    if (branchCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete hospital. It has ${branchCount} branch(es). Delete branches first.` 
      });
    }

    await Hospital.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting hospital' });
  }
});

// Get hospital statistics
router.get('/:id/stats', authenticateToken, authorizeRole(['master_admin', 'admin', 'sub_admin']), async (req: AuthRequest, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check permissions (hospital.adminId is ObjectId here, not populated)
    if (req.user?.role === 'admin' && hospital.adminId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { Branch, Patient, Appointment, Payment } = await import('../models');
    
    const stats = await Promise.all([
      Branch.countDocuments({ hospitalId: req.params.id, isActive: true }),
      Patient.countDocuments({ hospitalId: req.params.id }),
      Appointment.countDocuments({ hospitalId: req.params.id }),
      Payment.aggregate([
        { $match: { hospitalId: new (await import('mongoose')).Types.ObjectId(req.params.id) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      totalBranches: stats[0],
      totalPatients: stats[1],
      totalAppointments: stats[2],
      totalRevenue: stats[3][0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospital statistics' });
  }
});

export default router; 