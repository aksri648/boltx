import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SupabaseRoute');
const router = Router();

router.get('/projects', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const response = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Supabase API error: ${response.status}`);
    const projects = await response.json();
    res.json(projects);
  } catch (error: any) {
    logger.error('Supabase projects error:', error);
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

    const { name, region, plan } = req.body;

    const response = await fetch('https://api.supabase.com/v1/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, region, plan }),
    });

    if (!response.ok) throw new Error(`Supabase API error: ${response.status}`);
    const project = await response.json();
    res.json(project);
  } catch (error: any) {
    logger.error('Supabase create error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
