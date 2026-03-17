import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import tasksRouter from './routes/tasks';
import configRouter from './routes/config';
import healthRouter from './routes/health';
import { setupWebSocket } from './ws/handler';
import ConfigLoader from '../core/ConfigLoader';

const PORT = process.env.PORT || 3001;

export function createApp(): Application {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // JSON parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // API routes
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/config', configRouter);
  app.use('/api/v1/health', healthRouter);

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Manus-Style API',
      version: 'v1.0',
      status: 'running',
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      },
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export function createServerWithWebSocket(app: Application): { httpServer: ReturnType<typeof createServer>, wss: WebSocketServer } {
  const httpServer = createServer(app);
  
  // WebSocket server on /ws/v1 path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws/v1' 
  });
  
  setupWebSocket(wss);
  
  return { httpServer, wss };
}

export async function startServer(): Promise<void> {
  const app = createApp();
  const { httpServer, wss } = createServerWithWebSocket(app);
  
  // Load config
  try {
    const configLoader = new ConfigLoader();
    configLoader.load();
    console.log('Configuration loaded successfully');
  } catch (error) {
    console.warn('Failed to load configuration, using defaults:', error);
  }

  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   Manus-Style API Server                              ║
║   ─────────────────────────────────────────────────   ║
║   REST API:    http://localhost:${PORT}/api/v1          ║
║   WebSocket:   ws://localhost:${PORT}/ws/v1              ║
║   Health:      http://localhost:${PORT}/api/v1/health   ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}
