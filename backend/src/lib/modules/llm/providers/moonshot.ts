import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class MoonshotProvider extends BaseProvider {
  name = 'Moonshot';
  getApiKeyLink = 'https://platform.moonshot.cn/console/api-keys';
  labelForGetApiKey = 'Moonshot API key';
  icon = 'i-moonshot';
  config = { baseUrlKey: 'MOONSHOT_API_BASE_URL', apiTokenKey: 'MOONSHOT_API_KEY', baseUrl: 'https://api.moonshot.cn/v1' };
  staticModels: ModelInfo[] = [
    { name: 'moonshot-v1-8k', label: 'Moonshot V1 8K', provider: 'Moonshot', maxTokenAllowed: 8192 },
    { name: 'moonshot-v1-32k', label: 'Moonshot V1 32K', provider: 'Moonshot', maxTokenAllowed: 32768 },
    { name: 'moonshot-v1-128k', label: 'Moonshot V1 128K', provider: 'Moonshot', maxTokenAllowed: 131072 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'MOONSHOT_API_BASE_URL', defaultApiTokenKey: 'MOONSHOT_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default MoonshotProvider;
