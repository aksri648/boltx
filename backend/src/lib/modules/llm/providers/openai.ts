import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class OpenAIProvider extends BaseProvider {
  name = 'OpenAI';
  getApiKeyLink = 'https://platform.openai.com/api-keys';
  labelForGetApiKey = 'OpenAI API key';
  icon = 'i-logos:openai';
  config = { apiTokenKey: 'OPENAI_API_KEY' };
  staticModels: ModelInfo[] = [
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', maxTokenAllowed: 8192 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', maxTokenAllowed: 8192 },
    { name: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI', maxTokenAllowed: 8192 },
    { name: 'gpt-4', label: 'GPT-4', provider: 'OpenAI', maxTokenAllowed: 8192 },
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokenAllowed: 8192 },
    { name: 'o1', label: 'o1', provider: 'OpenAI', maxTokenAllowed: 8192 },
    { name: 'o1-mini', label: 'o1 Mini', provider: 'OpenAI', maxTokenAllowed: 8192 },
    { name: 'o3-mini', label: 'o3 Mini', provider: 'OpenAI', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: '', defaultApiTokenKey: 'OPENAI_API_KEY' });
    const openai = createOpenAI({ apiKey });
    return openai(model);
  }
}

export default OpenAIProvider;
