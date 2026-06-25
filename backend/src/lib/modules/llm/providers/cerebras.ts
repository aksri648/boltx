import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class CerebrasProvider extends BaseProvider {
  name = 'Cerebras';
  getApiKeyLink = 'https://cloud.cerebras.ai/';
  labelForGetApiKey = 'Cerebras API key';
  icon = 'i-cerebras';
  config = { baseUrlKey: 'CEREBRAS_API_BASE_URL', apiTokenKey: 'CEREBRAS_API_KEY', baseUrl: 'https://api.cerebras.ai/v1/' };
  staticModels: ModelInfo[] = [
    { name: 'llama3.1-8b', label: 'Llama 3.1 8B', provider: 'Cerebras', maxTokenAllowed: 8192 },
    { name: 'llama-3.3-70b', label: 'Llama 3.3 70B', provider: 'Cerebras', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'CEREBRAS_API_BASE_URL', defaultApiTokenKey: 'CEREBRAS_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default CerebrasProvider;
