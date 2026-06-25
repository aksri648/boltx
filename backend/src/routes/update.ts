import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('UpdateRoute');
const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const response = await fetch('https://api.github.com/repos/stackblitz/bolt.new/releases/latest');
    if (!response.ok) {
      res.json({ current: '0.0.0', latest: '0.0.0', updateAvailable: false });
      return;
    }
    const release: any = await response.json();
    const latestVersion = release.tag_name?.replace('v', '') || '0.0.0';
    const currentVersion = process.env.npm_package_version || '0.0.0';
    res.json({
      current: currentVersion,
      latest: latestVersion,
      updateAvailable: latestVersion !== currentVersion,
      url: (release as any).html_url,
    });
  } catch (error: any) {
    logger.error('Update check error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
