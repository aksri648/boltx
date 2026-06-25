import { streamText as aiStreamText, type LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { LLMManager } from '~/lib/modules/llm/manager';
import { SwitchableStream } from './switchable-stream';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('StreamText');

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamTextOptions {
  messages: Message[];
  provider: string;
  model: string;
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
  serverEnv?: Record<string, string>;
  systemPrompt?: string;
  onFinish?: (result: unknown) => Promise<void>;
  onError?: (error: Error) => void;
  abortSignal?: AbortSignal;
}

export async function streamText(options: StreamTextOptions) {
  const { messages, provider: providerName, model, apiKeys, providerSettings, serverEnv, systemPrompt, onFinish, onError, abortSignal } = options;

  const llmManager = LLMManager.getInstance(serverEnv || {});
  const provider = llmManager.getProvider(providerName);
  if (!provider) throw new Error(`Provider ${providerName} not found`);

  let instance: LanguageModelV1;
  try {
    instance = provider.getModelInstance({ model, serverEnv, apiKeys, providerSettings });
  } catch (err) {
    logger.error('Failed to get model instance:', err);
    throw err;
  }

  const switchableStream = new SwitchableStream();

  const result = aiStreamText({
    model: instance,
    messages,
    system: systemPrompt,
    abortSignal,
    onFinish: async (result) => {
      await switchableStream.close();
      if (onFinish) await onFinish(result);
    },
    onError: ({ error }) => {
      logger.error('Stream error:', error);
      if (onError) onError(error as Error);
    },
  });

  const pipePromise = (async () => {
    const reader = result.textStream.getReader();
    const writer = switchableStream.writable.getWriter();
    const encoder = new TextEncoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(encoder.encode(value));
      }
    } catch (err) {
      logger.error('Pipe error:', err);
    } finally {
      try { await writer.close(); } catch {}
    }
  })();

  return {
    stream: switchableStream,
    result,
    pipePromise,
  };
}
