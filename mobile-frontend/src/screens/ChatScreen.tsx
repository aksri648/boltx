import { useState, useRef, useEffect } from 'react';
import { useChatStore, useSettingsStore } from '../lib/stores';
import type { ChatMessage } from '../lib/types';
import { sendChatMessage, enhancePrompt, saveChat } from '../lib/api';
import { generateId, formatTime, cn } from '../lib/utils';
import { getSystemPrompt } from '../lib/system-prompt';
import { MarkdownContent } from '../components/MarkdownContent';
import { useProviders } from '../hooks/useProviders';
import {
  Sparkles,
  ArrowUp,
  History,
  Bot,
  User,
  X,
  Loader2,
  MessageSquarePlus,
  Trash2,
  Clock,
} from 'lucide-react';

export function ChatScreen() {
  const {
    messages,
    isLoading,
    currentChatId,
    addMessage,
    updateMessage,
    setLoading,
    setCurrentChatId,
    saveCurrentChat,
    startNewChat,
    chatHistory,
    loadChat,
    deleteChat,
    loadHistory,
  } = useChatStore();
  const { provider, model, apiKeys, setProvider, setModel, openAILikeBaseUrl } = useSettingsStore();
  const { providers, models } = useProviders(provider);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    addMessage(userMsg);
    addMessage(assistantMsg);
    setInput('');
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      let activeChatId = currentChatId;
      if (!activeChatId) {
        activeChatId = `chat-${Date.now()}`;
        await saveChat({
          chatId: activeChatId,
          title: userMsg.content.slice(0, 50),
          messages: [],
          systemPrompt: getSystemPrompt(),
        });
        setCurrentChatId(activeChatId);
      }

      const res = await sendChatMessage({
        message: userMsg.content,
        chatId: activeChatId,
        provider,
        model,
        apiKeys,
        providerSettings: provider === 'OpenAILike'
          ? { OpenAILike: { baseUrl: openAILikeBaseUrl } }
          : undefined,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
        updateMessage(assistantMsg.id, `Error: ${err.error || 'Failed to get response'}`);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

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
                const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }>; text?: string };
                const text = parsed.choices?.[0]?.delta?.content || parsed.text || '';
                if (text) {
                  fullContent += text;
                  updateMessage(assistantMsg.id, fullContent);
                }
              } catch {
                // If not JSON, treat as raw text
                if (data.trim()) {
                  fullContent += data;
                  updateMessage(assistantMsg.id, fullContent);
                }
              }
            }
          }
        }
      }

      // If no streaming content was received and body hasn't been consumed, try plain text
      if (!fullContent && !res.bodyUsed) {
        try {
          const textBody = await res.text();
          if (textBody) {
            try {
              const parsed = JSON.parse(textBody) as { content?: string; error?: string };
              updateMessage(assistantMsg.id, parsed.content || parsed.error || 'No response received.');
            } catch {
              // Not JSON, show raw text
              updateMessage(assistantMsg.id, textBody || 'No response received.');
            }
          } else {
            updateMessage(assistantMsg.id, 'No response received.');
          }
        } catch {
          updateMessage(assistantMsg.id, 'No response received.');
        }
      } else if (!fullContent) {
        updateMessage(assistantMsg.id, 'No response received.');
      }

      saveCurrentChat();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      updateMessage(assistantMsg.id, `Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!input.trim()) return;
    setEnhanceError(null);
    try {
      const data = await enhancePrompt(input, provider, model, apiKeys);
      if (data?.enhancedPrompt) {
        setInput(data.enhancedPrompt);
      } else {
        setEnhanceError('No enhanced prompt returned');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Enhancement failed';
      setEnhanceError(message);
      setTimeout(() => setEnhanceError(null), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Chat history sidebar
  if (showHistory) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="safe-top flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-foreground">Chat History</h2>
          <button
            onClick={() => setShowHistory(false)}
            className="flex items-center gap-1 text-muted-foreground text-sm px-3 py-1.5 rounded-lg active:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-12 text-muted-foreground">
              <MessageSquarePlus className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No previous chats</p>
            </div>
          )}
          <div className="p-2 space-y-1">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-accent transition-colors group"
              >
                <button
                  onClick={() => { loadChat(chat.id); setShowHistory(false); }}
                  className="flex-1 text-left min-h-0 min-w-0"
                >
                  <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{formatTime(chat.timestamp)}</p>
                  </div>
                </button>
                <button
                  onClick={() => deleteChat(chat.id)}
                  className="text-muted-foreground hover:text-error p-2 rounded-lg active:bg-destructive/20 transition-colors opacity-60 group-hover:opacity-100 min-h-0 min-w-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3 bg-surface/80 border-b border-border backdrop-blur-xl shrink-0">
        <button
          onClick={startNewChat}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary active:bg-primary/20 transition-colors min-h-0 min-w-0"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>

        <div className="flex-1 mx-3 space-y-1.5">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-surface text-foreground text-xs rounded-lg px-3 py-1.5 border border-border w-full outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
          >
            {providers.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-surface text-muted-foreground text-[10px] rounded-lg px-3 py-1 border border-border w-full truncate outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
          >
            {models.length > 0 ? (
              models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))
            ) : (
              <option value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest</option>
            )}
          </select>
        </div>

        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-muted-foreground active:bg-accent transition-colors min-h-0 min-w-0"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse-glow">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium text-base mb-1">How can I help?</p>
            <p className="text-muted-foreground text-sm">
              Start a conversation with bolt.diy AI assistant
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'animate-fade-in-up flex gap-3',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1',
              msg.role === 'user'
                ? 'bg-primary/20 text-primary'
                : 'bg-secondary text-muted-foreground'
            )}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message bubble */}
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-md'
                : 'bg-surface border border-border rounded-tl-md'
            )}>
              {msg.isStreaming && !msg.content && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              {msg.role === 'assistant' ? (
                <MarkdownContent content={msg.content} />
              ) : (
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="safe-bottom bg-surface/80 border-t border-border px-3 py-2.5 shrink-0 backdrop-blur-xl">
        {enhanceError && (
          <div className="mb-2 px-3 py-1.5 bg-error/10 border border-error/20 rounded-lg text-error text-xs animate-fade-in-up">
            {enhanceError}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={handleEnhance}
            disabled={isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary text-muted-foreground active:bg-accent transition-colors shrink-0 min-h-0 min-w-0"
            title="Enhance prompt"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-surface border border-border text-foreground text-sm rounded-xl px-4 py-2.5 resize-none outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
            style={{ maxHeight: '120px', minHeight: '40px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'rounded-xl w-10 h-10 flex items-center justify-center shrink-0 transition-all min-h-0 min-w-0',
              input.trim() && !isLoading
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-95'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
