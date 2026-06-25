import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('NetlifyProxy');
const router = Router();

// Proxy Netlify user info
router.post('/user', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    const response = await fetch('https://api.netlify.com/api/v1/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Netlify API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Netlify user proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy Netlify sites list
router.post('/sites', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    const response = await fetch('https://api.netlify.com/api/v1/sites', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Netlify API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Netlify sites proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy Netlify site details
router.post('/sites/:siteId', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const { siteId } = req.params;

    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Netlify API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Netlify site details proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy Netlify site deploys
router.post('/sites/:siteId/deploys/:deployId', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const { siteId, deployId } = req.params;

    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Netlify API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('Netlify deploy status proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
