import { useState, useEffect } from 'react';
import { useFilesStore } from '../lib/stores';
import { listDir, readFile, createSandbox } from '../lib/api';
import { getFileIcon } from '../lib/utils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export function FilesScreen() {
  const { files, setFiles, selectedFile, fileContent, selectFile, clearSelection, sandboxId, setSandboxId } = useFilesStore();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create sandbox on mount if needed
  useEffect(() => {
    if (!sandboxId) {
      createSandbox()
        .then((data) => { if (data?.id) setSandboxId(data.id); })
        .catch(() => setError('Failed to connect to sandbox'));
    }
  }, []);

  // Load root directory
  useEffect(() => {
    if (sandboxId) loadDir('/');
  }, [sandboxId]);

  const loadDir = async (path: string) => {
    if (!sandboxId) return;
    try {
      setLoading(true);
      const data = await listDir(sandboxId, path);
      if (data?.files) {
        const nodes: FileNode[] = data.files.map((f: any) => ({
          name: f.name,
          path: f.path || `${path}${path.endsWith('/') ? '' : '/'}${f.name}`,
          type: f.type === 'directory' ? 'directory' : 'file',
        }));
        if (path === '/') setFiles(nodes);
      }
    } catch {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileTap = async (node: FileNode) => {
    if (node.type === 'directory') {
      const newExpanded = new Set(expandedDirs);
      if (newExpanded.has(node.path)) {
        newExpanded.delete(node.path);
      } else {
        newExpanded.add(node.path);
      }
      setExpandedDirs(newExpanded);
    } else {
      if (!sandboxId) return;
      try {
        const data = await readFile(sandboxId, node.path);
        selectFile(node.path, data?.content || '');
      } catch {
        setError('Failed to read file');
      }
    }
  };

  // Code viewer
  if (selectedFile) {
    return (
      <div className="flex flex-col h-full">
        <div className="safe-top flex items-center gap-2 px-4 py-3 bg-[var(--bolt-bg-2)] border-b border-[var(--bolt-border)] shrink-0">
          <button onClick={clearSelection} className="text-[var(--bolt-accent)] text-sm">← Back</button>
          <span className="text-sm font-medium truncate">{selectedFile.split('/').pop()}</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs text-[var(--bolt-text)] leading-relaxed whitespace-pre-wrap">
            <code>{fileContent}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3 bg-[var(--bolt-bg-2)] border-b border-[var(--bolt-border)] shrink-0">
        <h2 className="text-lg font-semibold">Files</h2>
        <button onClick={() => loadDir('/')} className="text-xl">🔄</button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs">{error}</div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        {loading && files.length === 0 && (
          <div className="flex items-center justify-center h-32 text-[var(--bolt-text-muted)] text-sm">
            Loading files...
          </div>
        )}
        {files.map((node) => (
          <FileItem key={node.path} node={node} depth={0} expandedDirs={expandedDirs} onTap={handleFileTap} />
        ))}
        {!loading && files.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--bolt-text-muted)] text-sm">
            <span className="text-2xl mb-2">📂</span>
            No files found
          </div>
        )}
      </div>
    </div>
  );
}

function FileItem({ node, depth, expandedDirs, onTap }: {
  node: FileNode;
  depth: number;
  expandedDirs: Set<string>;
  onTap: (node: FileNode) => void;
}) {
  const isExpanded = expandedDirs.has(node.path);
  const icon = node.type === 'directory' ? (isExpanded ? '📂' : '📁') : getFileIcon(node.name);

  return (
    <>
      <button
        onClick={() => onTap(node)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left active:bg-[var(--bolt-bg-3)] transition-colors border-b border-[var(--bolt-border)]/30"
        style={{ paddingLeft: `${16 + depth * 20}px` }}
      >
        <span className="text-base shrink-0">{icon}</span>
        <span className="text-sm truncate">{node.name}</span>
      </button>
    </>
  );
}
