import type { LanguageModelV1 } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class OllamaProvider extends BaseProvider {
  name = 'Ollama';
  config = { baseUrlKey: 'OLLAMA_API_BASE_URL', baseUrl: 'http://localhost:11434/api' };
  staticModels: ModelInfo[] = [
    { name: 'llama3.1', label: 'Llama 3.1 (8B)', provider: 'Ollama', maxTokenAllowed: 8192 },
    { name: 'llama3.1:70b', label: 'Llama 3.1 (70B)', provider: 'Ollama', maxTokenAllowed: 8192 },
    { name: 'qwen2.5-coder:7b', label: 'Qwen 2.5 Coder (7B)', provider: 'Ollama', maxTokenAllowed: 32768 },
    { name: 'qwen2.5-coder:32b', label: 'Qwen 2.5 Coder (32B)', provider: 'Ollama', maxTokenAllowed: 32768 },
    { name: 'qwen2.5:7b', label: 'Qwen 2.5 (7B)', provider: 'Ollama', maxTokenAllowed: 32768 },
    { name: 'deepseek-r1:7b', label: 'DeepSeek R1 (7B)', provider: 'Ollama', maxTokenAllowed: 131072 },
    { name: 'deepseek-r1:8b', label: 'DeepSeek R1 (8B)', provider: 'Ollama', maxTokenAllowed: 131072 },
    { name: 'deepseek-r1:14b', label: 'DeepSeek R1 (14B)', provider: 'Ollama', maxTokenAllowed: 131072 },
    { name: 'deepseek-r1:32b', label: 'DeepSeek R1 (32B)', provider: 'Ollama', maxTokenAllowed: 131072 },
    { name: 'deepseek-r1:70b', label: 'DeepSeek R1 (70B)', provider: 'Ollama', maxTokenAllowed: 131072 },
    { name: 'codellama', label: 'Code Llama (7B)', provider: 'Ollama', maxTokenAllowed: 16384 },
    { name: 'mistral', label: 'Mistral (7B)', provider: 'Ollama', maxTokenAllowed: 8192 },
    { name: 'mixtral:8x22b', label: 'Mixtral (8x22B)', provider: 'Ollama', maxTokenAllowed: 65536 },
    { name: 'phi:14b', label: 'Phi-3 (14B)', provider: 'Ollama', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { serverEnv, model } = options;
    const { baseUrl } = this.getProviderBaseUrlAndKey({ serverEnv, defaultBaseUrlKey: 'OLLAMA_API_BASE_URL', defaultApiTokenKey: '' });
    const resolvedBaseUrl = this.resolveDockerUrl(baseUrl || 'http://localhost:11434/api', serverEnv);
    const ollamaClient = createOllama({ baseURL: resolvedBaseUrl });
    return ollamaClient(model);
  }
}

export default OllamaProvider;
