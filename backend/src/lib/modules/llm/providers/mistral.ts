import type { LanguageModelV1 } from 'ai';
import { createMistral } from '@ai-sdk/mistral';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class MistralProvider extends BaseProvider {
  name = 'Mistral';
  getApiKeyLink = 'https://console.mistral.ai/api-keys/';
  labelForGetApiKey = 'Mistral API key';
  icon = 'i-logos:mistral-ai';
  config = { apiTokenKey: 'MISTRAL_API_KEY' };
  staticModels: ModelInfo[] = [
    { name: 'mistral-large-latest', label: 'Mistral Large', provider: 'Mistral', maxTokenAllowed: 8192 },
    { name: 'mistral-small-latest', label: 'Mistral Small', provider: 'Mistral', maxTokenAllowed: 8192 },
    { name: 'codestral-latest', label: 'Codestral', provider: 'Mistral', maxTokenAllowed: 8192 },
    { name: 'pixtral-large-latest', label: 'Pixtral Large', provider: 'Mistral', maxTokenAllowed: 8192 },
    { name: 'ministral-8b-latest', label: 'Ministral 8B', provider: 'Mistral', maxTokenAllowed: 8192 },
    { name: 'mistral-embed', label: 'Mistral Embed', provider: 'Mistral', maxTokenAllowed: 8192 },
    { name: 'mistral-moderation-latest', label: 'Mistral Moderation', provider: 'Mistral', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: '', defaultApiTokenKey: 'MISTRAL_API_KEY' });
    const mistral = createMistral({ apiKey });
    return mistral(model);
  }
}

export default MistralProvider;
