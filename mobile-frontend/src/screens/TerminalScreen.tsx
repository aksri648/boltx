import { useState, useRef, useEffect } from 'react';
import { useFilesStore } from '../lib/stores';
import { executeSandboxCommand, createSandbox } from '../lib/api';

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
  }, []);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [lines]);

  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines((prev) => [...prev, {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: Date.now(),
    }]);
  };

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
      if (data?.stdout) addLine('output', data.stdout);
      if (data?.stderr) addLine('error', data.stderr);
      if (!data?.stdout && !data?.stderr) addLine('output', '(no output)');
    } catch (err: any) {
      addLine('error', `Error: ${err.message || 'Command failed'}`);
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3 bg-[var(--bolt-bg-2)] border-b border-[var(--bolt-border)] shrink-0">
        <h2 className="text-lg font-semibold">Terminal</h2>
        <span className={`text-xs px-2 py-1 rounded ${sandboxId ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {sandboxId ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 bg-black/30">
        {lines.map((line) => (
          <div key={line.id} className={`whitespace-pre-wrap break-all ${
            line.type === 'command' ? 'text-[var(--bolt-accent)] font-bold' :
            line.type === 'error' ? 'text-red-400' :
            'text-[var(--bolt-text)]'
          }`}>
            {line.content}
          </div>
        ))}
        {isExecuting && (
          <div className="text-[var(--bolt-accent)] animate-pulse">Executing...</div>
        )}
      </div>

      {/* Input */}
      <div className="safe-bottom bg-[var(--bolt-bg-2)] border-t border-[var(--bolt-border)] px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[var(--bolt-accent)] font-mono text-sm">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sandboxId ? 'Enter command...' : 'Connecting to sandbox...'}
            disabled={!sandboxId || isExecuting}
            className="flex-1 bg-transparent text-[var(--bolt-text)] text-sm font-mono outline-none placeholder:text-[var(--bolt-text-muted)]"
          />
          <button
            onClick={handleExecute}
            disabled={!input.trim() || isExecuting || !sandboxId}
            className="bg-[var(--bolt-accent)] text-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 disabled:opacity-40 text-sm"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
