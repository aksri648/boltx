/** A single chat message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

/** Represents a node in the file tree */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

/** Represents an AI provider returned from the backend */
export interface ProviderInfo {
  name: string;
  config?: {
    baseUrlKey?: string;
    apiTokenKey?: string;
    baseUrl?: string;
  };
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
  icon?: string;
}

/** Represents a chat entry in history (without full message payload) */
export interface ChatHistoryEntry {
  id: string;
  title: string;
  timestamp: number;
  lastMessage?: { role: string; content: string } | null;
}

/** Backend response for a stored chat */
export interface StoredChat {
  chatId: string;
  title: string;
  updatedAt: string;
  lastMessage?: { role: string; content: string } | null;
}

/** Generic API error shape */
export interface ApiError {
  error?: string;
  message?: string;
}

/** Model info returned from backend */
export interface ModelInfo {
  name?: string;
  id?: string;
  label?: string;
}
