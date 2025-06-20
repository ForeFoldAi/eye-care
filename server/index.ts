import express, { type Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import apiRoutes from './routes/index';
import { connectDB } from './db/connect';
import { registerRoutes } from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Parse CORS origins from .env
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? false
    : process.env.DEV_ORIGINS?.split(',') || [];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Server init
async function initializeServer() {
  try {
    await connectDB();
    console.log('MongoDB Atlas connected successfully to healthcare database');

    await registerRoutes(app);

    // Dev: redirect to Vite
    if (process.env.NODE_ENV === 'development') {
      app.get('/', (_req, res) => {
        res.redirect('http://localhost:5173');
      });

      app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.redirect(`http://localhost:5173${req.path}`);
      });
    } else {
      // Prod: serve built frontend
      app.use(express.static(path.join(__dirname, '../client/dist')));

      app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
      });
    }

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Socket.IO
    io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    const PORT = parseInt(process.env.PORT || '3000', 10);

    return new Promise<void>((resolve) => {
      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${PORT}`);
        resolve();
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

initializeServer().catch((error) => {
  console.error('Unhandled server initialization error:', error);
  process.exit(1);
});
