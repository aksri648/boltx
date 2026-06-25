import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('NetlifyRoute');
const router = Router();

router.post('/deploy', async (req: Request, res: Response) => {
  try {
    const { token, siteName, files } = req.body;

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: siteName }),
    });

    if (!siteRes.ok) throw new Error(`Netlify API error: ${siteRes.status}`);
    const site: any = await siteRes.json();

    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/zip' },
      body: Buffer.from(files),
    });

    if (!deployRes.ok) throw new Error(`Netlify deploy error: ${deployRes.status}`);
    const deploy: any = await deployRes.json();

    res.json({ url: deploy.url, id: deploy.id });
  } catch (error: any) {
    logger.error('Netlify deploy error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
