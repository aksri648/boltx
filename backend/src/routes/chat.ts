import { Router, type Request, type Response } from 'express';
import { streamText } from '~/lib/.server/llm/stream-text';
import { getSystemPrompt } from '~/lib/common/prompt-library';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ChatRoute');
const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, provider, model, apiKeys, providerSettings, systemPrompt } = req.body;
    const serverEnv = process.env as Record<string, string>;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    let { stream, pipePromise } = await streamText({
      messages,
      provider: provider || 'Anthropic',
      model: model || 'claude-3-5-sonnet-latest',
      apiKeys,
      providerSettings,
      serverEnv,
      systemPrompt: systemPrompt || getSystemPrompt(process.cwd()),
    });

    req.on('close', async () => {
      logger.info('Client closed connection');
    });

    const reader = stream.readable.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

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
    logger.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
