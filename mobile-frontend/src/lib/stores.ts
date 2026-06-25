import { create } from 'zustand';
import {
  listChats,
  getChat,
  saveChat,
  deleteChatStorage,
} from './api';
import { getSystemPrompt } from './system-prompt';
import type { ChatMessage, ChatHistoryEntry } from './types';

// Re-export ChatMessage for backwards compatibility
export type { ChatMessage } from './types';

// --- Settings Store ---
interface SettingsState {
  backendUrl: string;
  provider: string;
  model: string;
  apiKeys: Record<string, string>;
  openAILikeBaseUrl: string;
  setBackendUrl: (url: string) => void;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setApiKey: (provider: string, key: string) => void;
  setOpenAILikeBaseUrl: (url: string) => void;
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota exceeded — silently fail
  }
}

function safeLocalStorageGet(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function safeJsonParse(str: string | null, fallback: Record<string, string>): Record<string, string> {
  if (!str) return fallback;
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  backendUrl: safeLocalStorageGet('bolt-mobile-backend-url', 'http://localhost:3001'),
  provider: safeLocalStorageGet('bolt-mobile-provider', 'Anthropic'),
  model: safeLocalStorageGet('bolt-mobile-model', 'claude-3-5-sonnet-latest'),
  apiKeys: safeJsonParse(localStorage.getItem('bolt-mobile-api-keys'), {}),
  openAILikeBaseUrl: safeLocalStorageGet('bolt-mobile-openai-like-base-url', 'http://localhost:8080/v1'),
  setBackendUrl: (url) => {
    safeLocalStorageSet('bolt-mobile-backend-url', url);
    set({ backendUrl: url });
  },
  setProvider: (provider) => {
    safeLocalStorageSet('bolt-mobile-provider', provider);
    set({ provider });
  },
  setModel: (model) => {
    safeLocalStorageSet('bolt-mobile-model', model);
    set({ model });
  },
  setApiKey: (provider, key) =>
    set((state) => {
      const apiKeys = { ...state.apiKeys, [provider]: key };
      safeLocalStorageSet('bolt-mobile-api-keys', JSON.stringify(apiKeys));
      return { apiKeys };
    }),
  setOpenAILikeBaseUrl: (url) => {
    safeLocalStorageSet('bolt-mobile-openai-like-base-url', url);
    set({ openAILikeBaseUrl: url });
  },
}));

// --- Chat Store (MongoDB-backed) ---
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentChatId: string | null;
  chatHistory: ChatHistoryEntry[];
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setCurrentChatId: (id: string) => void;
  saveCurrentChat: () => void;
  loadChat: (id: string) => void;
  deleteChat: (id: string) => void;
  startNewChat: () => void;
  loadHistory: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  currentChatId: null,
  chatHistory: [],

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content, isStreaming: false } : m)),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: () => set({ messages: [] }),

  setCurrentChatId: (id) => set({ currentChatId: id }),

  loadHistory: async () => {
    try {
      const chats = await listChats();
      const history: ChatHistoryEntry[] = chats.map((c) => ({
        id: c.chatId,
        title: c.title || 'Untitled',
        timestamp: new Date(c.updatedAt).getTime(),
        lastMessage: c.lastMessage || null,
      }));
      set({ chatHistory: history });
    } catch (err) {
      console.error('Failed to load chat history from backend:', err);
      set({ chatHistory: [] });
    }
  },

  saveCurrentChat: async () => {
    const { messages, currentChatId } = get();
    if (messages.length === 0) return;

    const chatId = currentChatId || `chat-${Date.now()}`;
    const title = messages[0]?.content.slice(0, 50) || 'New Chat';

    try {
      await saveChat({
        chatId,
        title,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        systemPrompt: !currentChatId ? getSystemPrompt() : undefined,
      });
      set({ currentChatId: chatId });

      // Optimistically update history instead of re-fetching
      set((state) => {
        const existing = state.chatHistory.find((c) => c.id === chatId);
        if (existing) {
          return {
            chatHistory: state.chatHistory.map((c) =>
              c.id === chatId ? { ...c, title, timestamp: Date.now() } : c
            ),
          };
        }
        return {
          chatHistory: [{ id: chatId, title, timestamp: Date.now(), lastMessage: null }, ...state.chatHistory],
        };
      });
    } catch (err) {
      console.error('Failed to save chat to backend:', err);
    }
  },

  loadChat: async (id: string) => {
    try {
      const chat = await getChat(id);
      if (chat?.messages) {
        set({
          messages: chat.messages.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp || Date.now(),
          })),
          currentChatId: id,
        });
      }
    } catch (err) {
      console.error('Failed to load chat from backend:', err);
    }
  },

  deleteChat: async (id: string) => {
    try {
      await deleteChatStorage(id);
      set((state) => ({
        chatHistory: state.chatHistory.filter((c) => c.id !== id),
      }));
    } catch (err) {
      console.error('Failed to delete chat from backend:', err);
    }
  },

  startNewChat: () => set({ messages: [], currentChatId: null }),
}));

// --- Files Store ---
import type { FileNode } from './types';

interface FilesState {
  files: FileNode[];
  selectedFile: string | null;
  fileContent: string;
  sandboxId: string | null;
  setFiles: (files: FileNode[]) => void;
  selectFile: (path: string, content: string) => void;
  setSandboxId: (id: string) => void;
  clearSelection: () => void;
}

export const useFilesStore = create<FilesState>((set) => ({
  files: [],
  selectedFile: null,
  fileContent: '',
  sandboxId: null,
  setFiles: (files) => set({ files }),
  selectFile: (path, content) => set({ selectedFile: path, fileContent: content }),
  setSandboxId: (id) => set({ sandboxId: id }),
  clearSelection: () => set({ selectedFile: null, fileContent: '' }),
}));
