import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class DeepseekProvider extends BaseProvider {
  name = 'Deepseek';
  getApiKeyLink = 'https://platform.deepseek.com/account/api-keys';
  labelForGetApiKey = 'Deepseek API key';
  icon = 'i-deepseek';
  config = { baseUrlKey: 'DEEPSEEK_API_BASE_URL', apiTokenKey: 'DEEPSEEK_API_KEY', baseUrl: 'https://api.deepseek.com/v1' };
  staticModels: ModelInfo[] = [
    { name: 'deepseek-chat', label: 'Deepseek v2 Chat', provider: 'Deepseek', maxTokenAllowed: 8192 },
    { name: 'deepseek-reasoner', label: 'Deepseek R1', provider: 'Deepseek', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'DEEPSEEK_API_BASE_URL', defaultApiTokenKey: 'DEEPSEEK_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default DeepseekProvider;
