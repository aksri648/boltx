import { create } from 'zustand';

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

// --- Chat Store ---
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
  chatHistory: Array<{ id: string; title: string; timestamp: number; messages: ChatMessage[] }>;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  saveCurrentChat: () => void;
  loadChat: (id: string) => void;
  deleteChat: (id: string) => void;
  startNewChat: () => void;
}

function loadHistory(): ChatState['chatHistory'] {
  try {
    return JSON.parse(localStorage.getItem('bolt-mobile-chats') || '[]');
  } catch {
    return [];
  }
}

function saveHistory(history: ChatState['chatHistory']) {
  localStorage.setItem('bolt-mobile-chats', JSON.stringify(history.slice(0, 50)));
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  currentChatId: null,
  chatHistory: loadHistory(),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content, isStreaming: false } : m)),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: () => set({ messages: [] }),

  saveCurrentChat: () => {
    const { messages, currentChatId, chatHistory } = get();
    if (messages.length === 0) return;

    const id = currentChatId || Date.now().toString();
    const title = messages[0]?.content.slice(0, 50) || 'New Chat';
    const chat = { id, title, timestamp: Date.now(), messages };

    const existing = chatHistory.filter((c) => c.id !== id);
    const updated = [chat, ...existing];
    saveHistory(updated);
    set({ chatHistory: updated, currentChatId: id });
  },

  loadChat: (id) => {
    const { chatHistory } = get();
    const chat = chatHistory.find((c) => c.id === id);
    if (chat) {
      set({ messages: chat.messages, currentChatId: id });
    }
  },

  deleteChat: (id) => {
    const { chatHistory } = get();
    const updated = chatHistory.filter((c) => c.id !== id);
    saveHistory(updated);
    set({ chatHistory: updated });
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
