import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('VercelProxy');
const router = Router();

// Proxy Vercel user info
router.post('/user', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      res.status(response.status).json({ error: `Vercel API error: ${response.status}`, details: errorText });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Vercel user proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy Vercel projects
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Vercel API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Vercel projects proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy Vercel deployments
router.post('/deployments', async (req: Request, res: Response) => {
  try {
    const { token, projectId, limit } = req.body;
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    const url = projectId
      ? `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=${limit || 1}`
      : `https://api.vercel.com/v6/deployments?limit=${limit || 1}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Vercel API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Vercel deployments proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy Vercel project details
router.post('/project-details', async (req: Request, res: Response) => {
  try {
    const { token, projectId } = req.body;
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }
    if (!projectId) {
      res.status(400).json({ error: 'No projectId provided' });
      return;
    }

    const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Vercel API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Vercel project details proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
