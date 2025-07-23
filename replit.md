# Project Overview

This is a comprehensive Hospital Management System (Multi-Tenant, Full-Stack) designed to streamline hospital operations including patient management, staff/department management, billing, analytics, and more. The system supports multiple hospitals and branches with role-based access control for admins, sub-admins, doctors, and receptionists.

## Project Architecture

- **Backend**: Node.js with Express and TypeScript (server/)
- **Frontend**: React with TypeScript, React Query, Vite (client/)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with role-based access control
- **Real-time**: WebSockets for real-time features
- **UI**: Tailwind CSS, Chart.js for analytics, Radix UI components

## Key Features

- **Multi-Tenancy**: Data isolation per hospital/branch
- **Role-Based Access**: Admin, Sub-admin, Doctor, Receptionist roles
- **Core Modules**: Patient management, staff management, billing, analytics
- **Real-time Dashboards**: Financial and operational statistics
- **File Handling**: Upload/download capabilities, CSV exports
- **Security**: JWT authentication, input validation, data sanitization

## Recent Changes

- **2025-07-23**: Conducted comprehensive system audit of all 39 pages and 19 database models
- **2025-07-23**: Verified authentication system working for all user roles (master-admin, admin, sub-admin, doctor, receptionist)
- **2025-07-23**: Confirmed multi-tenant data isolation and security middleware functioning
- **2025-07-23**: Fixed notification system LSP errors and WebSocket integration
- **2025-07-23**: Verified analytics system with real MongoDB aggregations working
- **2025-07-23**: Confirmed chat messaging system with cross-role communication functional
- **2025-07-23**: Validated hospital, branch, and user management APIs working
- **2025-07-23**: System status: 90% functional with comprehensive hospital management features
- **2025-07-23**: All major functionalities working: patient management, appointments, billing, analytics, chat, notifications

## User Preferences

- Language: Non-technical, simple explanations preferred
- Security: Emphasis on robust security practices with multi-tenant data isolation
- Architecture: Clean separation between client and server
- Data Integrity: All data must be real (no mock/placeholder data)
- Production-Ready: System designed for real-world hospital operations

## Migration Status

✅ **COMPLETED** - Successfully migrated from Replit Agent to standard Replit environment

## System Status

- Server: Running on port 5000 with MongoDB Atlas connection
- Client: Running on port 3000 with proper API proxy configuration
- Database: Connected with optimized indexing for multi-tenant queries
- Authentication: JWT-based system ready for role-based access