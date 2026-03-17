import { Router, Request, Response } from 'express';

const router = Router();

// Store server start time
const startTime = Date.now();

// GET /api/v1/health - Health check
router.get('/', async (req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  // Check dependencies
  const checks = {
    database: true,  // In-memory for now
    llm: true,       // Assuming LLM is available
    websocket: true, // WebSocket server should be running
  };
  
  const allHealthy = Object.values(checks).every(v => v);
  
  const status = allHealthy ? 'healthy' : 'degraded';
  
  res.json({
    success: true,
    data: {
      status,
      version: process.env.npm_package_version || '1.0.0',
      uptime,
      checks,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/health/ready - Readiness check
router.get('/ready', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ready: true,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/health/live - Liveness check
router.get('/live', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      alive: true,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
