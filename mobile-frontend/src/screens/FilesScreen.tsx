import { useState, useEffect, useCallback } from 'react';
import { useFilesStore } from '../lib/stores';
import { listDir, readFile, createSandbox } from '../lib/api';
import { cn } from '../lib/utils';
import type { FileNode } from '../lib/types';
import {
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  FileImage,
  FileArchive,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  FolderGit2,
  AlertCircle,
} from 'lucide-react';

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconClass = 'w-4 h-4';
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return <FileCode className={cn(iconClass, 'text-yellow-400')} />;
    case 'json':
      return <FileJson className={cn(iconClass, 'text-yellow-300')} />;
    case 'md':
      return <FileText className={cn(iconClass, 'text-blue-400')} />;
    case 'css':
    case 'scss':
      return <FileCode className={cn(iconClass, 'text-purple-400')} />;
    case 'html':
      return <FileCode className={cn(iconClass, 'text-orange-400')} />;
    case 'py':
      return <FileCode className={cn(iconClass, 'text-green-400')} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'ico':
    case 'gif':
      return <FileImage className={cn(iconClass, 'text-pink-400')} />;
    case 'zip':
    case 'tar':
    case 'gz':
      return <FileArchive className={cn(iconClass, 'text-gray-400')} />;
    default:
      return <File className={cn(iconClass, 'text-muted-foreground')} />;
  }
}

export function FilesScreen() {
  const { files, setFiles, selectedFile, fileContent, selectFile, clearSelection, sandboxId, setSandboxId } = useFilesStore();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDir = useCallback(async (path: string, sid: string) => {
    try {
      setLoading(true);
      const data = await listDir(sid, path);
      if (data?.contents) {
        const nodes: FileNode[] = data.contents.map((f: { name: string; path?: string; type: string }) => ({
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
  }, [setFiles]);

  // Create sandbox on mount if needed (reuse existing)
  useEffect(() => {
    if (!sandboxId) {
      createSandbox()
        .then((data) => {
          if (data?.id) {
            setSandboxId(data.id);
            setError(null);
            loadDir('/', data.id);
          }
        })
        .catch(() => setError('Failed to connect to sandbox'));
    }
  }, [sandboxId, setSandboxId, loadDir]);

  // Load root directory when sandbox becomes available
  useEffect(() => {
    if (sandboxId) loadDir('/', sandboxId);
  }, [sandboxId, loadDir]);

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
      <div className="flex flex-col h-full bg-background">
        <div className="safe-top flex items-center gap-2 px-4 py-3 bg-surface/80 border-b border-border backdrop-blur-xl shrink-0">
          <button
            onClick={clearSelection}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground active:bg-accent transition-colors min-h-0 min-w-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedFile.split('/').pop()}</p>
            <p className="text-[10px] text-muted-foreground truncate">{selectedFile}</p>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-mono bg-surface rounded-xl p-4 border border-border">
            <code>{fileContent}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3 bg-surface/80 border-b border-border backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Files</h2>
        </div>
        <button
          onClick={() => sandboxId && loadDir('/', sandboxId)}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-muted-foreground active:bg-accent transition-colors min-h-0 min-w-0"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border-b border-destructive/20">
          <AlertCircle className="w-4 h-4 text-error shrink-0" />
          <p className="text-error text-xs">{error}</p>
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading && files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Loader2 className="w-6 h-6 mb-2 animate-spin" />
            <p className="text-sm">Loading files...</p>
          </div>
        )}
        <div className="space-y-0.5">
          {files.map((node) => (
            <FileItem key={node.path} node={node} depth={0} expandedDirs={expandedDirs} onTap={handleFileTap} />
          ))}
        </div>
        {!loading && files.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <FolderOpen className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">No files found</p>
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

  return (
    <button
      onClick={() => onTap(node)}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-lg active:bg-accent transition-colors min-h-0 min-w-0"
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      {node.type === 'directory' ? (
        isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )
      ) : (
        <div className="w-3.5 shrink-0" />
      )}

      {node.type === 'directory' ? (
        <FolderOpen className="w-4 h-4 text-primary shrink-0" />
      ) : (
        getFileIcon(node.name)
      )}

      <span className="text-sm text-foreground truncate">{node.name}</span>
    </button>
  );
}
