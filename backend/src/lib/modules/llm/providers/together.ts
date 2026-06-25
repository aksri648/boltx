import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class TogetherProvider extends BaseProvider {
  name = 'Together';
  getApiKeyLink = 'https://api.together.xyz/settings/api-keys';
  labelForGetApiKey = 'Together API key';
  icon = 'i-logos:together';
  config = { baseUrlKey: 'TOGETHER_API_BASE_URL', apiTokenKey: 'TOGETHER_API_KEY', baseUrl: 'https://api.together.xyz/v1' };
  staticModels: ModelInfo[] = [
    { name: 'Qwen/Qwen2.5-Coder-32B-Instruct', label: 'Qwen 2.5 Coder 32B Instruct', provider: 'Together', maxTokenAllowed: 8192 },
    { name: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B Instruct', provider: 'Together', maxTokenAllowed: 8192 },
    { name: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1', provider: 'Together', maxTokenAllowed: 8192 },
    { name: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B', label: 'DeepSeek R1 Distill Llama 70B', provider: 'Together', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'TOGETHER_API_BASE_URL', defaultApiTokenKey: 'TOGETHER_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default TogetherProvider;
