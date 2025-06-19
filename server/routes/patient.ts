// server/routes/patients.ts
import { Request, Response } from 'express';
import Patient, { IPatient } from '../models/patient';
import connectDB from '../config/database';

export interface PatientRequestBody {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
}

export interface PatientResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  errors?: string[];
}

// GET /api/patients - Get all patients
export const getAllPatients = async (req: Request, res: Response<PatientResponse>): Promise<void> => {
  try {
    await connectDB();

    const { page = 1, limit = 50, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let query: any = { isActive: true };

    // Add search functionality if search query is provided
    if (search && typeof search === 'string' && search.length > 0) {
      query = {
        ...query,
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { $expr: { 
            $regexMatch: { 
              input: { $concat: ['$firstName', ' ', '$lastName'] }, 
              regex: search, 
              options: 'i' 
            } 
          }}
        ]
      };
    }

    const patients = await Patient.find(query)
      .select('firstName lastName phone email patientId registrationDate createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Patient.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        patients: patients.map(p => p.toObject({ virtuals: true })),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalPatients: total,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /api/patients - Create new patient
export const createPatient = async (req: Request<{}, PatientResponse, PatientRequestBody>, res: Response<PatientResponse>): Promise<void> => {
  try {
    await connectDB();

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      emergencyContactName,
      emergencyContactPhone,
      medicalHistory
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !gender || !phone) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: ['firstName, lastName, dateOfBirth, gender, and phone are required']
      });
      return;
    }

    // Check if patient with same phone already exists
    const existingPatient = await Patient.findOne({ phone: phone.trim() });
    if (existingPatient) {
      res.status(409).json({
        success: false,
        message: 'Patient with this phone number already exists',
        error: 'DUPLICATE_PHONE'
      });
      return;
    }

    // Check if email already exists (if provided)
    if (email && email.trim()) {
      const existingEmailPatient = await Patient.findOne({ email: email.trim().toLowerCase() });
      if (existingEmailPatient) {
        res.status(409).json({
          success: false,
          message: 'Patient with this email already exists',
          error: 'DUPLICATE_EMAIL'
        });
        return;
      }
    }

    // Create new patient
    const newPatient = new Patient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: new Date(dateOfBirth),
      gender,
      phone: phone.trim(),
      email: email?.trim() || undefined,
      address: address?.trim() || undefined,
      emergencyContactName: emergencyContactName?.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone?.trim() || undefined,
      medicalHistory: medicalHistory?.trim() || undefined
    });

    const savedPatient = await newPatient.save();

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: savedPatient.toObject({ virtuals: true })
    });

  } catch (error) {
    console.error('Error creating patient:', error);

    // Handle Mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
      return;
    }

    // Handle duplicate key errors
    if (error instanceof Error && (error as any).code === 11000) {
      const field = Object.keys((error as any).keyPattern || {})[0];
      res.status(409).json({
        success: false,
        message: `Patient with this ${field} already exists`,
        error: 'DUPLICATE_KEY'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error registering patient',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/patients/search - Search patients
export const searchPatients = async (req: Request, res: Response<PatientResponse>): Promise<void> => {
  try {
    await connectDB();

    const { q, limit = 20 } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
      return;
    }

    const searchQuery = {
      isActive: true,
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { patientId: { $regex: q, $options: 'i' } },
        { $expr: { 
          $regexMatch: { 
            input: { $concat: ['$firstName', ' ', '$lastName'] }, 
            regex: q, 
            options: 'i' 
          } 
        }}
      ]
    };

    const patients = await Patient.find(searchQuery)
      .select('firstName lastName phone email patientId registrationDate')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.status(200).json({
      success: true,
      data: patients.map(p => p.toObject({ virtuals: true }))
    });

  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching patients',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/patients/:id - Get patient by ID
export const getPatientById = async (req: Request, res: Response<PatientResponse>): Promise<void> => {
  try {
    await connectDB();

    const { id } = req.params;

    // Allow finding by either MongoDB _id or custom patientId
    let patient = await Patient.findById(id);
    if (!patient) {
      patient = await Patient.findOne({ patientId: id });
    }

    if (!patient || !patient.isActive) {
      res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: patient.toObject({ virtuals: true })
    });

  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/dashboard/stats - Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get this week's date range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Count new patients this week
    const newPatients = await Patient.countDocuments({
      createdAt: { $gte: startOfWeek },
      isActive: true
    });

    // Count total active patients
    const totalPatients = await Patient.countDocuments({ isActive: true });

    // Count patients registered today
    const patientsToday = await Patient.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      isActive: true
    });

    const stats = {
      todayAppointments: 0, // Will be updated when you have appointments collection
      newPatients,
      paymentsToday: 0, // Will be updated when you have payments collection
      cancellations: 0, // Will be updated when you have appointments collection
      totalPatients,
      patientsToday
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// PUT /api/patients/:id - Update patient by ID
export const updatePatient = async (req: Request, res: Response<PatientResponse>): Promise<void> => {
  try {
    await connectDB();

    const { id } = req.params;

    const updatedPatient = await Patient.findOneAndUpdate(
      { $or: [{ _id: id }, { patientId: id }] }, // Allow finding by either _id or patientId
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedPatient.toObject({ virtuals: true })
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating patient',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// DELETE /api/patients/:id - Deactivate patient
export const deactivatePatient = async (req: Request, res: Response<PatientResponse>): Promise<void> => {
  try {
    await connectDB();

    const { id } = req.params;

    const patient = await Patient.findOneAndUpdate(
      { $or: [{ _id: id }, { patientId: id }] },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Patient deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating patient',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};