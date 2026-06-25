import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class HyperbolicProvider extends BaseProvider {
  name = 'Hyperbolic';
  getApiKeyLink = 'https://app.hyperbolic.xyz/settings';
  labelForGetApiKey = 'Hyperbolic API key';
  icon = 'i-hyperbolic';
  config = { baseUrlKey: 'HYPERBOLIC_API_BASE_URL', apiTokenKey: 'HYPERBOLIC_API_KEY', baseUrl: 'https://api.hyperbolic.xyz/v1/' };
  staticModels: ModelInfo[] = [
    { name: 'Qwen2.5-Coder-32B-Instruct', label: 'Qwen 2.5 Coder 32B Instruct', provider: 'Hyperbolic', maxTokenAllowed: 8192 },
    { name: 'DeepSeek-R1-Distill-Qwen-32B', label: 'DeepSeek R1 Distill Qwen 32B', provider: 'Hyperbolic', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'HYPERBOLIC_API_BASE_URL', defaultApiTokenKey: 'HYPERBOLIC_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default HyperbolicProvider;
