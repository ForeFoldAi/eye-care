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
    console.log('Tenant filter for patients:', tenantFilter);
    console.log('User info:', {
      id: req.user?.id,
      role: req.user?.role,
      hospitalId: req.user?.hospitalId,
      branchId: req.user?.branchId
    });
    
    // Debug mode: show all patients if requested
    if (req.query.debug === 'true') {
      console.log('Debug mode: fetching all patients');
      const allPatients = await Patient.find({}).sort({ createdAt: -1 }).limit(10);
      console.log('All patients in database:', allPatients.length);
      console.log('Sample patient:', allPatients[0] ? allPatients[0].toObject() : 'No patients in DB');
      return res.json({
        data: {
          patients: allPatients.map(p => ({
            ...p.toObject(),
            id: p._id.toString(),
          })),
          debug: true,
          message: 'Debug mode: showing all patients'
        },
      });
    }
    
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

    console.log('Patients found:', patients.length);
    console.log('Total patients in tenant:', total);
    console.log('Sample patient:', patients[0] ? patients[0].toObject() : 'No patients found');

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
router.post('/', authenticateToken, enforceTenantIsolation, authorizeRole(['receptionist', 'admin', 'sub_admin']), async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    console.log('Received patient data:', JSON.stringify(req.body, null, 2));
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
    
    // If it's a Zod validation error, provide more specific feedback
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as any;
      console.error('Zod validation errors:', zodError.issues);
      await auditLogger.logError('CREATE', 'patient', {
        requestData: req.body,
        validationErrors: zodError.issues,
        error: errorMessage
      }, 'Validation error creating patient');
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: zodError.issues.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    
    await auditLogger.logError('CREATE', 'patient', {
      requestData: req.body,
      error: errorMessage
    }, 'Error creating patient');
    res.status(400).json({ message: errorMessage || 'Invalid request data' });
  }
});

// Search patients (tenant-isolated) - used for phone number validation and general search
router.get('/search', authenticateToken, enforceTenantIsolation, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const { q, limit = 20 } = req.query;
    
    console.log('Patient search request:', {
      query: q,
      limit,
      userRole: req.user?.role,
      userHospitalId: req.user?.hospitalId,
      userBranchId: req.user?.branchId
    });

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const tenantFilter = buildTenantFilter(req);
    console.log('Tenant filter for search:', tenantFilter);
    
    // For now, let's search all patients if tenant filter is empty (for debugging)
    // This will help us see if the issue is with tenant filtering
    const searchQuery = {
      ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        // Exact phone match for validation
        { phone: q }
      ]
    };

    // Add full name search if query has spaces (likely a name search)
    if (q.includes(' ')) {
      searchQuery.$or.push({
        $expr: { 
          $regexMatch: { 
            input: { $concat: ['$firstName', ' ', '$lastName'] }, 
            regex: q, 
            options: 'i' 
          } 
        }
      });
    }

    console.log('Search query:', JSON.stringify(searchQuery, null, 2));

    let patients;
    try {
      patients = await Patient.find(searchQuery)
        .select('firstName lastName phone email createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string));
    } catch (searchError) {
      console.error('Search with tenant filter failed:', searchError);
      
      // Fallback: search without tenant filter for debugging
      console.log('Trying fallback search without tenant filter...');
      patients = await Patient.find({
        $or: [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: q }
        ]
      })
        .select('firstName lastName phone email createdAt hospitalId branchId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string));
    }

    console.log('Search results:', {
      query: q,
      resultsCount: patients.length,
      patients: patients.map(p => ({
        id: p._id.toString(),
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        hospitalId: p.hospitalId,
        branchId: p.branchId
      }))
    });

    await auditLogger.logRead('patient', {
      searchQuery: q,
      resultsCount: patients.length
    });

    res.json({
      success: true,
      data: patients.map(p => ({
        ...p.toObject(),
        id: p._id.toString(),
      }))
    });

  } catch (error) {
    console.error('Error searching patients:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log detailed error information
    console.error('Search error details:', {
      query: req.query.q,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    await auditLogger.logError('READ', 'patient', { 
      searchQuery: req.query.q,
      error: errorMessage 
    }, 'Error searching patients');
    
    res.status(500).json({ 
      success: false,
      message: 'Error searching patients',
      error: errorMessage
    });
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