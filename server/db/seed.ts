import mongoose from 'mongoose';
import { Appointment } from '../models';
import User from '../models/user';
import Patient from '../models/patient';
import { connectDB } from './connect';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB for seeding');

    // Drop existing collections
    await Promise.all([
      mongoose.connection.collection('users').drop().catch(() => {}),
      mongoose.connection.collection('patients').drop().catch(() => {}),
      mongoose.connection.collection('appointments').drop().catch(() => {})
    ]);
    console.log('Dropped existing collections');

    // Create test doctors
    const hashedPassword = await bcrypt.hash('password123', 10);
    const doctors = [
      {
        email: `doctor1${Date.now()}@test.com`,
        password: hashedPassword,
        role: 'doctor',
        firstName: 'John',
        lastName: 'Doe',
        specialization: 'General Medicine',
        isActive: true
      },
      {
        email: `doctor2${Date.now()}@test.com`,
        password: hashedPassword,
        role: 'doctor',
        firstName: 'Jane',
        lastName: 'Smith',
        specialization: 'Pediatrics',
        isActive: true
      }
    ];

    const createdDoctors = await User.insertMany(doctors);
    console.log('Test doctors created:', createdDoctors.map(d => d._id));

    // Create a test patient
    const testPatient = new Patient({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@test.com',
      phone: '9876543210',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
      address: '123 Test St',
      medicalHistory: 'None',
      patientId: `P-${Date.now()}`
    });
    await testPatient.save();
    console.log('Test patient created:', testPatient._id);

    // Create test appointments
    const appointments = [
      {
        patientId: testPatient._id,
        doctorId: createdDoctors[0]._id,
        datetime: new Date('2025-06-14T10:00:00Z'),
        type: 'consultation',
        status: 'scheduled',
        tokenNumber: 1,
        notes: 'Regular checkup'
      },
      {
        patientId: testPatient._id,
        doctorId: createdDoctors[1]._id,
        datetime: new Date('2025-06-14T14:00:00Z'),
        type: 'follow-up',
        status: 'scheduled',
        tokenNumber: 2,
        notes: 'Follow-up visit'
      }
    ];

    await Appointment.insertMany(appointments);
    console.log('Test appointments created successfully');

    // Log all appointments with populated data
    const allAppointments = await Appointment.find()
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName specialization');
    
    console.log('Current appointments:', JSON.stringify(allAppointments, null, 2));

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase(); 