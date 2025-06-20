# Healthcare Management System - Client

This is the frontend React application for the Healthcare Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The client will run on http://localhost:5173 and proxy API requests to the backend server on port 5000.

## Configuration

Environment variables are stored in `.env`:
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000)
- `VITE_NODE_ENV`: Environment mode

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Dependencies

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- React Router for navigation
- React Query for API state management