# Healthcare Management System

A comprehensive healthcare management system with separate client and server applications.

## Project Structure

```
├── client/          # React frontend application
│   ├── shared/      # Client copy of shared schemas
│   └── src/         # React components and pages
├── server/          # Express.js backend API
│   ├── shared/      # Server copy of shared schemas
│   └── routes/      # API endpoints
└── package.json     # Root package.json for coordinated development
```

## Quick Start

1. Install all dependencies:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

2. Start both client and server:
```bash
npm run dev
```

This will start:
- Server on http://localhost:5000
- Client on http://localhost:5173

## Independent Operation

### Client Only
```bash
cd client
npm install
npm run dev
```

### Server Only
```bash
cd server
npm install
npm run dev
```

## Environment Setup

Create environment files:

**server/.env:**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5000
```

**client/.env:**
```
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
```

## Features

- **Patient Management**: Registration, search, and medical records
- **Appointment Scheduling**: Book, reschedule, and manage appointments
- **Prescription Management**: Create and track prescriptions
- **Payment Processing**: Handle payments and generate receipts
- **User Authentication**: Role-based access (Doctor/Receptionist)
- **Real-time Updates**: Socket.IO integration

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS
- Radix UI components
- React Router
- React Query

**Backend:**
- Express.js with TypeScript
- MongoDB with Mongoose
- JWT authentication
- Socket.IO
- bcrypt password hashing

## Development

Both client and server can be developed independently with their own package.json files and configurations.