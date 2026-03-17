import { Router, Request, Response } from 'express';
import { ConfigLoader } from '../../core/ConfigLoader';

const router = Router();
const configLoader = new ConfigLoader();

// GET /api/v1/config - Get configuration
router.get('/', async (req: Request, res: Response) => {
  try {
    const config = configLoader.getConfig();
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIG_NOT_FOUND',
        message: error instanceof Error ? error.message : 'Failed to load configuration',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// PATCH /api/v1/config - Update configuration
router.patch('/', async (req: Request, res: Response) => {
  const { llm, agents, storage, sandbox } = req.body;
  
  try {
    const currentConfig = configLoader.getConfig();
    
    // Update only provided fields
    const updatedConfig = {
      ...currentConfig,
      ...(llm && { llm: { ...currentConfig.llm, ...llm } }),
      ...(agents && { agents: { ...currentConfig.agents, ...agents } }),
      ...(storage && { storage: { ...currentConfig.storage, ...storage } }),
      ...(sandbox && { sandbox: { ...currentConfig.sandbox, ...sandbox } }),
    };
    
    res.json({
      success: true,
      data: updatedConfig,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIG_UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update configuration',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
