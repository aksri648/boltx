import type { LanguageModelV1 } from 'ai';
import { createCohere } from '@ai-sdk/cohere';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class CohereProvider extends BaseProvider {
  name = 'Cohere';
  getApiKeyLink = 'https://dashboard.cohere.com/api-keys';
  labelForGetApiKey = 'Cohere API key';
  icon = 'i-logos:cohere';
  config = { apiTokenKey: 'COHERE_API_KEY' };
  staticModels: ModelInfo[] = [
    { name: 'command-r-08-2024', label: 'Command R (08-2024)', provider: 'Cohere', maxTokenAllowed: 8192 },
    { name: 'command-r-plus-08-2024', label: 'Command R+ (08-2024)', provider: 'Cohere', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: '', defaultApiTokenKey: 'COHERE_API_KEY' });
    const cohere = createCohere({ apiKey });
    return cohere(model);
  }
}

export default CohereProvider;
