import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class ZaiProvider extends BaseProvider {
  name = 'ZAI';
  config = { baseUrlKey: 'ZAI_API_BASE_URL', apiTokenKey: 'ZAI_API_KEY', baseUrl: 'https://api.zer1ai.com/v1' };
  staticModels: ModelInfo[] = [
    { name: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'ZAI', maxTokenAllowed: 8192 },
    { name: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku', provider: 'ZAI', maxTokenAllowed: 8192 },
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'ZAI', maxTokenAllowed: 8192 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'ZAI', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'ZAI_API_BASE_URL', defaultApiTokenKey: 'ZAI_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default ZaiProvider;
