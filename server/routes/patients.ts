import { Router } from 'express';
import { Patient } from '../models';
import { insertPatientSchema } from '../shared/schema';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { enforceTenantIsolation, buildTenantFilter, TenantRequest } from '../middleware/tenant';
import { createAuditLogger, SecurityEvents } from '../utils/audit';

const router = Router();

// Get all patients (tenant-isolated)
router.get('/', authenticateToken, enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const tenantFilter = buildTenantFilter(req);
    let query = Patient.find(tenantFilter);
    
    // Add search functionality
    if (search) {
      query = query.or([
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]);
    }
    
    const [patients, total] = await Promise.all([
      query.sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Patient.countDocuments(tenantFilter)
    ]);

    await auditLogger.logRead('patient', {
      search,
      page: Number(page),
      limit: Number(limit),
      totalResults: patients.length,
      totalCount: total
    });

    res.json({
      data: {
        patients: patients.map(p => ({
          ...p.toObject(),
          id: p._id.toString(),
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await auditLogger.logError('READ', 'patient', { error: errorMessage }, 'Error fetching patients');
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// Get patient by ID (tenant-isolated)
router.get('/:id', authenticateToken, enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const tenantFilter = buildTenantFilter(req);
    const patient = await Patient.findOne({
      _id: req.params.id,
      ...tenantFilter
    });
    
    if (!patient) {
      await auditLogger.logSecurityEvent(SecurityEvents.UNAUTHORIZED_ACCESS, {
        attemptedId: req.params.id,
        reason: 'Patient not found or access denied'
      }, false);
      return res.status(404).json({ message: 'Patient not found' });
    }

    await auditLogger.logRead('patient', {
      patientId: req.params.id,
      patientName: `${patient.firstName} ${patient.lastName}`
    }, req.params.id);

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await auditLogger.logError('READ', 'patient', { 
      patientId: req.params.id,
      error: errorMessage 
    }, 'Error fetching patient', req.params.id);
    res.status(500).json({ message: 'Error fetching patient' });
  }
});

// Create new patient (tenant-isolated)
router.post('/', authenticateToken, enforceTenantIsolation, authorizeRole(['receptionist']), async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const patientData = insertPatientSchema.parse(req.body);
    
    // Check for existing patient within tenant scope
    const tenantFilter = buildTenantFilter(req);
    const existingPatient = await Patient.findOne({ 
      phone: patientData.phone,
      ...tenantFilter
    });

    if (existingPatient) {
      await auditLogger.logSecurityEvent(SecurityEvents.SUSPICIOUS_ACTIVITY, {
        action: 'Duplicate patient creation attempt',
        phone: patientData.phone
      }, false);
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    // Add tenant context to patient data
    const patientWithTenant = {
      ...patientData,
      hospitalId: req.user!.hospitalId,
      branchId: req.user!.branchId
    };

    const patient = new Patient(patientWithTenant);
    await patient.save();

    await auditLogger.logCreate('patient', {
      patientId: patient._id.toString(),
      patientName: `${patient.firstName} ${patient.lastName}`,
      phone: patient.phone,
      email: patient.email
    }, patient._id.toString());

    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await auditLogger.logError('CREATE', 'patient', {
      requestData: req.body,
      error: errorMessage
    }, 'Error creating patient');
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Update patient (tenant-isolated)
router.put('/:id', authenticateToken, enforceTenantIsolation, authorizeRole(['receptionist']), async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const patientData = insertPatientSchema.parse(req.body);
    
    // Check if patient exists and belongs to tenant
    const tenantFilter = buildTenantFilter(req);
    const existingPatient = await Patient.findOne({
      _id: req.params.id,
      ...tenantFilter
    });

    if (!existingPatient) {
      await auditLogger.logSecurityEvent(SecurityEvents.UNAUTHORIZED_ACCESS, {
        attemptedId: req.params.id,
        reason: 'Patient not found or access denied'
      }, false);
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check for phone number conflicts within tenant scope
    if (patientData.phone !== existingPatient.phone) {
      const phoneConflict = await Patient.findOne({
        phone: patientData.phone,
        _id: { $ne: req.params.id },
        ...tenantFilter
      });

      if (phoneConflict) {
        await auditLogger.logSecurityEvent(SecurityEvents.SUSPICIOUS_ACTIVITY, {
          action: 'Phone number conflict during update',
          patientId: req.params.id,
          phone: patientData.phone
        }, false);
        return res.status(400).json({ message: 'Phone number already registered' });
      }
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      patientData,
      { new: true }
    );

    await auditLogger.logUpdate('patient', {
      patientId: req.params.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      changes: patientData
    }, req.params.id);

    res.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await auditLogger.logError('UPDATE', 'patient', {
      patientId: req.params.id,
      requestData: req.body,
      error: errorMessage
    }, 'Error updating patient', req.params.id);
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Delete patient (tenant-isolated)
router.delete('/:id', authenticateToken, enforceTenantIsolation, authorizeRole(['receptionist']), async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    // Check if patient exists and belongs to tenant
    const tenantFilter = buildTenantFilter(req);
    const patient = await Patient.findOne({
      _id: req.params.id,
      ...tenantFilter
    });

    if (!patient) {
      await auditLogger.logSecurityEvent(SecurityEvents.UNAUTHORIZED_ACCESS, {
        attemptedId: req.params.id,
        reason: 'Patient not found or access denied'
      }, false);
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check for active appointments
    const { Appointment } = await import('../models');
    const activeAppointments = await Appointment.countDocuments({
      patientId: req.params.id,
      status: { $in: ['scheduled', 'confirmed'] },
      ...tenantFilter
    });

    if (activeAppointments > 0) {
      await auditLogger.logSecurityEvent(SecurityEvents.SUSPICIOUS_ACTIVITY, {
        action: 'Attempted to delete patient with active appointments',
        patientId: req.params.id,
        activeAppointments
      }, false);
      return res.status(400).json({ 
        message: `Cannot delete patient with ${activeAppointments} active appointment(s)` 
      });
    }

    await Patient.findByIdAndDelete(req.params.id);

    await auditLogger.logDelete('patient', {
      patientId: req.params.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      phone: patient.phone
    }, req.params.id);

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await auditLogger.logError('DELETE', 'patient', {
      patientId: req.params.id,
      error: errorMessage
    }, 'Error deleting patient', req.params.id);
    res.status(500).json({ message: 'Error deleting patient' });
  }
});

// Get patients by hospital ID (for financial management)
router.get('/hospital/:hospitalId', authenticateToken, authorizeRole(['admin', 'master-admin', 'sub-admin']), async (req: AuthRequest, res) => {
  try {
    const { hospitalId } = req.params;
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    let query = Patient.find({ hospitalId });
    
    // Add search functionality
    if (search) {
      query = query.or([
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]);
    }
    
    const patients = await query
      .select('_id firstName lastName phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients by hospital:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

export default router; 