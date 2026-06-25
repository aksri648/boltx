import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memory: {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
    },
  });
});

export default router;
