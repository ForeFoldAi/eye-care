import mongoose from 'mongoose';
import { Department } from './models/department.js';
import { User, Hospital, Branch } from './models/index.js';

async function seedDepartments() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/hospital-management');
    console.log('Connected to database');

    // Get existing data
    const users = await User.find({});
    const hospitals = await Hospital.find({});
    const branches = await Branch.find({});

    console.log('Found:', {
      users: users.length,
      hospitals: hospitals.length,
      branches: branches.length
    });

    if (users.length === 0 || hospitals.length === 0 || branches.length === 0) {
      console.log('❌ Missing required data. Please run the main seed script first.');
      return;
    }

    // Check if departments already exist
    const existingDepartments = await Department.find({});
    if (existingDepartments.length > 0) {
      console.log(`✅ ${existingDepartments.length} departments already exist`);
      return;
    }

    const admin = users.find(u => u.role === 'admin');
    const hospital = hospitals[0];
    const branch = branches[0];

    if (!admin || !hospital || !branch) {
      console.log('❌ Missing admin, hospital, or branch');
      return;
    }

    // Create sample departments
    const departments = [
      {
        name: 'Cardiology',
        description: 'Specialized in heart and cardiovascular system treatment',
        branchId: branch._id,
        hospitalId: hospital._id,
        headOfDepartment: 'Dr. Sarah Johnson',
        isActive: true,
        staff: [],
        createdBy: admin._id
      },
      {
        name: 'Neurology',
        description: 'Specialized in nervous system and brain disorders',
        branchId: branch._id,
        hospitalId: hospital._id,
        headOfDepartment: 'Dr. Michael Chen',
        isActive: true,
        staff: [],
        createdBy: admin._id
      },
      {
        name: 'Emergency Medicine',
        description: 'Provides immediate care for acute illnesses and injuries',
        branchId: branch._id,
        hospitalId: hospital._id,
        headOfDepartment: 'Dr. Emily Rodriguez',
        isActive: true,
        staff: [],
        createdBy: admin._id
      },
      {
        name: 'Pediatrics',
        description: 'Specialized in children\'s health and development',
        branchId: branch._id,
        hospitalId: hospital._id,
        headOfDepartment: 'Dr. David Wilson',
        isActive: true,
        staff: [],
        createdBy: admin._id
      },
      {
        name: 'Radiology',
        description: 'Specialized in medical imaging and diagnostic procedures',
        branchId: branch._id,
        hospitalId: hospital._id,
        headOfDepartment: 'Dr. Lisa Thompson',
        isActive: true,
        staff: [],
        createdBy: admin._id
      }
    ];

    // Insert departments
    const createdDepartments = await Department.insertMany(departments);
    console.log(`✅ Created ${createdDepartments.length} departments successfully`);

    // Display created departments
    createdDepartments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} - ${dept.headOfDepartment}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

seedDepartments(); 