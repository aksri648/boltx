import { Router, type Request, type Response } from 'express';
import { getProviderList, getDefaultProvider, STARTER_TEMPLATES } from '~/utils/constants';

const router = Router();

interface Template {
  name: string;
  label: string;
  description: string;
  githubRepo: string;
  tags?: string[];
  icon?: string;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const providers = await getProviderList();
    const defaultProvider = await getDefaultProvider();

    const providerInfos = providers.map((p: any) => ({
      name: p.name,
      getApiKeyLink: p.getApiKeyLink,
      labelForGetApiKey: p.labelForGetApiKey,
      icon: p.icon,
      staticModels: p.staticModels || [],
      isLocalProvider: ['OpenAILike', 'LMStudio', 'Ollama'].includes(p.name),
    }));

    const config = {
      defaultModel: process.env.DEFAULT_MODEL || 'claude-3-5-sonnet-latest',
      defaultProvider: defaultProvider?.name || providerInfos[0]?.name || 'OpenAI',
      providers: providerInfos,
      starterTemplates: STARTER_TEMPLATES as Template[],
    };

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
