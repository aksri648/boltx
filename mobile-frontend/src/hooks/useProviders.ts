import { useState, useEffect } from 'react';
import { fetchConfiguredProviders, fetchModels } from '~/lib/api';
import type { ProviderInfo, ModelInfo } from '~/lib/types';

const FALLBACK_PROVIDERS: ProviderInfo[] = [
  { name: 'Anthropic' },
  { name: 'OpenAI' },
  { name: 'Google' },
  { name: 'Groq' },
  { name: 'Mistral' },
  { name: 'OpenRouter' },
  { name: 'OpenAILike' },
];

function normalizeModels(data: unknown): string[] {
  if (!data) return [];

  let rawModels: ModelInfo[] = [];

  if (Array.isArray(data)) {
    rawModels = data;
  } else if (data && typeof data === 'object' && 'models' in data && Array.isArray((data as { models: unknown }).models)) {
    rawModels = (data as { models: ModelInfo[] }).models;
  }

  return rawModels.map((m) => m.name || m.id || String(m));
}

/**
 * Shared hook for fetching configured providers and their models.
 * Used by both ChatScreen and SettingsScreen.
 */
export function useProviders(currentProvider: string) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    fetchConfiguredProviders()
      .then((data) => {
        if (data?.providers && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      })
      .catch(() => {
        // Fallback to hardcoded list if backend is unreachable
        setProviders(FALLBACK_PROVIDERS);
      });
  }, []);

  useEffect(() => {
    if (!currentProvider) return;

    fetchModels(currentProvider)
      .then((data) => setModels(normalizeModels(data)))
      .catch(() => setModels([]));
  }, [currentProvider]);

  return { providers, models };
}
