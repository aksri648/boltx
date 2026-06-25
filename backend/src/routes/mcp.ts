import { Router, type Request, type Response } from 'express';
import { getMCPService, type MCPServerConfig } from '~/lib/services/mcpService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MCPRoute');
const router = Router();

router.get('/servers', (_req: Request, res: Response) => {
  const svc = getMCPService();
  res.json({ servers: svc.getAllServers() });
});

router.post('/servers', (req: Request, res: Response) => {
  try {
    const config: MCPServerConfig = req.body;
    if (!config.name || !config.transport) {
      res.status(400).json({ error: 'Name and transport are required' });
      return;
    }
    const svc = getMCPService();
    svc.registerServer(config);
    res.json({ success: true, server: config });
  } catch (error: any) {
    logger.error('MCP register error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/servers/:name', (req: Request, res: Response) => {
  const svc = getMCPService();
  const removed = svc.removeServer(req.params.name);
  if (!removed) {
    res.status(404).json({ error: 'Server not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
