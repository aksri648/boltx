import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('BugReportRoute');
const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, body, labels } = req.body;

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      res.status(400).json({ error: 'GitHub token not configured' });
      return;
    }

    const response = await fetch('https://api.github.com/repos/stackblitz/bolt.new/issues', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: labels || ['bug'],
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const issue: any = await response.json();
    res.json({ url: issue.html_url, number: issue.number });
  } catch (error: any) {
    logger.error('Bug report error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
