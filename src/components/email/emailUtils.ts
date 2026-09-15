// =============================================================================
// Shared helpers for the email surface (list, card, detail, compose)
// =============================================================================

import {
  File as FileIcon,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import type { BadgeColor } from '@/components/ui/Badge';
import type { Email, EmailAddress, EmailCategory } from '@/types/index';

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

/** Display label for an address — name when known, otherwise the local part. */
export function displayName(address: EmailAddress | null | undefined): string {
  if (!address) return 'Unknown sender';
  if (address.name?.trim()) return address.name;
  return address.email.split('@')[0].replace(/[._-]+/g, ' ');
}

/** "Priya Nair, Rachel Kim and 2 others" */
export function formatAddressList(addresses: EmailAddress[], max = 2): string {
  if (addresses.length === 0) return '—';
  const names = addresses.map(displayName);
  if (names.length <= max) {
    return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }
  const overflow = names.length - max;
  return `${names.slice(0, max).join(', ')} and ${overflow} other${overflow === 1 ? '' : 's'}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Parses "Name <a@b.com>" or a bare address into an EmailAddress. */
export function parseAddress(input: string): EmailAddress | null {
  const raw = input.trim().replace(/[,;]$/, '');
  if (!raw) return null;

  const angled = raw.match(/^(.*?)<([^>]+)>$/);
  if (angled) {
    const email = angled[2].trim();
    if (!isValidEmail(email)) return null;
    const name = angled[1].trim().replace(/^["']|["']$/g, '');
    return { name: name || null, email };
  }

  if (!isValidEmail(raw)) return null;
  return { name: null, email: raw };
}

export function sameAddress(a: EmailAddress, b: EmailAddress): boolean {
  return a.email.toLowerCase() === b.email.toLowerCase();
}

export function dedupeAddresses(addresses: EmailAddress[]): EmailAddress[] {
  const seen = new Set<string>();
  return addresses.filter((address) => {
    const key = address.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact, inbox-style relative stamp: "now", "12m", "5h", "3d", "Sep 3". */
export function formatEmailTimestamp(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';

  const diff = now - time;

  if (diff < 0) {
    // Scheduled / clock-skewed — fall back to the calendar date.
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(time);
  }
  if (diff < MINUTE) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;

  const sameYear = new Date(time).getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(time);
}

/** "Wed, Sep 9, 2026 at 4:05 PM" */
export function formatFullTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** "Sep 17" / "Sep 17, 2027" — used for chase dates. */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
}

/** Whole days between now and an ISO date; negative when overdue. */
export function daysUntil(iso: string, now: number = Date.now()): number {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.ceil((target - now) / DAY);
}

/** `<input type="date">` value for an ISO timestamp. */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * MINUTE;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** `<input type="datetime-local">` value for an ISO timestamp. */
export function toDateTimeInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * MINUTE;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Local `<input>` value back to an ISO timestamp. */
export function fromInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface CategoryMeta {
  label: string;
  color: BadgeColor;
}

export const CATEGORY_META: Record<EmailCategory, CategoryMeta> = {
  primary: { label: 'Primary', color: 'orange' },
  social: { label: 'Social', color: 'blue' },
  updates: { label: 'Updates', color: 'green' },
  promotions: { label: 'Promotions', color: 'yellow' },
  other: { label: 'Other', color: 'gray' },
};

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export interface AttachmentVisual {
  Icon: LucideIcon;
  /** Tailwind classes for the icon tile. */
  tone: string;
  /** Short type label, e.g. "PDF". */
  label: string;
}

export function attachmentVisual(mimeType: string, filename = ''): AttachmentVisual {
  const extension = filename.split('.').pop()?.toUpperCase() ?? '';

  if (mimeType === 'application/pdf') {
    return { Icon: FileText, tone: 'bg-gray-100 text-gray-500 ring-red-100', label: 'PDF' };
  }
  if (mimeType.startsWith('image/')) {
    return {
      Icon: FileImage,
      tone: 'bg-gray-100 text-gray-500 ring-purple-100',
      label: extension || 'Image',
    };
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
    return {
      Icon: FileSpreadsheet,
      tone: 'bg-gray-100 text-gray-500 ring-emerald-100',
      label: extension || 'Sheet',
    };
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return {
      Icon: Presentation,
      tone: 'bg-gray-100 text-gray-500 ring-amber-100',
      label: extension || 'Slides',
    };
  }
  if (mimeType.includes('zip') || mimeType.includes('compressed')) {
    return {
      Icon: FileArchive,
      tone: 'bg-gray-100 text-gray-600 ring-gray-100',
      label: extension || 'Archive',
    };
  }
  if (mimeType.includes('word') || mimeType.startsWith('text/')) {
    return {
      Icon: FileText,
      tone: 'bg-gray-100 text-gray-500 ring-blue-100',
      label: extension || 'Doc',
    };
  }
  return { Icon: FileIcon, tone: 'bg-gray-100 text-gray-600 ring-gray-100', label: extension || 'File' };
}

// ---------------------------------------------------------------------------
// Body rendering
//
// Mock bodies arrive as plain text (and occasionally as small HTML fragments).
// Rather than injecting HTML, both are parsed into a block model the detail
// screen renders with real components — safer and visually consistent.
// ---------------------------------------------------------------------------

export type EmailBodyBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'signature'; lines: string[] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
const QUOTED = /^\s*>\s?(.*)$/;
const HEADING = /^(?:#{1,3}\s+(.*)|([A-Z][A-Za-z0-9 /&'-]{2,48}:)\s*)$/;
const SIGNOFF = /^(best|thanks|thank you|regards|cheers|sincerely|warmly|talk soon|looking forward)[,!.\s]*$/i;

/** Strips tags from an HTML fragment, preserving paragraph breaks. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li|h[1-6])\s*>/gi, '\n\n')
    .replace(/<\s*li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The readable text of an email regardless of which body field is populated. */
export function emailBodyText(email: Pick<Email, 'bodyText' | 'bodyHtml' | 'snippet'>): string {
  if (email.bodyText?.trim()) return email.bodyText;
  if (email.bodyHtml?.trim()) return htmlToText(email.bodyHtml);
  return email.snippet;
}

export function parseEmailBody(source: string): EmailBodyBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: EmailBodyBlock[] = [];

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let signature: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list && list.items.length) blocks.push({ kind: 'list', ...list });
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) blocks.push({ kind: 'quote', lines: [...quote] });
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Everything after the sign-off is treated as the signature block.
    if (signature) {
      if (line.trim()) signature.push(line.trim());
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const quoted = line.match(QUOTED);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]);
      continue;
    }
    flushQuote();

    const bullet = line.match(BULLET);
    if (bullet) {
      flushParagraph();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1].trim());
      continue;
    }

    const ordered = line.match(ORDERED);
    if (ordered) {
      flushParagraph();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[1].trim());
      continue;
    }
    flushList();

    if (SIGNOFF.test(line.trim())) {
      flushAll();
      signature = [line.trim()];
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      flushAll();
      blocks.push({ kind: 'heading', text: (heading[1] ?? heading[2] ?? line).trim() });
      continue;
    }

    paragraph.push(line.trim());
  }

  flushAll();
  if (signature?.length) blocks.push({ kind: 'signature', lines: signature });

  return blocks;
}

const URL_PATTERN = /(https?:\/\/[^\s<>()]+)/g;

/** Splits text into plain and link segments for safe inline rendering. */
export function splitLinks(text: string): { text: string; href?: string }[] {
  const segments: { text: string; href?: string }[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ text: text.slice(lastIndex, index) });
    segments.push({ text: match[0], href: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) });
  return segments.length ? segments : [{ text }];
}

// ---------------------------------------------------------------------------
// Reply / forward scaffolding
// ---------------------------------------------------------------------------

/** "Re: …" / "Fwd: …" without stacking prefixes. */
export function replySubject(subject: string): string {
  return /^re:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`;
}

export function forwardSubject(subject: string): string {
  return /^fwd?:/i.test(subject.trim()) ? subject.trim() : `Fwd: ${subject.trim()}`;
}

/** The "> quoted" body appended under a reply or forward. */
export function quotedBody(email: Email, mode: 'reply' | 'forward'): string {
  const body = emailBodyText(email);
  const quoted = body
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');

  if (mode === 'forward') {
    const header = [
      '---------- Forwarded message ----------',
      `From: ${displayName(email.from)} <${email.from.email}>`,
      `Date: ${formatFullTimestamp(email.date)}`,
      `Subject: ${email.subject}`,
      `To: ${email.to.map((a) => a.email).join(', ') || '—'}`,
    ].join('\n');
    return `\n\n${header}\n\n${quoted}\n`;
  }

  return `\n\nOn ${formatFullTimestamp(email.date)}, ${displayName(email.from)} wrote:\n${quoted}\n`;
}

// ---------------------------------------------------------------------------
// Busy AI rephrasing — deterministic, offline "variants" for the demo
// ---------------------------------------------------------------------------

export interface RephraseVariant {
  id: string;
  label: string;
  description: string;
  text: string;
}

function sentencesOf(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Three tone variants of a draft body, picked from on the compose sheet. */
export function rephraseVariants(body: string, recipient?: string): RephraseVariant[] {
  const trimmed = body.trim();
  const greeting = recipient ? `Hi ${recipient.split(' ')[0]},` : 'Hi,';
  const sentences = sentencesOf(trimmed.replace(/^(hi|hello|hey)[^\n]*\n+/i, ''));
  const core = sentences.length ? sentences : ['Following up on the thread below.'];
  const headline = core[0];
  const rest = core.slice(1);

  const concise = [
    greeting,
    '',
    headline,
    ...(rest.length ? ['', rest.join(' ')] : []),
    '',
    'Happy to jump on a quick call if that is faster.',
    '',
    'Thanks,',
  ].join('\n');

  const warm = [
    greeting,
    '',
    `Thanks for bearing with me on this. ${headline}`,
    ...(rest.length ? ['', rest.join(' ')] : []),
    '',
    'Let me know what works best for you — happy to flex around your schedule.',
    '',
    'Best,',
  ].join('\n');

  const formal = [
    recipient ? `Dear ${recipient},` : 'Hello,',
    '',
    `I am writing to follow up on the matter below. ${headline}`,
    ...(rest.length ? ['', rest.join(' ')] : []),
    '',
    'Please let me know if you require any further detail ahead of a decision.',
    '',
    'Kind regards,',
  ].join('\n');

  return [
    {
      id: 'concise',
      label: 'Concise',
      description: 'Trims the message to the decision and the ask.',
      text: concise,
    },
    {
      id: 'warm',
      label: 'Warm',
      description: 'Keeps the detail but softens the tone.',
      text: warm,
    },
    {
      id: 'formal',
      label: 'Formal',
      description: 'Contract-ready phrasing for external stakeholders.',
      text: formal,
    },
  ];
}
