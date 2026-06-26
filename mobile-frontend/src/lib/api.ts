import type { StoredChat } from './types';

const BACKEND_URL_KEY = 'bolt-mobile-backend-url';
const FETCH_TIMEOUT_MS = 30_000;

function getBackendUrl(): string {
  const stored = localStorage.getItem(BACKEND_URL_KEY);
  return stored || 'http://localhost:3001';
}

export function setBackendUrl(url: string) {
  try {
    localStorage.setItem(BACKEND_URL_KEY, url.replace(/\/+$/, ''));
  } catch {
    // Quota exceeded — silently fail
  }
}

export function getApiBase(): string {
  return getBackendUrl() + '/api';
}

/** Safely parse JSON from a response, handling non-JSON bodies gracefully */
async function safeJsonParse(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expected JSON response but got: ${contentType || 'unknown'} (${text.slice(0, 200)})`);
  }
  return res.json();
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiBase() + path;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${FETCH_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- Chat / LLM ---
export async function sendChatMessage(params: {
  message: string;
  chatId?: string;
  provider?: string;
  model?: string;
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, { baseUrl?: string }>;
}): Promise<Response> {
  return apiFetch('/llmcall', {
    method: 'POST',
    body: JSON.stringify({
      message: params.message,
      chatId: params.chatId,
      provider: params.provider || 'Anthropic',
      model: params.model || 'claude-3-5-sonnet-latest',
      apiKeys: params.apiKeys || {},
      providerSettings: params.providerSettings || {},
    }),
  });
}

// --- Models ---
export async function fetchModels(providerName?: string): Promise<unknown> {
  const res = providerName
    ? await apiFetch(`/models/${encodeURIComponent(providerName)}`)
    : await apiFetch('/models');
  return safeJsonParse(res);
}

export async function fetchConfiguredProviders(): Promise<{ providers?: import('./types').ProviderInfo[] }> {
  const res = await apiFetch('/configured-providers');
  return safeJsonParse(res) as Promise<{ providers?: import('./types').ProviderInfo[] }>;
}

// --- Config ---
export async function fetchConfig(): Promise<unknown> {
  const res = await apiFetch('/config');
  return safeJsonParse(res);
}

// --- Prompt Enhancement ---
/**
 * Enhance a prompt via the backend SSE streaming endpoint.
 * Reads the SSE stream and returns the concatenated text.
 */
export async function enhancePrompt(
  prompt: string,
  provider?: string,
  model?: string,
  apiKeys?: Record<string, string>,
): Promise<{ enhancedPrompt?: string }> {
  const res = await apiFetch('/enhancer', {
    method: 'POST',
    body: JSON.stringify({ prompt, provider, model, apiKeys }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Enhancement failed' })) as { error?: string };
    throw new Error(err.error || 'Enhancement failed');
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as { text?: string };
            if (parsed.text) fullText += parsed.text;
          } catch {
            // Not JSON, append raw text
            fullText += data;
          }
        }
      }
    }
  }

  return { enhancedPrompt: fullText || undefined };
}

// --- Web Search ---
export async function webSearch(query: string): Promise<unknown> {
  const res = await apiFetch('/web-search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
  return safeJsonParse(res);
}

// --- Sandbox ---
export async function createSandbox(): Promise<{ id?: string }> {
  const res = await apiFetch('/sandbox', { method: 'POST' });
  return safeJsonParse(res) as Promise<{ id?: string }>;
}

export async function executeSandboxCommand(sandboxId: string, command: string): Promise<{ result?: string; exitCode?: number }> {
  const res = await apiFetch(`/sandbox/${sandboxId}/exec`, {
    method: 'POST',
    body: JSON.stringify({ command }),
  });
  return safeJsonParse(res) as Promise<{ result?: string; exitCode?: number }>;
}

export async function readFile(sandboxId: string, path: string): Promise<{ content?: string }> {
  const res = await apiFetch(`/sandbox/${sandboxId}/files/read`, {
    method: 'POST',
    body: JSON.stringify({ filePath: path }),
  });
  return safeJsonParse(res) as Promise<{ content?: string }>;
}

export async function listDir(sandboxId: string, path: string): Promise<{ contents?: Array<{ name: string; path: string; type: string }> }> {
  const res = await apiFetch(`/sandbox/${sandboxId}/files/readdir?path=${encodeURIComponent(path)}`);
  return safeJsonParse(res) as Promise<{ contents?: Array<{ name: string; path: string; type: string }> }>;
}

// --- GitHub ---
export async function fetchGitHubUser(token: string): Promise<unknown> {
  const res = await apiFetch('/github/user', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return safeJsonParse(res);
}

// --- Deploy ---
interface DeployResult {
  url?: string;
  error?: string;
}

export async function deployVercel(params: {
  token: string;
  projectName?: string;
  files: Record<string, string>;
  framework?: string;
}): Promise<DeployResult> {
  const res = await apiFetch('/vercel/deploy', {
    method: 'POST',
    body: JSON.stringify({
      token: params.token,
      projectName: params.projectName || 'bolt-mobile-deploy',
      files: params.files,
      framework: params.framework || 'vite',
    }),
  });
  return safeJsonParse(res) as Promise<DeployResult>;
}

export async function deployNetlify(params: {
  token: string;
  siteName?: string;
  files: Record<string, string>;
}): Promise<DeployResult> {
  const res = await apiFetch('/netlify/deploy', {
    method: 'POST',
    body: JSON.stringify({
      token: params.token,
      siteName: params.siteName || 'bolt-mobile-deploy',
      files: params.files,
    }),
  });
  return safeJsonParse(res) as Promise<DeployResult>;
}

// --- Chat Storage (MongoDB persistence) ---
export async function listChats(): Promise<StoredChat[]> {
  const res = await apiFetch('/chat-storage');
  const data = await safeJsonParse(res);
  return Array.isArray(data) ? data : [];
}

export async function getChat(chatId: string): Promise<{ chatId: string; title: string; messages: Array<{ id: string; role: string; content: string; timestamp?: number }>; systemPrompt?: string } | null> {
  const res = await apiFetch(`/chat-storage/${encodeURIComponent(chatId)}`);
  if (res.status === 404) return null;
  return safeJsonParse(res) as Promise<{ chatId: string; title: string; messages: Array<{ id: string; role: string; content: string; timestamp?: number }>; systemPrompt?: string }>;
}

export async function saveChat(chat: {
  chatId: string;
  title: string;
  messages: Array<{ id: string; role: string; content: string; timestamp?: number }>;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}): Promise<unknown> {
  const res = await apiFetch(`/chat-storage/${encodeURIComponent(chat.chatId)}`, {
    method: 'PUT',
    body: JSON.stringify(chat),
  });
  return safeJsonParse(res);
}

export async function deleteChatStorage(chatId: string): Promise<unknown> {
  const res = await apiFetch(`/chat-storage/${encodeURIComponent(chatId)}`, {
    method: 'DELETE',
  });
  return safeJsonParse(res);
}

export async function appendMessages(chatId: string, messages: Array<{ id: string; role: string; content: string; timestamp?: number }>): Promise<unknown> {
  const res = await apiFetch(`/chat-storage/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
  return safeJsonParse(res);
}

// --- System ---
export async function fetchSystemInfo(): Promise<unknown> {
  const res = await apiFetch('/system');
  return safeJsonParse(res);
}

// --- Check API Key ---
export async function checkApiKey(provider: string): Promise<{ configured?: boolean }> {
  const res = await apiFetch('/check-env-key', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  });
  return safeJsonParse(res) as Promise<{ configured?: boolean }>;
}
