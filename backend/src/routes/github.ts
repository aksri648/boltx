import { Router, type Request, type Response } from 'express';
import { getGitHubApiService } from '~/lib/services/githubApiService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHubRoute');
const router = Router();

router.get('/user', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const svc = getGitHubApiService(token);
    const user = await svc.getUser();
    res.json(user);
  } catch (error: any) {
    logger.error('GitHub user error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/repos', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const svc = getGitHubApiService(token);
    const repos = await svc.getRepos();
    res.json(repos);
  } catch (error: any) {
    logger.error('GitHub repos error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/repos', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const { name, description, private: isPrivate } = req.body;
    const svc = getGitHubApiService(token);
    const repo = await svc.createRepo(name, description, isPrivate);
    res.json(repo);
  } catch (error: any) {
    logger.error('GitHub create repo error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
