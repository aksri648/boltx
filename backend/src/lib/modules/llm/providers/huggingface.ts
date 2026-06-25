import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class HuggingFaceProvider extends BaseProvider {
  name = 'HuggingFace';
  getApiKeyLink = 'https://huggingface.co/settings/tokens';
  labelForGetApiKey = 'HuggingFace API token';
  icon = 'i-logos:huggingface-icon';
  config = { baseUrlKey: 'HUGGINGFACE_API_BASE_URL', apiTokenKey: 'HUGGINGFACE_API_KEY', baseUrl: 'https://api-inference.huggingface.co/v1/' };
  staticModels: ModelInfo[] = [
    { name: 'meta-llama/Llama-3.2-1B-Instruct', label: 'Llama 3.2 1B Instruct', provider: 'HuggingFace', maxTokenAllowed: 8192 },
    { name: 'meta-llama/Llama-3.2-3B-Instruct', label: 'Llama 3.2 3B Instruct', provider: 'HuggingFace', maxTokenAllowed: 8192 },
    { name: 'meta-llama/Llama-3.2-11B-Vision-Instruct', label: 'Llama 3.2 11B Vision Instruct', provider: 'HuggingFace', maxTokenAllowed: 8192 },
    { name: 'meta-llama/Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct', provider: 'HuggingFace', maxTokenAllowed: 8192 },
    { name: 'meta-llama/Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B Instruct', provider: 'HuggingFace', maxTokenAllowed: 8192 },
    { name: 'microsoft/Phi-3.5-mini-instruct', label: 'Phi 3.5 Mini Instruct', provider: 'HuggingFace', maxTokenAllowed: 8192 },
    { name: 'Qwen/Qwen2.5-Coder-32B-Instruct', label: 'Qwen 2.5 Coder 32B Instruct', provider: 'HuggingFace', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'HUGGINGFACE_API_BASE_URL', defaultApiTokenKey: 'HUGGINGFACE_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default HuggingFaceProvider;
