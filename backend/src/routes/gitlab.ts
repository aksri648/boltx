import { Router, type Request, type Response } from 'express';
import { getGitLabApiService } from '~/lib/services/gitlabApiService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitLabRoute');
const router = Router();

router.get('/user', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const svc = getGitLabApiService(token);
    const user = await svc.getUser();
    res.json(user);
  } catch (error: any) {
    logger.error('GitLab user error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/projects', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const { name, description, visibility } = req.body;
    const svc = getGitLabApiService(token);
    const project = await svc.createProject(name, description, visibility);
    res.json(project);
  } catch (error: any) {
    logger.error('GitLab project error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
