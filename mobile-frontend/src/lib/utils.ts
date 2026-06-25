import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Capacitor } from '@capacitor/core';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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


