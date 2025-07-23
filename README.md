# Hospital Management System - Role-Based Access Control

A comprehensive hospital management system with hierarchical role-based access control, supporting multi-hospital and multi-branch operations.

## 🏥 System Overview

This system implements a sophisticated role hierarchy that allows for scalable hospital management across multiple facilities and branches.

### Role Hierarchy

```
Master Admin (System Level)
├── Admin (Hospital Level)
│   ├── Sub-Admin (Branch Level)
│   │   ├── Doctor (Medical Staff)
│   │   └── Receptionist (Support Staff)
│   └── Sub-Admin (Branch Level)
│       ├── Doctor (Medical Staff)
│       └── Receptionist (Support Staff)
└── Admin (Hospital Level)
    └── Sub-Admin (Branch Level)
        ├── Doctor (Medical Staff)
        └── Receptionist (Support Staff)
```

## 👥 Role Definitions & Permissions

### 1. Master Admin (Super Administrator)
**Purpose**: System maintenance and global administration
- **Access Level**: Global system access
- **Key Responsibilities**:
  - System configuration and maintenance
  - Database management and monitoring
  - API monitoring and logs
  - Global analytics and reporting
  - Software updates and deployment
  - Create and manage master admin accounts
  - Oversee all hospitals and branches

**Permissions**:
- Full system access (frontend + backend)
- Create/manage master admin accounts
- System configuration and maintenance
- Database management
- API monitoring and logs
- Global analytics and reporting
- Software updates and deployment

### 2. Admin (Hospital Administrator)
**Purpose**: Hospital chain management
- **Access Level**: Hospital-wide access
- **Key Responsibilities**:
  - Manage multiple hospital branches
  - Assign sub-admin accounts to branches
  - View all branch data and analytics
  - Manage hospital-wide policies
  - Financial overview across branches
  - User management at branch level

**Permissions**:
- Create and manage multiple hospital branches
- Assign sub-admin accounts to branches
- View all branch data and analytics
- Manage hospital-wide policies
- Financial overview across branches
- User management at branch level

### 3. Sub-Admin (Branch Manager)
**Purpose**: Individual branch management
- **Access Level**: Branch-specific access
- **Key Responsibilities**:
  - Create doctor and receptionist accounts
  - Manage branch-specific settings
  - View branch analytics and reports
  - Manage branch inventory and resources
  - Patient data management within branch

**Permissions**:
- Create doctor and receptionist accounts
- Manage branch-specific settings
- View branch analytics and reports
- Manage branch inventory and resources
- Patient data management within branch

### 4. Doctor (Medical Staff)
**Purpose**: Patient care and medical operations
- **Access Level**: Branch-specific medical access
- **Key Responsibilities**:
  - Patient consultations and treatments
  - Prescription management
  - Appointment scheduling and management
  - Medical record maintenance

**Permissions**:
- Manage patients and appointments
- Create and manage prescriptions
- View patient medical history
- Schedule and manage appointments

### 5. Receptionist (Support Staff)
**Purpose**: Administrative support and patient services
- **Access Level**: Branch-specific administrative access
- **Key Responsibilities**:
  - Patient registration and check-in
  - Appointment scheduling
  - Payment processing
  - Basic patient information management

**Permissions**:
- Basic patient management
- Appointment scheduling
- Payment processing
- Basic patient information access

## 🏗️ System Architecture

### Database Schema

#### User Model
```typescript
interface User {
  id: string;
  email: string;
  password: string;
  role: 'master_admin' | 'admin' | 'sub_admin' | 'doctor' | 'receptionist';
  firstName: string;
  lastName: string;
  specialization?: string;
  isActive: boolean;
  hospitalId?: string; // For admin, sub-admin, doctor, receptionist
  branchId?: string; // For sub-admin, doctor, receptionist
  createdBy?: string; // Who created this user
  permissions?: string[]; // Custom permissions array
  lastLogin?: Date;
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
}
```

#### Hospital Model
```typescript
interface Hospital {
  id: string;
  name: string;
  description?: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  createdBy: string; // Master admin who created this hospital
  adminId: string; // Admin assigned to this hospital
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
```

#### Branch Model
```typescript
interface Branch {
  id: string;
  name: string;
  hospitalId: string;
  address: string;
  phoneNumber: string;
  email: string;
  subAdminId: string; // Sub-admin assigned to this branch
  isActive: boolean;
  settings: {
    allowOnlineBooking: boolean;
    maxAppointmentsPerDay: number;
    appointmentDuration: number;
    workingHours: { start: string; end: string; };
    workingDays: string[];
    specialties: string[];
  };
  stats: {
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    totalRevenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hospital-management-system
```

2. **Install dependencies**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Set up environment variables**
```bash
# Server (.env)
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your-secret-key
PORT=3001

# Client (.env)
VITE_API_URL=http://localhost:3001
```

4. **Seed the database**
```bash
cd server
npm run seed
```

5. **Start the application**
```bash
# Start server
cd server
npm run dev

# Start client (in new terminal)
cd client
npm run dev
```

## 🔐 Default Login Credentials

After seeding the database, you can use these default credentials:

| Role | Email | Password |
|------|-------|----------|
| Master Admin | master@hospital.com | masteradmin123 |
| Admin | admin@hospital.com | admin123 |
| Sub-Admin | subadmin@hospital.com | subadmin123 |
| Doctor | doctor@hospital.com | doctor123 |
| Receptionist | receptionist@hospital.com | receptionist123 |

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (role-based)
- `GET /api/auth/me` - Get current user

### Hospital Management
- `GET /api/hospitals` - Get all hospitals (master admin only)
- `GET /api/hospitals/my-hospitals` - Get hospitals by admin
- `POST /api/hospitals` - Create hospital (master admin only)
- `PUT /api/hospitals/:id` - Update hospital
- `DELETE /api/hospitals/:id` - Delete hospital (master admin only)
- `GET /api/hospitals/:id/stats` - Get hospital statistics

### Branch Management
- `GET /api/branches` - Get all branches (master admin only)
- `GET /api/branches/hospital/:hospitalId` - Get branches by hospital
- `GET /api/branches/my-branches` - Get branches by sub-admin
- `POST /api/branches` - Create branch (admin only)
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch (admin only)
- `GET /api/branches/:id/stats` - Get branch statistics

### User Management
- `GET /api/users` - Get all users (master admin only)
- `GET /api/users/hospital/:hospitalId` - Get users by hospital (admin only)
- `GET /api/users/branch/:branchId` - Get users by branch (sub-admin only)
- `POST /api/users` - Create user (role-based permissions)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/stats/overview` - Get user statistics

## 🔒 Security Features

### Role-Based Access Control (RBAC)
- Hierarchical role system
- Permission-based access control
- Data isolation by hospital/branch
- Token-based authentication
- Session management

### Data Protection
- Password hashing with bcrypt
- JWT token authentication
- Role-based API endpoints
- Input validation with Zod schemas
- SQL injection prevention

## 📊 Features

### Master Admin Features
- System-wide dashboard
- Hospital chain management
- Global analytics and reporting
- System configuration
- User management across all levels
- Database monitoring

### Admin Features
- Hospital management dashboard
- Branch creation and management
- Sub-admin assignment
- Hospital-wide analytics
- Financial overview
- Policy management

### Sub-Admin Features
- Branch management dashboard
- Doctor and receptionist management
- Branch-specific analytics
- Resource management
- Patient data oversight

### Doctor Features
- Patient management
- Appointment scheduling
- Prescription management
- Medical records
- Availability management

### Receptionist Features
- Patient registration
- Appointment scheduling
- Payment processing
- Basic patient management
- Check-in/check-out

## 🛠️ Development

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and services
│   │   └── shared/        # Shared schemas
│   └── package.json
├── server/                 # Backend Node.js application
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── schemas/           # Validation schemas
│   └── package.json
└── README.md
```

### Available Scripts

#### Server
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run seed         # Seed database with sample data
```

#### Client
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v2.0.0** - Role-based access control system
- **v1.0.0** - Basic hospital management system

---

**Note**: This system is designed for educational and demonstration purposes. For production use, additional security measures and compliance with healthcare regulations should be implemented.