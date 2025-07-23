import bcrypt from 'bcrypt';
import { connectDB } from './connect';
import { User, Hospital, Branch, SubscriptionPlan } from '../models';

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to database for seeding...');

    // Check if master admin already exists
    const existingMasterAdmin = await User.findOne({ role: 'master_admin' });
    if (existingMasterAdmin) {
      console.log('Master admin already exists, skipping seed...');
      return;
    }

    // Create master admin
    const masterAdminPassword = await bcrypt.hash('masteradmin123', 10);
    const masterAdmin = new User({
      email: 'master@hospital.com',
      password: masterAdminPassword,
      role: 'master_admin',
      firstName: 'Master',
      lastName: 'Administrator',
      isActive: true,
      phoneNumber: '+1234567890',
      address: 'System Address'
    });

    await masterAdmin.save();
    console.log('✅ Master admin created successfully');

    // Create sample admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      email: 'admin@hospital.com',
      password: adminPassword,
      role: 'admin',
      firstName: 'Hospital',
      lastName: 'Admin',
      isActive: true,
      phoneNumber: '+1234567891',
      address: 'Hospital Address'
    });

    await admin.save();
    console.log('✅ Sample admin created successfully');

    // Create sample hospital
    const hospital = new Hospital({
      name: 'Sample General Hospital',
      description: 'A comprehensive healthcare facility providing quality medical services',
      address: '123 Healthcare Avenue, Medical District, City',
      phoneNumber: '+1234567892',
      email: 'info@samplehospital.com',
      website: 'https://samplehospital.com',
      createdBy: masterAdmin._id,
      adminId: admin._id,
      settings: {
        allowOnlineBooking: true,
        maxAppointmentsPerDay: 100,
        appointmentDuration: 30,
        workingHours: {
          start: '08:00',
          end: '18:00'
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      }
    });

    await hospital.save();
    console.log('✅ Sample hospital created successfully');

    // Update admin with hospital ID
    await User.findByIdAndUpdate(admin._id, { hospitalId: hospital._id });

    // Create sample sub-admin
    const subAdminPassword = await bcrypt.hash('subadmin123', 10);
    const subAdmin = new User({
      email: 'subadmin@hospital.com',
      password: subAdminPassword,
      role: 'sub_admin',
      firstName: 'Branch',
      lastName: 'Manager',
      isActive: true,
      phoneNumber: '+1234567893',
      address: 'Branch Address',
      hospitalId: hospital._id,
      createdBy: admin._id
    });

    await subAdmin.save();
    console.log('✅ Sample sub-admin created successfully');

    // Create sample branch
    const branch = new Branch({
      name: 'Main Branch',
      hospitalId: hospital._id,
      address: '456 Medical Center Drive, Downtown',
      phoneNumber: '+1234567894',
      email: 'mainbranch@samplehospital.com',
      subAdminId: subAdmin._id,
      settings: {
        allowOnlineBooking: true,
        maxAppointmentsPerDay: 50,
        appointmentDuration: 30,
        workingHours: {
          start: '09:00',
          end: '17:00'
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        specialties: ['Cardiology', 'Orthopedics', 'Pediatrics', 'General Medicine']
      }
    });

    await branch.save();
    console.log('✅ Sample branch created successfully');

    // Update sub-admin with branch ID
    await User.findByIdAndUpdate(subAdmin._id, { branchId: branch._id });

    // Create sample doctor
    const doctorPassword = await bcrypt.hash('doctor123', 10);
    const doctor = new User({
      email: 'doctor@hospital.com',
      password: doctorPassword,
      role: 'doctor',
      firstName: 'Dr. John',
      lastName: 'Smith',
      specialization: 'Cardiology',
      isActive: true,
      phoneNumber: '+1234567895',
      address: 'Doctor Address',
      hospitalId: hospital._id,
      branchId: branch._id,
      createdBy: subAdmin._id
    });

    await doctor.save();
    console.log('✅ Sample doctor created successfully');

    // Create sample receptionist
    const receptionistPassword = await bcrypt.hash('receptionist123', 10);
    const receptionist = new User({
      email: 'receptionist@hospital.com',
      password: receptionistPassword,
      role: 'receptionist',
      firstName: 'Jane',
      lastName: 'Doe',
      isActive: true,
      phoneNumber: '+1234567896',
      address: 'Receptionist Address',
      hospitalId: hospital._id,
      branchId: branch._id,
      createdBy: subAdmin._id
    });

    await receptionist.save();
    console.log('✅ Sample receptionist created successfully');

    // Create sample subscription plans
    const basicPlan = new SubscriptionPlan({
      planName: 'Basic Plan',
      planType: 'basic',
      description: 'Essential features for small healthcare facilities',
      monthlyCost: 5000,
      yearlyCost: 50000,
      currency: 'INR',
      trialDays: 14,
      maxUsers: 10,
      maxBranches: 1,
      maxPatients: 1000,
      maxStorage: 10,
      features: [
        'Patient Management',
        'Appointment Scheduling',
        'Prescription Management',
        'Payment Processing',
        'Staff Management',
        'Role-Based Access Control',
        'Multi-Hospital Support',
        'Multi-Branch Support',
        'Analytics Dashboard',
        'Real-Time Chat System',
        'In-App Notifications'
      ],
      isActive: true,
      isPopular: false,
      isCustom: false,
      autoRenew: true,
      billingCycle: 'monthly',
      gracePeriod: 7,
      setupFee: 0,
      notes: 'Perfect for small clinics and single-branch hospitals',
      createdBy: masterAdmin._id
    });

    const premiumPlan = new SubscriptionPlan({
      planName: 'Premium Plan',
      planType: 'premium',
      description: 'Advanced features for growing healthcare organizations',
      monthlyCost: 15000,
      yearlyCost: 150000,
      currency: 'INR',
      trialDays: 30,
      maxUsers: 50,
      maxBranches: 5,
      maxPatients: 10000,
      maxStorage: 100,
      features: [
        'Patient Management',
        'Appointment Scheduling',
        'Prescription Management',
        'Payment Processing',
        'Receipt Generation',
        'Staff Management',
        'Role-Based Access Control',
        'Multi-Hospital Support',
        'Multi-Branch Support',
        'Department Management',
        'Electronic Health Records (EHR)',
        'Medical History Tracking',
        'Analytics Dashboard',
        'Financial Reports',
        'Patient Statistics',
        'Real-Time Chat System',
        'In-App Notifications',
        'Support Ticket System',
        'Priority Support',
        'Multi-Tenant Architecture',
        'Data Backup & Recovery',
        'API Access'
      ],
      isActive: true,
      isPopular: true,
      isCustom: false,
      autoRenew: true,
      billingCycle: 'monthly',
      gracePeriod: 14,
      setupFee: 5000,
      notes: 'Most popular choice for medium-sized hospitals',
      createdBy: masterAdmin._id
    });

    const enterprisePlan = new SubscriptionPlan({
      planName: 'Enterprise Plan',
      planType: 'enterprise',
      description: 'Complete solution for large healthcare networks',
      monthlyCost: 50000,
      yearlyCost: 500000,
      currency: 'INR',
      trialDays: 30,
      maxUsers: 200,
      maxBranches: 20,
      maxPatients: 100000,
      maxStorage: 500,
      features: [
        'Patient Management',
        'Appointment Scheduling',
        'Prescription Management',
        'Payment Processing',
        'Receipt Generation',
        'Staff Management',
        'Role-Based Access Control',
        'Multi-Hospital Support',
        'Multi-Branch Support',
        'Department Management',
        'Electronic Health Records (EHR)',
        'Medical History Tracking',
        'Vital Signs Monitoring',
        'Allergy Management',
        'Medication History',
        'Analytics Dashboard',
        'Financial Reports',
        'Patient Statistics',
        'Staff Performance Reports',
        'Revenue Tracking',
        'Real-Time Chat System',
        'In-App Notifications',
        'Support Ticket System',
        'Priority Support',
        'Multi-Tenant Architecture',
        'Data Backup & Recovery',
        'API Access',
        'Custom Integrations',
        'Advanced Security'
      ],
      isActive: true,
      isPopular: false,
      isCustom: false,
      autoRenew: true,
      billingCycle: 'yearly',
      gracePeriod: 30,
      setupFee: 25000,
      notes: 'Enterprise-grade solution with unlimited support',
      createdBy: masterAdmin._id
    });

    await Promise.all([
      basicPlan.save(),
      premiumPlan.save(),
      enterprisePlan.save()
    ]);

    console.log('✅ Sample subscription plans created successfully');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Master Admin: master@hospital.com / masteradmin123');
    console.log('Admin: admin@hospital.com / admin123');
    console.log('Sub-Admin: subadmin@hospital.com / subadmin123');
    console.log('Doctor: doctor@hospital.com / doctor123');
    console.log('Receptionist: receptionist@hospital.com / receptionist123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
} 