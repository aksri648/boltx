import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class LMStudioProvider extends BaseProvider {
  name = 'LMStudio';
  config = { baseUrlKey: 'LMSTUDIO_API_BASE_URL', apiTokenKey: 'LMSTUDIO_API_KEY', baseUrl: 'http://localhost:1234/v1' };
  staticModels: ModelInfo[] = [
    { name: 'local-model', label: 'Local Model', provider: 'LMStudio', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'LMSTUDIO_API_BASE_URL', defaultApiTokenKey: 'LMSTUDIO_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default LMStudioProvider;
