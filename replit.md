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

- **2025-01-23**: Successfully migrated from Replit Agent to standard Replit environment
- **2025-01-23**: Set up proper client/server separation and security practices
- **2025-01-23**: Configured MongoDB connection with secure credentials
- **2025-01-23**: Optimized database startup with non-blocking index creation
- **2025-01-23**: Application now running - Server: port 5000, Client: port 3000
- **2025-01-23**: Implemented advanced analytics with Chart.js for sub-admin dashboard
- **2025-01-23**: Added comprehensive API endpoints for real-time analytics data
- **2025-01-23**: Replaced all mock data with authentic MongoDB queries and aggregations
- **2025-01-23**: Fixed receptionist login authentication issues - created test user and verified JWT authentication

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