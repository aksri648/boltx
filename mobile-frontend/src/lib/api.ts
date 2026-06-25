const BACKEND_URL_KEY = 'bolt-mobile-backend-url';

function getBackendUrl(): string {
  const stored = localStorage.getItem(BACKEND_URL_KEY);
  return stored || 'http://localhost:3001';
}

export function setBackendUrl(url: string) {
  localStorage.setItem(BACKEND_URL_KEY, url.replace(/\/+$/, ''));
}

export function getApiBase(): string {
  return getBackendUrl() + '/api';
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiBase() + path;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

// --- Chat / LLM ---
export async function sendChatMessage(params: {
  message: string;
  system?: string;
  provider?: string;
  model?: string;
  apiKeys?: Record<string, string>;
}) {
  const res = await apiFetch('/llmcall', {
    method: 'POST',
    body: JSON.stringify({
      message: params.message,
      system: params.system,
      provider: params.provider || 'Anthropic',
      model: params.model || 'claude-3-5-sonnet-latest',
      apiKeys: params.apiKeys || {},
    }),
  });
  return res;
}

// --- Models ---
export async function fetchModels(providerName?: string) {
  if (providerName) {
    const res = await apiFetch(`/models/${encodeURIComponent(providerName)}`);
    return res.json();
  }
  const res = await apiFetch('/models');
  return res.json();
}

export async function fetchConfiguredProviders() {
  const res = await apiFetch('/configured-providers');
  return res.json();
}

// --- Config ---
export async function fetchConfig() {
  const res = await apiFetch('/config');
  return res.json();
}

// --- Prompt Enhancement ---
export async function enhancePrompt(prompt: string) {
  const res = await apiFetch('/enhancer', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  return res.json();
}

// --- Web Search ---
export async function webSearch(query: string) {
  const res = await apiFetch('/web-search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
  return res.json();
}

// --- Sandbox ---
export async function createSandbox() {
  const res = await apiFetch('/sandbox', { method: 'POST' });
  return res.json();
}

export async function executeSandboxCommand(sandboxId: string, command: string) {
  const res = await apiFetch(`/sandbox/${sandboxId}/exec`, {
    method: 'POST',
    body: JSON.stringify({ command }),
  });
  return res.json();
}

export async function readFile(sandboxId: string, path: string) {
  const res = await apiFetch(`/sandbox/${sandboxId}/files/read`, {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
  return res.json();
}

export async function listDir(sandboxId: string, path: string) {
  const res = await apiFetch(`/sandbox/${sandboxId}/files/readdir?path=${encodeURIComponent(path)}`);
  return res.json();
}

// --- GitHub ---
export async function fetchGitHubUser(token: string) {
  const res = await apiFetch('/github-user', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  return res.json();
}

// --- Deploy ---
export async function deployVercel(params: {
  token: string;
  projectId?: string;
  files: Record<string, string>;
}) {
  const res = await apiFetch('/vercel-deploy', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function deployNetlify(params: {
  token: string;
  siteId?: string;
  files: Record<string, string>;
}) {
  const res = await apiFetch('/netlify-deploy', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return res.json();
}

// --- System ---
export async function fetchSystemInfo() {
  const res = await apiFetch('/system');
  return res.json();
}

// --- Check API Key ---
export async function checkApiKey(provider: string, apiKey: string) {
  const res = await apiFetch('/check-env-key', {
    method: 'POST',
    body: JSON.stringify({ provider, apiKey }),
  });
  return res.json();
}
