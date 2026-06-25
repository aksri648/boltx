import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class OpenAILikeProvider extends BaseProvider {
  name = 'OpenAILike';
  config = { baseUrlKey: 'OPENAI_LIKE_API_BASE_URL', apiTokenKey: 'OPENAI_LIKE_API_KEY', baseUrl: 'http://localhost:8080/v1' };
  staticModels: ModelInfo[] = [
    { name: 'local-model', label: 'Local Model', provider: 'OpenAILike', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'OPENAI_LIKE_API_BASE_URL', defaultApiTokenKey: 'OPENAI_LIKE_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default OpenAILikeProvider;
