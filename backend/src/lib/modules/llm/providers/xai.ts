import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class XAIProvider extends BaseProvider {
  name = 'xAI';
  getApiKeyLink = 'https://console.x.ai/';
  labelForGetApiKey = 'xAI API key';
  icon = 'i-xai';
  config = { baseUrlKey: 'XAI_API_BASE_URL', apiTokenKey: 'XAI_API_KEY', baseUrl: 'https://api.x.ai/v1' };
  staticModels: ModelInfo[] = [
    { name: 'grok-beta', label: 'Grok Beta', provider: 'xAI', maxTokenAllowed: 131072 },
    { name: 'grok-2-1212', label: 'Grok 2 1212', provider: 'xAI', maxTokenAllowed: 131072 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'XAI_API_BASE_URL', defaultApiTokenKey: 'XAI_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default XAIProvider;
