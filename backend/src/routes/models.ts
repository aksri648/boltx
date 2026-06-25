import { Router, type Request, type Response } from 'express';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ModelsRoute');
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const serverEnv = process.env as Record<string, string>;
    const llmManager = LLMManager.getInstance(serverEnv);

    let models = llmManager.getStaticModelList();

    const providerSettings = req.query.providerSettings
      ? JSON.parse(req.query.providerSettings as string)
      : undefined;

    if (providerSettings && Object.keys(providerSettings).length > 0) {
      try {
        const updatedModels = await llmManager.updateModelList({
          apiKeys: req.query.apiKeys ? JSON.parse(req.query.apiKeys as string) : undefined,
          providerSettings,
          serverEnv,
        });
        models = updatedModels;
      } catch (err) {
        logger.warn('Failed to update dynamic models, using static list:', err);
      }
    }

    res.json({ models });
  } catch (error: any) {
    logger.error('Models error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
