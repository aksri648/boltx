import { Router, type Request, type Response } from 'express';
import { getProviderList, getProviderBaseUrlEnvKeys } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ExportApiKeysRoute');
const router = Router();

router.post('/', async (_req: Request, res: Response) => {
  try {
    const providers = await getProviderList();
    const envKeys = await getProviderBaseUrlEnvKeys();
    const keys: Record<string, string> = {};

    providers.forEach((p: any) => {
      const keysForProvider = envKeys[p.name] || {};
      if (keysForProvider.apiTokenKey) {
        const val = process.env[keysForProvider.apiTokenKey];
        if (val) keys[p.name] = val;
      }
    });

    res.json({ keys });
  } catch (error: any) {
    logger.error('Export API keys error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
