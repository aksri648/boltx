import { Router, type Request, type Response } from 'express';
import { streamText } from '~/lib/.server/llm/stream-text';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LLMCallRoute');
const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, provider, model, apiKeys, providerSettings } = req.body;
    const serverEnv = process.env as Record<string, string>;

    let { stream, pipePromise } = await streamText({
      messages,
      provider: provider || 'Anthropic',
      model: model || 'claude-3-5-sonnet-latest',
      apiKeys,
      providerSettings,
      serverEnv,
    });

    const reader = stream.readable.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    await pipePromise;

    res.json({ content: fullText });
  } catch (error: any) {
    logger.error('LLM call error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
