import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class GithubProvider extends BaseProvider {
  name = 'GitHub';
  getApiKeyLink = 'https://github.com/settings/tokens';
  labelForGetApiKey = 'GitHub Personal Access Token';
  icon = 'i-logos:github-icon';
  config = { baseUrlKey: 'GITHUB_API_BASE_URL', apiTokenKey: 'GITHUB_API_KEY', baseUrl: 'https://models.inference.ai.azure.com/' };
  staticModels: ModelInfo[] = [
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'gpt-4', label: 'GPT-4', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'o1', label: 'o1', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'o1-mini', label: 'o1 Mini', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'o3-mini', label: 'o3 Mini', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'o3', label: 'o3', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Phi-3.5-MoE-instruct', label: 'Phi 3.5 MoE Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Phi-3.5-mini-instruct', label: 'Phi 3.5 Mini Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Llama-3.2-90B-Vision-Instruct', label: 'Llama 3.2 90B Vision Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Llama-3.2-11B-Vision-Instruct', label: 'Llama 3.2 11B Vision Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Llama-3.2-3B-Instruct', label: 'Llama 3.2 3B Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Llama-3.2-1B-Instruct', label: 'Llama 3.2 1B Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Llama-3.1-405B-Instruct', label: 'Llama 3.1 405B Instruct', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Mistral-large-2407', label: 'Mistral Large 2407', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Mistral-small', label: 'Mistral Small', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Cohere-command-r-plus-08-2024', label: 'Cohere Command R+ 08-2024', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'Cohere-command-r-08-2024', label: 'Cohere Command R 08-2024', provider: 'GitHub', maxTokenAllowed: 8192 },
    { name: 'AI21-Jamba-1.5-Mini', label: 'AI21 Labs Jamba 1.5 Mini', provider: 'GitHub', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'GITHUB_API_BASE_URL', defaultApiTokenKey: 'GITHUB_API_KEY' });
    const client = createOpenAI({ baseURL: baseUrl, apiKey });
    return client(model);
  }
}

export default GithubProvider;
