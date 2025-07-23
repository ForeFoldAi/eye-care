# 🔐 Multi-Tenant Hospital Management System Implementation

## Overview

This document outlines the complete multi-tenant architecture for the hospital management system, ensuring strict data isolation between hospitals and their branches.

## 🏗️ Database Design

### Core Multi-Tenant Schema

```typescript
// User Model with Tenant Isolation
interface User {
  _id: ObjectId;
  email: string; // Unique across system
  username: string; // Unique across system
  password: string; // Hashed
  role: 'master_admin' | 'admin' | 'sub_admin' | 'doctor' | 'receptionist' | 'nurse';
  firstName: string;
  lastName: string;
  
  // Tenant Isolation Fields
  hospitalId?: ObjectId; // For admin, sub_admin, doctor, receptionist
  branchId?: ObjectId;   // For sub_admin, doctor, receptionist
  createdBy?: ObjectId;  // Who created this user
  
  // Additional fields...
  isActive: boolean;
  permissions?: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Hospital Model
interface Hospital {
  _id: ObjectId;
  name: string;
  description?: string;
  address: string;
  phoneNumber: string;
  email: string; // Unique
  website?: string;
  logo?: string;
  isActive: boolean;
  
  // Tenant Context
  createdBy: ObjectId; // Master admin who created this hospital
  adminId: ObjectId;   // Admin assigned to this hospital
  
  // Settings
  settings: {
    allowOnlineBooking: boolean;
    maxAppointmentsPerDay: number;
    appointmentDuration: number;
    workingHours: { start: string; end: string; };
    workingDays: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Branch Model
interface Branch {
  _id: ObjectId;
  branchName: string;
  hospitalId: ObjectId; // Links to parent hospital
  branchCode?: string;  // Unique within hospital
  
  // Contact & Location
  email: string;
  phoneNumber: string;
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  
  // Operational Settings
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
  maxDailyAppointments?: number;
  
  // Tenant Context
  subAdminId: ObjectId; // Sub-admin assigned to this branch
  createdBy: ObjectId;  // Who created this branch
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Patient Model with Tenant Isolation
interface Patient {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string; // Unique across system
  email?: string;
  address?: string;
  
  // Tenant Isolation Fields
  hospitalId: ObjectId; // Required for all patients
  branchId: ObjectId;   // Required for all patients
  
  // Medical Information
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Appointment Model with Tenant Isolation
interface Appointment {
  _id: ObjectId;
  patientId: ObjectId; // References Patient
  doctorId: ObjectId;  // References User
  datetime: Date;
  type: 'consultation' | 'checkup' | 'follow-up';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  
  // Tenant Isolation Fields
  hospitalId: ObjectId; // Required
  branchId: ObjectId;   // Required
  
  createdAt: Date;
  updatedAt: Date;
}

// Prescription Model with Tenant Isolation
interface Prescription {
  _id: ObjectId;
  patientId: ObjectId;
  doctorId: ObjectId;
  appointmentId?: ObjectId;
  
  // Medications
  medications: [{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    quantity?: number;
  }];
  
  instructions?: string;
  notes?: string;
  isActive: boolean;
  
  // Tenant Isolation Fields
  hospitalId: ObjectId; // Required
  branchId: ObjectId;   // Required
  
  createdAt: Date;
  updatedAt: Date;
}

// Payment Model with Tenant Isolation
interface Payment {
  _id: ObjectId;
  patientId: ObjectId;
  appointmentId?: ObjectId;
  amount: number;
  method: 'cash' | 'card' | 'insurance';
  status: 'pending' | 'completed' | 'refunded';
  receiptNumber: string; // Unique across system
  processedBy: ObjectId; // References User
  
  // Tenant Isolation Fields
  hospitalId: ObjectId; // Required
  branchId: ObjectId;   // Required
  
  createdAt: Date;
  updatedAt: Date;
}

// Department Model with Tenant Isolation
interface Department {
  _id: ObjectId;
  name: string;
  description?: string;
  
  // Tenant Isolation Fields
  hospitalId: ObjectId; // Required
  branchId: ObjectId;   // Required
  
  headOfDepartment?: string;
  isActive: boolean;
  staff?: ObjectId[]; // References to User collection
  
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔒 Access Control Implementation

### 1. Authentication Middleware

```typescript
// server/middleware/auth.ts
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    hospitalId?: string;
    branchId?: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // JWT token validation
  // Sets req.user with role, hospitalId, branchId
};
```

### 2. Tenant Isolation Middleware

```typescript
// server/middleware/tenant.ts
export interface TenantRequest extends AuthRequest {
  tenant?: {
    hospitalId?: string;
    branchId?: string;
    userRole: string;
    userId: string;
  };
}

// Enforces tenant context on all requests
export const enforceTenantIsolation = (req: TenantRequest, res: Response, next: NextFunction) => {
  // Sets tenant context based on authenticated user
};

// Builds database filters based on user's scope
export const buildTenantFilter = (req: TenantRequest, additionalFilters: any = {}) => {
  // Returns appropriate filters based on user role and scope
};

// Validates data creation within user's scope
export const validateDataCreation = (req: TenantRequest, res: Response, next: NextFunction) => {
  // Ensures users can only create data within their scope
};
```

### 3. Role-Based Access Control

```typescript
// Access Control Matrix
const ACCESS_MATRIX = {
  master_admin: {
    canAccess: ['all_hospitals', 'all_branches', 'all_users', 'all_data'],
    canCreate: ['hospitals', 'admins', 'all_roles'],
    canModify: ['system_settings', 'global_config']
  },
  admin: {
    canAccess: ['own_hospital', 'own_branches', 'own_users', 'own_data'],
    canCreate: ['branches', 'sub_admins', 'doctors', 'receptionists'],
    canModify: ['hospital_settings', 'branch_config']
  },
  sub_admin: {
    canAccess: ['own_branch', 'own_staff', 'own_patients'],
    canCreate: ['doctors', 'receptionists', 'patients'],
    canModify: ['branch_settings', 'staff_schedules']
  },
  doctor: {
    canAccess: ['own_branch', 'own_patients', 'own_appointments'],
    canCreate: ['prescriptions', 'medical_records'],
    canModify: ['patient_records', 'appointment_notes']
  },
  receptionist: {
    canAccess: ['own_branch', 'own_patients', 'own_appointments'],
    canCreate: ['appointments', 'payments'],
    canModify: ['patient_info', 'appointment_status']
  }
};
```

## 🗄️ Database Indexes for Performance

### Critical Indexes for Multi-Tenancy

```javascript
// User Indexes
{ email: 1 } // Unique
{ username: 1 } // Unique
{ hospitalId: 1 }
{ branchId: 1 }
{ role: 1 }
{ hospitalId: 1, role: 1 }
{ branchId: 1, role: 1 }
{ hospitalId: 1, branchId: 1 }
{ createdBy: 1 }
{ isActive: 1 }

// Patient Indexes
{ hospitalId: 1 }
{ branchId: 1 }
{ hospitalId: 1, branchId: 1 }
{ phone: 1 } // Unique
{ email: 1 }
{ firstName: 1, lastName: 1 }
{ createdAt: -1 }
{ hospitalId: 1, createdAt: -1 }
{ branchId: 1, createdAt: -1 }

// Appointment Indexes
{ hospitalId: 1 }
{ branchId: 1 }
{ hospitalId: 1, branchId: 1 }
{ patientId: 1 }
{ doctorId: 1 }
{ datetime: 1 }
{ status: 1 }
{ hospitalId: 1, datetime: 1 }
{ branchId: 1, datetime: 1 }
{ doctorId: 1, datetime: 1 }
{ hospitalId: 1, status: 1 }
{ branchId: 1, status: 1 }

// Compound Indexes for Complex Queries
{ hospitalId: 1, branchId: 1, role: 1, isActive: 1 }
{ hospitalId: 1, branchId: 1, datetime: 1, status: 1 }
{ hospitalId: 1, branchId: 1, createdAt: -1 }
```

## 🛡️ Security Implementation

### 1. API Route Protection

```typescript
// Example: Protected User Routes
router.get('/users', 
  authenticateToken,           // Verify JWT token
  enforceTenantIsolation,      // Set tenant context
  async (req: TenantRequest, res) => {
    // Build tenant-aware filter
    const filter = buildTenantFilter(req, {});
    
    // Query only user's scope data
    const users = await User.find(filter);
    res.json(users);
  }
);

router.post('/users',
  authenticateToken,
  authorizeRole(['master_admin', 'admin', 'sub_admin']),
  enforceTenantIsolation,
  validateDataCreation,        // Ensure data creation within scope
  async (req: TenantRequest, res) => {
    // req.body.hospitalId and req.body.branchId are auto-assigned
    const user = await User.create(req.body);
    res.json(user);
  }
);
```

### 2. Data Validation

```typescript
// Zod Schema with Tenant Validation
const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist']),
  firstName: z.string(),
  lastName: z.string(),
  
  // Tenant fields are auto-assigned by middleware
  hospitalId: z.string().optional(),
  branchId: z.string().optional(),
  
  // Role-based validation
  specialization: z.string().optional().refine((val, ctx) => {
    if (ctx.parent.role === 'doctor' && !val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Specialization required for doctors'
      });
    }
    return true;
  })
});
```

### 3. Frontend Protection

```typescript
// Client-side auth service
export const authService = {
  // Get user's accessible data scope
  getAccessibleData: (user: User | null) => {
    if (!user) return { hospitalId: null, branchId: null };
    
    return {
      hospitalId: user.hospitalId,
      branchId: user.branchId
    };
  },

  // Check if user can create specific role
  canCreateRole: (user: User | null, targetRole: string): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'master_admin':
        return true; // Can create any role
      case 'admin':
        return ['sub_admin', 'doctor', 'receptionist'].includes(targetRole);
      case 'sub_admin':
        return ['doctor', 'receptionist'].includes(targetRole);
      default:
        return false;
    }
  },

  // Check if user has specific role
  hasRole: (user: User | null, roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }
};
```

## 🔄 Data Flow Examples

### 1. Hospital Admin Creating a Branch

```typescript
// 1. Hospital Admin logs in
POST /api/auth/login
{
  "email": "admin@hospital.com",
  "password": "password",
  "role": "admin"
}

// Response includes hospitalId
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "role": "admin",
    "hospitalId": "hospital_id",
    "branchId": null
  }
}

// 2. Admin creates a branch
POST /api/branches
Authorization: Bearer jwt_token
{
  "branchName": "North Branch",
  "email": "north@hospital.com",
  "phoneNumber": "+1234567890",
  // ... other fields
}

// Middleware automatically adds:
// - hospitalId: "hospital_id" (from token)
// - createdBy: "user_id" (from token)

// 3. Database stores with tenant isolation
{
  "_id": "branch_id",
  "branchName": "North Branch",
  "hospitalId": "hospital_id", // Tenant isolation
  "createdBy": "user_id",      // Audit trail
  // ... other fields
}
```

### 2. Sub-Admin Creating a Doctor

```typescript
// 1. Sub-Admin logs in
POST /api/auth/login
{
  "email": "subadmin@northbranch.com",
  "password": "password",
  "role": "sub_admin"
}

// Response includes hospitalId and branchId
{
  "token": "jwt_token",
  "user": {
    "id": "subadmin_id",
    "role": "sub_admin",
    "hospitalId": "hospital_id",
    "branchId": "branch_id"
  }
}

// 2. Sub-Admin creates a doctor
POST /api/users
Authorization: Bearer jwt_token
{
  "email": "doctor@northbranch.com",
  "username": "dr_smith",
  "password": "password",
  "role": "doctor",
  "firstName": "John",
  "lastName": "Smith",
  "specialization": "Cardiology"
  // No hospitalId or branchId needed - auto-assigned
}

// Middleware automatically adds:
// - hospitalId: "hospital_id" (from token)
// - branchId: "branch_id" (from token)
// - createdBy: "subadmin_id" (from token)

// 3. Database stores with tenant isolation
{
  "_id": "doctor_id",
  "email": "doctor@northbranch.com",
  "role": "doctor",
  "hospitalId": "hospital_id", // Tenant isolation
  "branchId": "branch_id",     // Tenant isolation
  "createdBy": "subadmin_id",  // Audit trail
  // ... other fields
}
```

### 3. Doctor Accessing Patients

```typescript
// 1. Doctor logs in
POST /api/auth/login
{
  "email": "doctor@northbranch.com",
  "password": "password",
  "role": "doctor"
}

// 2. Doctor requests patients
GET /api/patients
Authorization: Bearer jwt_token

// Middleware builds filter:
// { hospitalId: "hospital_id", branchId: "branch_id" }

// 3. Database query with tenant isolation
const patients = await Patient.find({
  hospitalId: "hospital_id",
  branchId: "branch_id"
});

// 4. Doctor only sees patients from their branch
```

## 🚀 Implementation Steps

### 1. Database Setup

```bash
# 1. Create indexes for performance
npm run db:indexes

# 2. Seed initial data
npm run db:seed
```

### 2. Middleware Integration

```typescript
// Add to all protected routes
app.use('/api', authenticateToken, enforceTenantIsolation);
```

### 3. Route Updates

```typescript
// Update all routes to use tenant middleware
router.get('/patients', 
  authenticateToken, 
  enforceTenantIsolation,
  async (req: TenantRequest, res) => {
    const filter = buildTenantFilter(req, {});
    const patients = await Patient.find(filter);
    res.json(patients);
  }
);
```

### 4. Frontend Updates

```typescript
// Update API calls to include tenant context
const fetchPatients = async () => {
  const user = authService.getStoredUser();
  const response = await fetch('/api/patients', {
    headers: {
      'Authorization': `Bearer ${authService.getToken()}`
    }
  });
  // Response automatically filtered by tenant
  return response.json();
};
```

## 🔍 Testing Multi-Tenancy

### 1. Isolation Tests

```typescript
// Test that users can't access other hospitals' data
describe('Multi-tenant isolation', () => {
  it('should prevent cross-hospital data access', async () => {
    // Create two hospitals
    const hospital1 = await createHospital('Hospital 1');
    const hospital2 = await createHospital('Hospital 2');
    
    // Create admin for hospital 1
    const admin1 = await createUser({
      role: 'admin',
      hospitalId: hospital1._id
    });
    
    // Try to access hospital 2's data
    const response = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${admin1.token}`);
    
    // Should only return hospital 1's patients
    expect(response.body).toHaveLength(0); // No patients in hospital 1
  });
});
```

### 2. Role Permission Tests

```typescript
// Test role-based access control
describe('Role-based access', () => {
  it('should prevent unauthorized role creation', async () => {
    const subAdmin = await createUser({
      role: 'sub_admin',
      hospitalId: hospital._id,
      branchId: branch._id
    });
    
    // Try to create an admin (should fail)
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${subAdmin.token}`)
      .send({
        role: 'admin',
        email: 'newadmin@test.com'
      });
    
    expect(response.status).toBe(403);
  });
});
```

## 📊 Monitoring & Auditing

### 1. Audit Logs

```typescript
// Add audit logging to all operations
const auditLog = {
  userId: req.user.id,
  action: 'CREATE_USER',
  resource: 'User',
  resourceId: createdUser._id,
  hospitalId: req.tenant.hospitalId,
  branchId: req.tenant.branchId,
  timestamp: new Date(),
  details: {
    role: createdUser.role,
    email: createdUser.email
  }
};
```

### 2. Performance Monitoring

```typescript
// Monitor query performance
const queryStats = {
  collection: 'patients',
  filter: { hospitalId: 'hospital_id', branchId: 'branch_id' },
  executionTime: 45, // ms
  documentsReturned: 150,
  indexUsed: 'hospitalId_1_branchId_1'
};
```

## 🎯 Key Benefits

1. **Strict Data Isolation**: Hospitals can never access each other's data
2. **Role-Based Security**: Users can only perform actions within their scope
3. **Audit Trail**: Complete tracking of who created/modified what
4. **Performance**: Optimized indexes for multi-tenant queries
5. **Scalability**: Easy to add new hospitals without affecting existing ones
6. **Compliance**: Meets healthcare data privacy requirements

## 🔧 Maintenance

### Regular Tasks

1. **Index Optimization**: Monitor query performance and adjust indexes
2. **Audit Review**: Regularly review audit logs for suspicious activity
3. **Backup Strategy**: Ensure tenant-aware backups
4. **Security Updates**: Keep authentication and authorization systems updated

This implementation ensures that your multi-tenant hospital management system maintains strict data isolation while providing optimal performance and security. 