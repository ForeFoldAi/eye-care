# Healthcare Management System - Server

This is the backend Express.js API server for the Healthcare Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5000
```

3. Start the development server:
```bash
npm run dev
```

The server will run on http://0.0.0.0:5000

## Configuration

Environment variables:
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 5000)

## Scripts

- `npm run dev`: Start development server with file watching
- `npm run start`: Start production server
- `npm run build`: Compile TypeScript to JavaScript
- `npm run check`: Type check without emitting files

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /api/auth/login`: User authentication
- `GET /api/patients`: Patient management
- `GET /api/appointments`: Appointment scheduling
- `GET /api/prescriptions`: Prescription management
- `GET /api/payments`: Payment processing

## Dependencies

- Express.js with TypeScript
- MongoDB with Mongoose ODM
- JWT for authentication
- Socket.IO for real-time features
- bcrypt for password hashing
- CORS for cross-origin requests