import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  });
});

export default router;
