import { create } from 'zustand';
import {
  listChats,
  getChat,
  saveChat,
  deleteChatStorage,
} from './api';
import { getSystemPrompt } from './system-prompt';

// --- Settings Store ---
interface SettingsState {
  backendUrl: string;
  provider: string;
  model: string;
  apiKeys: Record<string, string>;
  setBackendUrl: (url: string) => void;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setApiKey: (provider: string, key: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  backendUrl: localStorage.getItem('bolt-mobile-backend-url') || 'http://localhost:3001',
  provider: 'Anthropic',
  model: 'claude-3-5-sonnet-latest',
  apiKeys: JSON.parse(localStorage.getItem('bolt-mobile-api-keys') || '{}'),
  setBackendUrl: (url) => {
    localStorage.setItem('bolt-mobile-backend-url', url);
    set({ backendUrl: url });
  },
  setProvider: (provider) => set({ provider }),
  setModel: (model) => set({ model }),
  setApiKey: (provider, key) =>
    set((state) => {
      const apiKeys = { ...state.apiKeys, [provider]: key };
      localStorage.setItem('bolt-mobile-api-keys', JSON.stringify(apiKeys));
      return { apiKeys };
    }),
}));

// --- Chat Store (MongoDB-backed) ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentChatId: string | null;
  chatHistory: Array<{ id: string; title: string; timestamp: number; messages: ChatMessage[]; lastMessage?: { role: string; content: string } | null }>;
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
      const history = Array.isArray(chats)
        ? chats.map((c: any) => ({
            id: c.chatId,
            title: c.title || 'Untitled',
            timestamp: new Date(c.updatedAt).getTime(),
            messages: [], // full messages loaded on demand via loadChat
            lastMessage: c.lastMessage || null,
          }))
        : [];
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

    const payload = {
      chatId,
      title,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
      // Only send systemPrompt when creating a new chat
      ...(!currentChatId && { systemPrompt: getSystemPrompt() }),
    };

    try {
      await saveChat(payload);
      set({ currentChatId: chatId });

      // Refresh chat history
      const chats = await listChats();
      const history = Array.isArray(chats)
        ? chats.map((c: any) => ({
            id: c.chatId,
            title: c.title || 'Untitled',
            timestamp: new Date(c.updatedAt).getTime(),
            messages: [],
            lastMessage: c.lastMessage || null,
          }))
        : [];
      set({ chatHistory: history });
    } catch (err) {
      console.error('Failed to save chat to backend:', err);
    }
  },

  loadChat: async (id: string) => {
    try {
      const chat = await getChat(id);
      if (chat && chat.messages) {
        set({
          messages: chat.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
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
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

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
