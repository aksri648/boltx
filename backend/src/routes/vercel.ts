import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('VercelRoute');
const router = Router();

router.post('/deploy', async (req: Request, res: Response) => {
  try {
    const { token, projectName, files, framework } = req.body;

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const projectRes = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: projectName, framework }),
    });

    if (!projectRes.ok) throw new Error(`Vercel API error: ${projectRes.status}`);
    const project: any = await projectRes.json();

    const deployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: projectName,
        project: project.id,
        files,
        target: 'production',
      }),
    });

    if (!deployRes.ok) throw new Error(`Vercel deploy error: ${deployRes.status}`);
    const deploy: any = await deployRes.json();

    res.json({ url: deploy.url, id: deploy.id });
  } catch (error: any) {
    logger.error('Vercel deploy error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
