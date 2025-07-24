import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/index';
import { connectDB } from './db/connect';
import { initializeIndexes } from './db/indexes';
import { registerRoutes } from './routes';
import { WebSocketServer } from './websocket';

dotenv.config(); // ✅ Load environment variables

// Polyfill for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// ✅ Load environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize WebSocket server
const wsServer = new WebSocketServer(httpServer);

// ✅ CORS middleware - Allow local development
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    frontendUrl,
    ...allowedOrigins
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'server is running' });
});

app.get('/', (_req, res) => {
  res.send(`
    <h1>Welcome to the Healthcare Backend API</h1>
    <p>Status: <strong>Running</strong></p>
    <p>Use <code>/health</code> for health checks or access API via <code>/api</code> routes.</p>
  `);
});

async function initializeServer() {
  try {
    await connectDB();
    console.log('MongoDB Atlas connected successfully to healthcare database');

    // Initialize database indexes for multi-tenant performance (non-blocking)
    initializeIndexes().then(() => {
      console.log('Database indexes initialized for multi-tenant queries');
    }).catch((error) => {
      console.error('Index initialization failed (non-critical):', error);
    });

    await registerRoutes(app);

    if (process.env.NODE_ENV === 'development') {
      // ✅ Redirect all non-API paths to frontend from .env
      app.get('/', (_req, res) => {
        res.redirect(frontendUrl);
      });

      app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.redirect(`${frontendUrl}${req.path}`);
      });
    } else {
      // Production: Only allow API
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.status(404).json({ message: 'Frontend is hosted separately.' });
      });
    }

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // WebSocket server is already initialized
    console.log('WebSocket server initialized');

    const serverPort = parseInt(process.env.PORT || '3000', 10);
    return new Promise<void>((resolve) => {
      httpServer.listen(serverPort, '0.0.0.0', () => {
        console.log(`Server running at http://localhost:${serverPort}`);
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
