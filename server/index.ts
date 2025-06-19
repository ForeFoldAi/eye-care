import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { registerRoutes } from './routes';
import { type Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';
import { connectDB } from './db/connect';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Initialize server with database connection
async function initializeServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB Atlas connected successfully to healthcare database');

    // Mount routes
    await registerRoutes(app);

    // Error handling middleware - after routes
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Socket.IO connection handling
    io.on('connection', (socket: Socket) => {
      console.log('Client connected');

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    // Start server
    const PORT = parseInt(process.env.PORT || '3000', 10);
    
    return new Promise<void>((resolve) => {
      httpServer.listen(PORT, () => {
        console.log(`Server running at http://127.0.0.1:${PORT}`);
        resolve();
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
initializeServer().catch((error) => {
  console.error('Unhandled server initialization error:', error);
  process.exit(1);
});
