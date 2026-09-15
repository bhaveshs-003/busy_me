import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ---------------------------------------------------------------------------
// cn() — Tailwind-merge helper
// ---------------------------------------------------------------------------
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// formatDate — formats a Date or ISO string using Intl
// ---------------------------------------------------------------------------
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', options).format(d);
}

// ---------------------------------------------------------------------------
// formatRelativeTime — "2 hours ago", "in 3 days", "just now"
// ---------------------------------------------------------------------------
export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  const now = Date.now();
  const diffMs = d.getTime() - now;
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31_536_000 },
    { unit: 'month', seconds: 2_592_000 },
    { unit: 'week', seconds: 604_800 },
    { unit: 'day', seconds: 86_400 },
    { unit: 'hour', seconds: 3_600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  if (absSec < 5) return 'just now';

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const { unit, seconds } of units) {
    if (absSec >= seconds) {
      return rtf.format(Math.round(diffSec / seconds), unit);
    }
  }

  return 'just now';
}

// ---------------------------------------------------------------------------
// formatFileSize — human-readable byte count
// ---------------------------------------------------------------------------
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// ---------------------------------------------------------------------------
// generateId — pseudo-uuid v4
// ---------------------------------------------------------------------------
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// truncate — clips string and appends ellipsis
// ---------------------------------------------------------------------------
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '…';
}

// ---------------------------------------------------------------------------
// debounce — delays fn invocation until after delay ms of quiet
// ---------------------------------------------------------------------------
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

// ---------------------------------------------------------------------------
// sleep — promise that resolves after ms milliseconds
// ---------------------------------------------------------------------------
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// simulateDelay — resolves after a random delay between min and max ms
// ---------------------------------------------------------------------------
export function simulateDelay(min = 200, max = 800): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(ms);
}

// ---------------------------------------------------------------------------
// highlightMatch — wraps query matches in <mark> tags (case-insensitive)
// ---------------------------------------------------------------------------
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// ---------------------------------------------------------------------------
// getInitials — extracts up to two initials from a display name
// ---------------------------------------------------------------------------
export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase());
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0];
  return parts[0] + parts[parts.length - 1];
}
