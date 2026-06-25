import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class OpenRouterProvider extends BaseProvider {
  name = 'OpenRouter';
  getApiKeyLink = 'https://openrouter.ai/keys';
  labelForGetApiKey = 'OpenRouter API key';
  icon = 'i-logos:openrouter';
  config = { baseUrlKey: 'OPEN_ROUTER_API_BASE_URL', apiTokenKey: 'OPEN_ROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1' };
  staticModels: ModelInfo[] = [
    { name: 'gryphe/mythomax-l2-13b', label: 'MythoMax L2 13B', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'microsoft/wizardlm-2-8x22b', label: 'WizardLM 2 8x22B', provider: 'OpenRouter', maxTokenAllowed: 65536 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'OPEN_ROUTER_API_BASE_URL', defaultApiTokenKey: 'OPEN_ROUTER_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default OpenRouterProvider;
