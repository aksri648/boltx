import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class FireworksProvider extends BaseProvider {
  name = 'Fireworks';
  getApiKeyLink = 'https://fireworks.ai/account/api-keys';
  labelForGetApiKey = 'Fireworks API key';
  icon = 'i-fireworks';
  config = { baseUrlKey: 'FIREWORKS_API_BASE_URL', apiTokenKey: 'FIREWORKS_API_KEY', baseUrl: 'https://api.fireworks.ai/inference/v1' };
  staticModels: ModelInfo[] = [
    { name: 'accounts/fireworks/models/llama-v3p2-3b-instruct', label: 'Llama 3.2 3B Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct', label: 'Llama 3.2 11B Vision Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/llama-v3p2-90b-vision-instruct', label: 'Llama 3.2 90B Vision Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/llama-v3p1-405b-instruct', label: 'Llama 3.1 405B Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/llama-v3p1-70b-instruct', label: 'Llama 3.1 70B Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/llama-v3p1-8b-instruct', label: 'Llama 3.1 8B Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/deepseek-r1', label: 'Deepseek R1', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/qwen2p5-72b-instruct', label: 'Qwen 2.5 72B Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/mixtral-8x22b-instruct', label: 'Mixtral 8x22B Instruct', provider: 'Fireworks', maxTokenAllowed: 65536 },
    { name: 'accounts/fireworks/models/mixtral-8x7b-instruct', label: 'Mixtral 8x7B Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
    { name: 'accounts/fireworks/models/llama-v3p2-1b-instruct', label: 'Llama 3.2 1B Instruct', provider: 'Fireworks', maxTokenAllowed: 32768 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'FIREWORKS_API_BASE_URL', defaultApiTokenKey: 'FIREWORKS_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default FireworksProvider;
