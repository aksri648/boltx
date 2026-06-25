import { Router, type Request, type Response, type NextFunction } from 'express';
import { getProviderList, getProviderBaseUrlEnvKeys } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';
import type { BaseProvider } from '~/lib/modules/llm/base-provider';

const logger = createScopedLogger('ExportApiKeysRoute');
const router = Router();

/**
 * Require a valid admin API key to access this route.
 * The client must send `x-admin-key` header matching ADMIN_API_KEY env var.
 * If ADMIN_API_KEY is not set, the route is disabled entirely.
 */
function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    logger.warn('ADMIN_API_KEY not configured — export-api-keys disabled');
    res.status(403).json({ error: 'Export endpoint is disabled. Set ADMIN_API_KEY to enable.' });
    return;
  }

  const providedKey = req.headers['x-admin-key'];
  if (!providedKey || providedKey !== adminKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

router.post('/', requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const providers = await getProviderList();
    const envKeys = await getProviderBaseUrlEnvKeys();
    const keys: Record<string, string> = {};

    providers.forEach((p: BaseProvider) => {
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
