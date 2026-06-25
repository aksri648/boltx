import { Router, type Request, type Response } from 'express';
import { validateWebSearchUrl } from '~/lib/security';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WebSearchRoute');
const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { query, url, count = 5 } = req.body;

    if (url) {
      if (!validateWebSearchUrl(url)) {
        res.status(400).json({ error: 'Invalid URL' });
        return;
      }

      const response = await fetch(url);
      const text = await response.text();
      res.json({ content: text.substring(0, 10000) });
      return;
    }

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    const response = await fetch(searchUrl);
    const data: any = await response.json();

    res.json({ results: data.RelatedTopics?.slice(0, count) || [] });
  } catch (error: any) {
    logger.error('Web search error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
