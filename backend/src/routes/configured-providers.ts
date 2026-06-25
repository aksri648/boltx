import { Router, type Request, type Response } from 'express';
import { getProviderList } from '~/utils/constants';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const providers = await getProviderList();
    const configured = providers.map((p: any) => ({
      name: p.name,
      config: p.config,
      getApiKeyLink: p.getApiKeyLink,
      labelForGetApiKey: p.labelForGetApiKey,
      icon: p.icon,
    }));
    res.json({ providers: configured });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
