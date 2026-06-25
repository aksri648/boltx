import { useState, useRef, useEffect } from 'react';
import { useChatStore, type ChatMessage } from '../lib/stores';
import { useSettingsStore } from '../lib/stores';
import { sendChatMessage, enhancePrompt, fetchConfiguredProviders, fetchModels, saveChat } from '../lib/api';
import { generateId, formatTime } from '../lib/utils';
import { getSystemPrompt } from '../lib/system-prompt';

export function ChatScreen() {
  const { messages, isLoading, currentChatId, addMessage, updateMessage, setLoading, setCurrentChatId, saveCurrentChat, startNewChat, chatHistory, loadChat, deleteChat } = useChatStore();
  const { provider, model, apiKeys, setProvider, setModel } = useSettingsStore();
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load providers and models on mount
  useEffect(() => {
    fetchConfiguredProviders()
      .then((data) => { if (data?.providers) setProviders(data.providers); })
      .catch(() => {});
  }, []);

  // Fetch models when provider changes
  useEffect(() => {
    if (provider) {
      fetchModels(provider)
        .then((data) => {
          if (Array.isArray(data)) {
            setModels(data.map((m: any) => m.name || m.id || String(m)));
          } else if (data?.models) {
            setModels(data.models.map((m: any) => m.name || m.id || String(m)));
          }
        })
        .catch(() => setModels([]));
    }
  }, [provider]);

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

    // Clear textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // For a new chat, create the MongoDB entry first so the system prompt is stored
      // before the backend processes the first message
      let activeChatId = currentChatId;
      if (!activeChatId) {
        activeChatId = `chat-${Date.now()}`;
        await saveChat({
          chatId: activeChatId,
          title: userMsg.content.slice(0, 50),
          messages: [],
          systemPrompt: getSystemPrompt(),
        });
        // Update store so saveCurrentChat doesn't create a duplicate
        setCurrentChatId(activeChatId);
      }

      const res = await sendChatMessage({
        message: userMsg.content,
        chatId: activeChatId,
        provider,
        model,
        apiKeys,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        updateMessage(assistantMsg.id, `Error: ${err.error || 'Failed to get response'}`);
        setLoading(false);
        return;
      }

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content || parsed.text || '';
                if (text) {
                  fullContent += text;
                  updateMessage(assistantMsg.id, fullContent);
                }
              } catch {
                // Plain text response
                fullContent += data;
                updateMessage(assistantMsg.id, fullContent);
              }
            }
          }
        }
      }

      if (!fullContent) {
        // Non-streaming response
        const data = await res.json().catch(() => null);
        if (data?.choices?.[0]?.message?.content) {
          updateMessage(assistantMsg.id, data.choices[0].message.content);
        } else if (data?.message) {
          updateMessage(assistantMsg.id, data.message);
        } else {
          updateMessage(assistantMsg.id, 'No response received.');
        }
      }

      saveCurrentChat();
    } catch (err: any) {
      updateMessage(assistantMsg.id, `Error: ${err.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!input.trim()) return;
    try {
      const data = await enhancePrompt(input);
      if (data?.enhancedPrompt) setInput(data.enhancedPrompt);
    } catch { /* ignore */ }
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
      <div className="flex flex-col h-full bg-[var(--bolt-bg)]">
        <div className="safe-top flex items-center justify-between p-4 border-b border-[var(--bolt-border)]">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <button onClick={() => setShowHistory(false)} className="text-[var(--bolt-text-muted)] text-sm px-3 py-1">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatHistory.length === 0 && (
            <p className="text-[var(--bolt-text-muted)] text-center mt-8 text-sm">No previous chats</p>
          )}
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center justify-between px-4 py-3 border-b border-[var(--bolt-border)] active:bg-[var(--bolt-bg-3)]"
            >
              <button
                onClick={() => { loadChat(chat.id); setShowHistory(false); }}
                className="flex-1 text-left"
              >
                <p className="text-sm font-medium truncate">{chat.title}</p>
                <p className="text-xs text-[var(--bolt-text-muted)]">{formatTime(chat.timestamp)}</p>
              </button>
              <button
                onClick={() => deleteChat(chat.id)}
                className="text-red-400 text-xs px-2 py-1"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3 bg-[var(--bolt-bg-2)] border-b border-[var(--bolt-border)] shrink-0">
        <button onClick={startNewChat} className="text-xl">✨</button>
        <div className="flex-1 mx-3 space-y-1">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-[var(--bolt-bg-3)] text-[var(--bolt-text)] text-xs rounded px-2 py-1 border border-[var(--bolt-border)] w-full"
          >
            {providers.length > 0 ? (
              providers.map((p: any) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))
            ) : (
              <>
                <option value="Anthropic">Anthropic</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Google">Google</option>
                <option value="Groq">Groq</option>
              </>
            )}
          </select>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-[var(--bolt-bg-3)] text-[var(--bolt-text)] text-[10px] rounded px-2 py-0.5 border border-[var(--bolt-border)] w-full truncate"
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
        <button onClick={() => setShowHistory(true)} className="text-xl">📜</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <span className="text-4xl mb-4">💬</span>
            <p className="text-[var(--bolt-text-muted)] text-sm">
              Start a conversation with bolt.diy AI assistant
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-in-up ${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}
          >
            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--bolt-accent)] text-white ml-auto'
                  : 'bg-[var(--bolt-bg-2)] text-[var(--bolt-text)]'
              }`}
            >
              {msg.isStreaming && !msg.content && (
                <span className="inline-block w-2 h-4 bg-[var(--bolt-accent)] animate-pulse rounded" />
              )}
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
            <p className={`text-[10px] text-[var(--bolt-text-muted)] mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
              {formatTime(msg.timestamp)}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="safe-bottom bg-[var(--bolt-bg-2)] border-t border-[var(--bolt-border)] px-3 py-2 shrink-0">
        <div className="flex items-end gap-2">
          <button onClick={handleEnhance} className="text-lg p-2 shrink-0" title="Enhance prompt">✨</button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-[var(--bolt-bg-3)] text-[var(--bolt-text)] text-sm rounded-xl px-4 py-2.5 resize-none outline-none border border-[var(--bolt-border)] focus:border-[var(--bolt-accent)] transition-colors"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-[var(--bolt-accent)] text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          >
            {isLoading ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <span className="text-lg">↑</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
