import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitProxyRoute');
const router = Router();

router.post('/clone', async (req: Request, res: Response) => {
  try {
    const { url, branch, token } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const cloneUrl = url.replace('https://', `https://${token ? `oauth2:${token}@` : ''}`);
    const response = await fetch(cloneUrl, { headers });

    if (!response.ok) throw new Error(`Git proxy error: ${response.status}`);

    const content = await response.text();
    res.json({ content });
  } catch (error: any) {
    logger.error('Git proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
