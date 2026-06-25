import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitInfoRoute');
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const repoUrl = url as string;
    let owner = '';
    let repo = '';
    let service: 'github' | 'gitlab' = 'github';

    if (repoUrl.includes('github.com')) {
      const parts = repoUrl.replace('https://github.com/', '').split('/');
      owner = parts[0];
      repo = parts[1]?.replace('.git', '') || '';
    } else if (repoUrl.includes('gitlab.com')) {
      service = 'gitlab';
      const parts = repoUrl.replace('https://gitlab.com/', '').split('/');
      owner = parts[0];
      repo = parts[1]?.replace('.git', '') || '';
    } else {
      res.status(400).json({ error: 'Unsupported git service' });
      return;
    }

    res.json({ owner, repo, service });
  } catch (error: any) {
    logger.error('Git info error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
