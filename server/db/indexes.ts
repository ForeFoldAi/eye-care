import mongoose from 'mongoose';
import { User, Hospital, Branch, Patient, Appointment, Prescription, Payment, Department } from '../models';

/**
 * Create database indexes for optimal multi-tenant performance
 */
export async function createIndexes() {
  try {
    console.log('🔍 Creating database indexes...');

    // User indexes - create only if they don't exist
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true });
    } catch (error) {
      console.log('Email index already exists or failed to create');
    }

    try {
      await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true });
    } catch (error) {
      console.log('Username index already exists or failed to create');
    }

    try {
      await User.collection.createIndex({ hospitalId: 1 });
      await User.collection.createIndex({ branchId: 1 });
      await User.collection.createIndex({ role: 1 });
      await User.collection.createIndex({ hospitalId: 1, role: 1 });
      await User.collection.createIndex({ branchId: 1, role: 1 });
      await User.collection.createIndex({ hospitalId: 1, branchId: 1 });
      await User.collection.createIndex({ createdBy: 1 });
      await User.collection.createIndex({ isActive: 1 });
    } catch (error) {
      console.log('Some user indexes already exist');
    }

    // Hospital indexes
    try {
      await Hospital.collection.createIndex({ name: 1 });
      await Hospital.collection.createIndex({ adminId: 1 });
      await Hospital.collection.createIndex({ createdBy: 1 });
      await Hospital.collection.createIndex({ isActive: 1 });
      await Hospital.collection.createIndex({ email: 1 }, { unique: true });
    } catch (error) {
      console.log('Some hospital indexes already exist');
    }

    // Branch indexes
    try {
      await Branch.collection.createIndex({ hospitalId: 1 });
      await Branch.collection.createIndex({ subAdminId: 1 });
      await Branch.collection.createIndex({ createdBy: 1 });
      await Branch.collection.createIndex({ isActive: 1 });
      await Branch.collection.createIndex({ branchCode: 1 }, { unique: true, sparse: true });
      await Branch.collection.createIndex({ email: 1 });
      await Branch.collection.createIndex({ hospitalId: 1, isActive: 1 });
    } catch (error) {
      console.log('Some branch indexes already exist');
    }

    // Patient indexes
    try {
      await Patient.collection.createIndex({ hospitalId: 1 });
      await Patient.collection.createIndex({ branchId: 1 });
      await Patient.collection.createIndex({ hospitalId: 1, branchId: 1 });
      await Patient.collection.createIndex({ phone: 1 }, { unique: true });
      await Patient.collection.createIndex({ email: 1 });
      await Patient.collection.createIndex({ firstName: 1, lastName: 1 });
      await Patient.collection.createIndex({ createdAt: -1 });
      await Patient.collection.createIndex({ hospitalId: 1, createdAt: -1 });
      await Patient.collection.createIndex({ branchId: 1, createdAt: -1 });
    } catch (error) {
      console.log('Some patient indexes already exist');
    }

    // Appointment indexes
    try {
      await Appointment.collection.createIndex({ hospitalId: 1 });
      await Appointment.collection.createIndex({ branchId: 1 });
      await Appointment.collection.createIndex({ hospitalId: 1, branchId: 1 });
      await Appointment.collection.createIndex({ patientId: 1 });
      await Appointment.collection.createIndex({ doctorId: 1 });
      await Appointment.collection.createIndex({ datetime: 1 });
      await Appointment.collection.createIndex({ status: 1 });
      await Appointment.collection.createIndex({ hospitalId: 1, datetime: 1 });
      await Appointment.collection.createIndex({ branchId: 1, datetime: 1 });
      await Appointment.collection.createIndex({ doctorId: 1, datetime: 1 });
      await Appointment.collection.createIndex({ patientId: 1, datetime: 1 });
      await Appointment.collection.createIndex({ hospitalId: 1, status: 1 });
      await Appointment.collection.createIndex({ branchId: 1, status: 1 });
    } catch (error) {
      console.log('Some appointment indexes already exist');
    }

    // Prescription indexes
    try {
      await Prescription.collection.createIndex({ hospitalId: 1 });
      await Prescription.collection.createIndex({ branchId: 1 });
      await Prescription.collection.createIndex({ hospitalId: 1, branchId: 1 });
      await Prescription.collection.createIndex({ patientId: 1 });
      await Prescription.collection.createIndex({ doctorId: 1 });
      await Prescription.collection.createIndex({ appointmentId: 1 });
      await Prescription.collection.createIndex({ isActive: 1 });
      await Prescription.collection.createIndex({ createdAt: -1 });
      await Prescription.collection.createIndex({ hospitalId: 1, createdAt: -1 });
      await Prescription.collection.createIndex({ branchId: 1, createdAt: -1 });
      await Prescription.collection.createIndex({ patientId: 1, createdAt: -1 });
    } catch (error) {
      console.log('Some prescription indexes already exist');
    }

    // Payment indexes
    try {
      await Payment.collection.createIndex({ hospitalId: 1 });
      await Payment.collection.createIndex({ branchId: 1 });
      await Payment.collection.createIndex({ hospitalId: 1, branchId: 1 });
      await Payment.collection.createIndex({ patientId: 1 });
      await Payment.collection.createIndex({ appointmentId: 1 });
      await Payment.collection.createIndex({ processedBy: 1 });
      await Payment.collection.createIndex({ status: 1 });
      await Payment.collection.createIndex({ receiptNumber: 1 }, { unique: true });
      await Payment.collection.createIndex({ createdAt: -1 });
      await Payment.collection.createIndex({ hospitalId: 1, createdAt: -1 });
      await Payment.collection.createIndex({ branchId: 1, createdAt: -1 });
      await Payment.collection.createIndex({ hospitalId: 1, status: 1 });
      await Payment.collection.createIndex({ branchId: 1, status: 1 });
    } catch (error) {
      console.log('Some payment indexes already exist');
    }

    // Department indexes
    try {
      await Department.collection.createIndex({ hospitalId: 1 });
      await Department.collection.createIndex({ branchId: 1 });
      await Department.collection.createIndex({ hospitalId: 1, branchId: 1 });
      await Department.collection.createIndex({ name: 1 });
      await Department.collection.createIndex({ isActive: 1 });
      await Department.collection.createIndex({ headOfDepartment: 1 });
      await Department.collection.createIndex({ hospitalId: 1, isActive: 1 });
      await Department.collection.createIndex({ branchId: 1, isActive: 1 });
    } catch (error) {
      console.log('Some department indexes already exist');
    }

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
    throw error;
  }
}

/**
 * Create compound indexes for complex queries
 */
export async function createCompoundIndexes() {
  try {
    console.log('🔍 Creating compound indexes...');

    // User compound indexes
    try {
      await User.collection.createIndex(
        { hospitalId: 1, branchId: 1, role: 1, isActive: 1 },
        { name: 'user_hospital_branch_role_active' }
      );
    } catch (error) {
      console.log('User compound index already exists or failed to create');
    }

    // Patient compound indexes
    try {
      await Patient.collection.createIndex(
        { hospitalId: 1, branchId: 1, createdAt: -1 },
        { name: 'patient_hospital_branch_created' }
      );
    } catch (error) {
      console.log('Patient compound index already exists or failed to create');
    }

    // Appointment compound indexes
    try {
      await Appointment.collection.createIndex(
        { hospitalId: 1, branchId: 1, datetime: 1, status: 1 },
        { name: 'appointment_hospital_branch_datetime_status' }
      );
    } catch (error) {
      console.log('Appointment compound index already exists or failed to create');
    }

    // Payment compound indexes
    try {
      await Payment.collection.createIndex(
        { hospitalId: 1, branchId: 1, status: 1, createdAt: -1 },
        { name: 'payment_hospital_branch_status_created' }
      );
    } catch (error) {
      console.log('Payment compound index already exists or failed to create');
    }

    console.log('✅ Compound indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating compound indexes:', error);
    // Don't throw error, just log it
  }
}

/**
 * Create text indexes for search functionality
 */
export async function createTextIndexes() {
  try {
    console.log('🔍 Creating text indexes...');

    // User text search
    try {
      await User.collection.createIndex(
        { firstName: 'text', lastName: 'text', email: 'text' },
        { name: 'user_text_search' }
      );
    } catch (error) {
      console.log('User text index already exists or failed to create');
    }

    // Patient text search - skip if conflicting index exists
    try {
      await Patient.collection.createIndex(
        { firstName: 'text', lastName: 'text', phone: 'text', email: 'text' },
        { name: 'patient_text_search' }
      );
    } catch (error) {
      console.log('Patient text index already exists or failed to create');
    }

    // Hospital text search
    try {
      await Hospital.collection.createIndex(
        { name: 'text', description: 'text', address: 'text' },
        { name: 'hospital_text_search' }
      );
    } catch (error) {
      console.log('Hospital text index already exists or failed to create');
    }

    // Branch text search
    try {
      await Branch.collection.createIndex(
        { branchName: 'text', addressLine1: 'text', city: 'text' },
        { name: 'branch_text_search' }
      );
    } catch (error) {
      console.log('Branch text index already exists or failed to create');
    }

    console.log('✅ Text indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating text indexes:', error);
    // Don't throw error, just log it
  }
}

/**
 * Initialize all database indexes
 */
export async function initializeIndexes() {
  try {
    await createIndexes();
    await createCompoundIndexes();
    await createTextIndexes();
    console.log('🎉 All database indexes initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database indexes:', error);
    throw error;
  }
} 