import mongoose from 'mongoose';
import { Department } from './models/department.js';
import { User } from './models/user.js';
import { Hospital } from './models/hospital.js';
import { Branch } from './models/branch.js';

async function testDepartments() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/hospital-management');
    console.log('Connected to database');

    // Check if departments exist
    const departments = await Department.find({});
    console.log('Total departments found:', departments.length);
    
    if (departments.length > 0) {
      console.log('Departments:');
      departments.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.name} (Branch: ${dept.branchId})`);
      });
    } else {
      console.log('No departments found in database');
    }

    // Check users
    const users = await User.find({});
    console.log('\nTotal users found:', users.length);
    
    // Check hospitals
    const hospitals = await Hospital.find({});
    console.log('Total hospitals found:', hospitals.length);
    
    // Check branches
    const branches = await Branch.find({});
    console.log('Total branches found:', branches.length);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testDepartments(); 