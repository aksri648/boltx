import { useState, useRef, useEffect, useCallback } from 'react';
import { useFilesStore } from '../lib/stores';
import { executeSandboxCommand, createSandbox } from '../lib/api';
import { cn } from '../lib/utils';
import {
  Terminal,
  Send,
  Loader2,
  Wifi,
  WifiOff,
  Trash2,
} from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: number;
}

export function TerminalScreen() {
  const { sandboxId, setSandboxId } = useFilesStore();
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '0', type: 'output', content: 'bolt.diy mobile terminal\nType commands below. Connect to a sandbox first.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLines((prev) => [...prev, {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: Date.now(),
    }]);
  }, []);

  // Create sandbox on mount if needed (reuse existing)
  useEffect(() => {
    if (!sandboxId) {
      createSandbox()
        .then((data) => {
          if (data?.id) {
            setSandboxId(data.id);
            addLine('output', `Sandbox connected: ${data.id.slice(0, 8)}...`);
          }
        })
        .catch(() => addLine('error', 'Failed to connect to sandbox'));
    }
  }, [sandboxId, setSandboxId, addLine]);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [lines]);

  const handleExecute = async () => {
    if (!input.trim() || isExecuting || !sandboxId) return;

    const cmd = input.trim();
    addLine('command', `$ ${cmd}`);
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput('');
    setIsExecuting(true);

    try {
      const data = await executeSandboxCommand(sandboxId, cmd);
      const output = data?.result || '';
      if (output) {
        addLine('output', output);
      } else {
        addLine('output', '(no output)');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Command failed';
      addLine('error', `Error: ${message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const clearTerminal = () => {
    setLines([{ id: Date.now().toString(), type: 'output', content: 'Terminal cleared.', timestamp: Date.now() }]);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3 bg-surface/80 border-b border-border backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Terminal</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearTerminal}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground active:bg-accent transition-colors min-h-0 min-w-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium',
            sandboxId
              ? 'bg-success/15 text-success border border-success/20'
              : 'bg-error/15 text-error border border-error/20'
          )}>
            {sandboxId ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {sandboxId ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 bg-background">
        {lines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'whitespace-pre-wrap break-all leading-relaxed',
              line.type === 'command' ? 'text-primary font-bold' :
              line.type === 'error' ? 'text-error' :
              'text-foreground/80'
            )}
          >
            {line.type === 'command' && (
              <span className="text-primary/60 mr-1">❯</span>
            )}
            {line.content}
          </div>
        ))}
        {isExecuting && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="animate-pulse">Executing...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="safe-bottom bg-surface/80 border-t border-border px-3 py-2.5 shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1 focus-within:ring-1 focus-within:ring-ring transition-all">
          <span className="text-primary font-mono text-sm font-bold">❯</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sandboxId ? 'Enter command...' : 'Connecting to sandbox...'}
            disabled={!sandboxId || isExecuting}
            className="flex-1 bg-transparent text-foreground text-sm font-mono outline-none placeholder:text-muted-foreground min-h-0"
          />
          <button
            onClick={handleExecute}
            disabled={!input.trim() || isExecuting || !sandboxId}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg transition-all min-h-0 min-w-0',
              input.trim() && !isExecuting && sandboxId
                ? 'bg-primary text-primary-foreground active:scale-95'
                : 'text-muted-foreground'
            )}
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
