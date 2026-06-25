import type { LanguageModelV1 } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class GroqProvider extends BaseProvider {
  name = 'Groq';
  getApiKeyLink = 'https://console.groq.com/keys';
  labelForGetApiKey = 'Groq API key';
  icon = 'i-logos:groq';
  config = { apiTokenKey: 'GROQ_API_KEY' };
  staticModels: ModelInfo[] = [
    { name: 'gemma2-9b-it', label: 'Gemma 2 9B IT', provider: 'Groq', maxTokenAllowed: 8192 },
    { name: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'llama-3.2-1b-preview', label: 'Llama 3.2 1B Preview', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'llama-3.2-3b-preview', label: 'Llama 3.2 3B Preview', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'llama-3.2-11b-vision-preview', label: 'Llama 3.2 11B Vision Preview', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'llama-3.2-90b-vision-preview', label: 'Llama 3.2 90B Vision Preview', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B 32K', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'distil-whisper-large-v3-en', label: 'Distil Whisper Large V3 EN', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'llama-3.3-70b-specdec', label: 'Llama 3.3 70B SpecDec', provider: 'Groq', maxTokenAllowed: 8192 },
    { name: 'llama-guard-3-8b', label: 'Llama Guard 3 8B', provider: 'Groq', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: '', defaultApiTokenKey: 'GROQ_API_KEY' });
    const groq = createGroq({ apiKey });
    return groq(model) as unknown as LanguageModelV1;
  }
}

export default GroqProvider;
