import { Router, type Request, type Response } from 'express';
import { getProviderList, getProviderBaseUrlEnvKeys } from '~/utils/constants';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    const providers = await getProviderList();
    const p = providers.find((p: any) => p.name === provider);
    if (!p) {
      res.json({ configured: false });
      return;
    }

    const envKeys = await getProviderBaseUrlEnvKeys();
    const keys = envKeys[provider] || {};
    const apiKeyEnv = keys.apiTokenKey;
    const apiKey = apiKeyEnv ? process.env[apiKeyEnv] : undefined;

    if (apiKey && apiKey.length > 0) {
      res.json({ configured: true });
    } else {
      res.json({ configured: false });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
