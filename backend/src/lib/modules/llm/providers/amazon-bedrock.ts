import type { LanguageModelV1 } from 'ai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '../types';

export class AmazonBedrockProvider extends BaseProvider {
  name = 'AmazonBedrock';
  getApiKeyLink = 'https://docs.aws.amazon.com/bedrock/latest/userguide/setting-up.html';
  labelForGetApiKey = 'AWS Access Key ID & Secret Access Key';
  icon = 'i-logos:aws';
  config = { apiTokenKey: 'BEDROCK_API_KEY' };
  staticModels: ModelInfo[] = [
    { name: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', label: 'Claude 3.5 Sonnet v2', provider: 'AmazonBedrock', maxTokenAllowed: 8192 },
    { name: 'us.anthropic.claude-3-5-haiku-20241022-v1:0', label: 'Claude 3.5 Haiku v2', provider: 'AmazonBedrock', maxTokenAllowed: 8192 },
    { name: 'us.meta.llama3-2-90b-instruct-v1:0', label: 'Llama 3.2 90B Instruct', provider: 'AmazonBedrock', maxTokenAllowed: 8192 },
    { name: 'us.meta.llama3-1-8b-instruct-v1:0', label: 'Llama 3.1 8B Instruct', provider: 'AmazonBedrock', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: { model: string; serverEnv?: Record<string, string>; apiKeys?: Record<string, string> }): LanguageModelV1 {
    // Amazon Bedrock uses the @aws-sdk/client-bedrock-runtime, not OpenAI compatible
    // We return a minimal stub that throws at runtime, since proper bedrock integration
    // requires the AWS SDK v3 packages.
    const { model } = options;
    const bedrockClient = {
      specName: 'bedrock',
      provider: 'amazon-bedrock',
      modelId: model,
    } as unknown as LanguageModelV1;
    return bedrockClient;
  }
}

export default AmazonBedrockProvider;
