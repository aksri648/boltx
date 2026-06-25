import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class PerplexityProvider extends BaseProvider {
  name = 'Perplexity';
  getApiKeyLink = 'https://www.perplexity.ai/settings/api';
  labelForGetApiKey = 'Perplexity API key';
  icon = 'i-perplexity';
  config = { baseUrlKey: 'PERPLEXITY_API_BASE_URL', apiTokenKey: 'PERPLEXITY_API_KEY', baseUrl: 'https://api.perplexity.ai/' };
  staticModels: ModelInfo[] = [
    { name: 'sonar-pro', label: 'Sonar Pro', provider: 'Perplexity', maxTokenAllowed: 8192 },
    { name: 'sonar', label: 'Sonar', provider: 'Perplexity', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'PERPLEXITY_API_BASE_URL', defaultApiTokenKey: 'PERPLEXITY_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default PerplexityProvider;
