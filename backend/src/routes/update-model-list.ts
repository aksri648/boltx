import { Router, type Request, type Response } from 'express';
import { createScopedLogger } from '~/utils/logger';
import { LLMManager } from '~/lib/modules/llm/manager';

const logger = createScopedLogger('UpdateModelListRoute');
const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const serverEnv = process.env as Record<string, string>;
    const llmManager = LLMManager.getInstance(serverEnv);
    const { apiKeys, providerSettings } = req.body;

    const models = await llmManager.updateModelList({ apiKeys, providerSettings, serverEnv });
    res.json({ models });
  } catch (error: any) {
    logger.error('Update model list error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
