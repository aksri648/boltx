import { Router, type Request, type Response } from 'express';
import { streamText } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('EnhancerRoute');

const ENHANCER_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to enhance user prompts for AI coding assistants.
Take the user's initial request and expand it into a detailed, well-structured prompt that covers:
- Clear objectives
- Technical requirements
- Expected outcomes
- Potential edge cases

Return ONLY the enhanced prompt text, no explanations.`;

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { prompt, provider, model, apiKeys } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const serverEnv = process.env as Record<string, string>;

    let { stream, pipePromise } = await streamText({
      messages: [
        { role: 'system', content: ENHANCER_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      provider: provider || 'Anthropic',
      model: model || 'claude-3-5-sonnet-latest',
      apiKeys,
      serverEnv,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const reader = stream.readable.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.write('data: [DONE]\n\n');
        res.end();
        break;
      }
      const text = decoder.decode(value, { stream: true });
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    await pipePromise;
  } catch (error: any) {
    logger.error('Enhancer error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
