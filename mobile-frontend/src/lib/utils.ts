import { Capacitor } from '@capacitor/core';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getLanguageFromExt(ext: string): string {
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    html: 'html', css: 'css', scss: 'scss', json: 'json', md: 'markdown',
    yaml: 'yaml', yml: 'yaml', sh: 'bash', bash: 'bash', zsh: 'bash',
    sql: 'sql', xml: 'xml', php: 'php', c: 'c', cpp: 'cpp', h: 'c',
  };
  return map[ext.toLowerCase()] || 'text';
}

export function getFileIcon(name: string): string {
  const ext = name.split('.').pop() || '';
  const map: Record<string, string> = {
    ts: '📄', tsx: '📄', js: '📜', jsx: '📜',
    py: '🐍', rb: '💎', go: '🐹', rs: '🦀', java: '☕',
    html: '🌐', css: '🎨', scss: '🎨', json: '📋', md: '📝',
    yaml: '⚙️', yml: '⚙️', sh: '⚙️', sql: '🗄️',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', svg: '🖼️', ico: '🖼️',
    pdf: '📕', zip: '📦',
  };
  return map[ext.toLowerCase()] || '📄';
}
