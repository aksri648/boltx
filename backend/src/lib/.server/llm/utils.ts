import { LLMManager } from '~/lib/modules/llm/manager';

export function getApiKey(provider: string, env: Record<string, string>): string | undefined {
  const manager = LLMManager.getInstance(env);
  const p = manager.getProvider(provider);
  if (!p) return undefined;
  const key = p.config.apiTokenKey;
  if (!key) return undefined;
  return env?.[key] || process.env[key];
}
