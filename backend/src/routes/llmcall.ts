import { Router, type Request, type Response } from 'express';
import { streamText } from '~/lib/.server/llm/stream-text';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';
import { Chat } from '~/lib/models/Chat';
import { isMongoDBConnected } from '~/lib/db/mongodb';

const logger = createScopedLogger('LLMCallRoute');
const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, message, system, chatId, provider, model, apiKeys, providerSettings } = req.body;
    const serverEnv = process.env as Record<string, string>;

    // Resolve system prompt: prefer stored prompt from MongoDB, fallback to client-provided
    let systemPrompt = system;
    if (chatId && isMongoDBConnected() && !systemPrompt) {
      try {
        const chat = await Chat.findOne({ chatId }).lean();
        if (chat?.systemPrompt) {
          systemPrompt = chat.systemPrompt;
        }
      } catch (err) {
        logger.warn('Failed to load system prompt from MongoDB:', err);
      }
    }

    // Accept both `messages` (array) and `message` (single string) + `system` prompt
    let llmMessages;
    if (messages && Array.isArray(messages)) {
      llmMessages = [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        ...messages,
      ];
    } else if (message) {
      llmMessages = [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: String(message) },
      ];
    } else {
      throw new Error('Either `messages` (array) or `message` (string) is required');
    }

    let { stream, pipePromise } = await streamText({
      messages: llmMessages,
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
