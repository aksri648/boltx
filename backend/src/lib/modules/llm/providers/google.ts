import type { LanguageModelV1 } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class GoogleProvider extends BaseProvider {
  name = 'Google';
  getApiKeyLink = 'https://aistudio.google.com/app/apikey';
  labelForGetApiKey = 'Google AI Studio API key';
  icon = 'i-logos:google-gemini';
  config = { baseUrlKey: 'GOOGLE_API_BASE_URL', apiTokenKey: 'GOOGLE_API_KEY', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' };
  staticModels: ModelInfo[] = [
    { name: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-2.0-flash-latest', label: 'Gemini 2.0 Flash', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-2.0-flash-thinking-exp-01-21', label: 'Gemini 2.0 Flash Thinking Exp', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-2.0-flash-lite-preview-02-05', label: 'Gemini 2.0 Flash Lite Preview', provider: 'Google', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    const { apiKeys, serverEnv, model } = options;
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({ apiKeys, serverEnv, defaultBaseUrlKey: 'GOOGLE_API_BASE_URL', defaultApiTokenKey: 'GOOGLE_API_KEY' });
    const google = createGoogleGenerativeAI({ baseURL: baseUrl, apiKey });
    return google(model);
  }
}

export default GoogleProvider;
