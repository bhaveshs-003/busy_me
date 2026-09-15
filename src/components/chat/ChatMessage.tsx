import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  FolderOpen,
  Layers,
  ListTodo,
  Mail,
  Plus,
  Target,
  User,
} from 'lucide-react';
import type {
  ChatArtifact,
  ChatArtifactType,
  ChatMessage as ChatMessageModel,
  WorkboardItemType,
} from '@/types/index';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { SuggestedActions } from './SuggestedActions';
import { WebSearchResults } from './WebSearchResults';

// =============================================================================
// ChatMessage — renders one message for every ChatMessageType
// =============================================================================

export interface ChatMessageProps {
  message: ChatMessageModel;
  /** Hide the avatar when this message continues a run from the same author. */
  showAvatar?: boolean;
  /** Ask the assistant something on the user's behalf. */
  onSendMessage?: (text: string) => void;
  /** Run a web search. */
  onWebSearch?: (query: string) => void;
  /** Open the full-height results panel for a `search-results` message. */
  onViewAllResults?: (message: ChatMessageModel) => void;
  className?: string;
}

// ── Markdown-like inline + block formatting ──────────────────────────────────

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\n]+\*)/g;

/** Renders **bold**, *italic*, `code` and [links](url) inside one line. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_PATTERN).filter((p) => p !== '');

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] text-gray-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-orange-600 underline decoration-orange-300 underline-offset-2 hover:text-orange-700"
        >
          {link[1]}
        </a>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'hr' };

function toBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, '\n').split('\n');

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    const last = blocks[blocks.length - 1];

    if (/^(-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ kind: 'hr' });
      continue;
    }

    if (trimmed === '') {
      // Blank line closes the current block.
      if (last && last.kind === 'p' && last.lines.length > 0) blocks.push({ kind: 'p', lines: [] });
      else if (last && last.kind !== 'p') blocks.push({ kind: 'p', lines: [] });
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      if (last && last.kind === 'ul') last.items.push(bullet[1]);
      else blocks.push({ kind: 'ul', items: [bullet[1]] });
      continue;
    }

    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(trimmed);
    if (numbered) {
      if (last && last.kind === 'ol') last.items.push(numbered[2]);
      else blocks.push({ kind: 'ol', items: [numbered[2]] });
      continue;
    }

    const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);
    const content = heading ? `**${heading[1]}**` : trimmed;

    if (last && last.kind === 'p') last.lines.push(content);
    else blocks.push({ kind: 'p', lines: [content] });
  }

  return blocks.filter((b) => b.kind !== 'p' || b.lines.length > 0);
}

export interface MarkdownTextProps {
  content: string;
  /** Inverts the palette for the orange user bubble. */
  inverted?: boolean;
  className?: string;
}

/** Lightweight markdown renderer — bold, italics, code, links, lists, rules. */
export function MarkdownText({ content, inverted = false, className }: MarkdownTextProps) {
  const blocks = useMemo(() => toBlocks(content), [content]);

  return (
    <div
      className={cn(
        'space-y-2 text-sm leading-relaxed',
        inverted ? 'text-white [&_strong]:text-white' : 'text-gray-700',
        className,
      )}
    >
      {blocks.map((block, bi) => {
        if (block.kind === 'hr') {
          return (
            <hr
              key={bi}
              className={cn('my-2 border-t', inverted ? 'border-white/30' : 'border-gray-100')}
            />
          );
        }

        if (block.kind === 'ul') {
          return (
            <ul key={bi} className="ml-1 space-y-1.5">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full',
                      inverted ? 'bg-white/70' : 'bg-orange-400',
                    )}
                  />
                  <span className="min-w-0 flex-1">{renderInline(item, `${bi}-${ii}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'ol') {
          return (
            <ol key={bi} className="ml-1 space-y-1.5">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-px w-4 flex-shrink-0 text-right text-xs font-semibold tabular-nums',
                      inverted ? 'text-white/80' : 'text-orange-500',
                    )}
                  >
                    {ii + 1}.
                  </span>
                  <span className="min-w-0 flex-1">{renderInline(item, `${bi}-${ii}`)}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={bi} className="whitespace-pre-wrap break-words">
            {block.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(line, `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// ── Artifact presentation ────────────────────────────────────────────────────

interface ArtifactMeta {
  label: string;
  icon: typeof Mail;
  tile: string;
  ring: string;
  workboardType: WorkboardItemType;
  color: string;
  route?: (id: string) => string;
}

export const ARTIFACT_META: Record<ChatArtifactType, ArtifactMeta> = {
  'email-draft': {
    label: 'Email draft',
    icon: Mail,
    tile: 'bg-gray-100 text-gray-500',
    ring: 'border-blue-200',
    workboardType: 'email',
    color: '#3b82f6',
    route: (id) => `/emails/${id}`,
  },
  'task-list': {
    label: 'Tasks',
    icon: ListTodo,
    tile: 'bg-gray-100 text-gray-500',
    ring: 'border-orange-200',
    workboardType: 'task',
    color: '#f97316',
    route: (id) => `/tasks/${id}`,
  },
  'event-summary': {
    label: 'Event',
    icon: Calendar,
    tile: 'bg-gray-100 text-gray-500',
    ring: 'border-violet-200',
    workboardType: 'event',
    color: '#8b5cf6',
    route: (id) => `/events/${id}`,
  },
  'contact-card': {
    label: 'Contact',
    icon: User,
    tile: 'bg-gray-100 text-gray-500',
    ring: 'border-emerald-200',
    workboardType: 'contact',
    color: '#10b981',
    route: (id) => `/contacts/${id}`,
  },
  'research-pack': {
    label: 'Research Pack',
    icon: FolderOpen,
    tile: 'bg-gray-100 text-gray-500',
    ring: 'border-indigo-200',
    workboardType: 'research-pack',
    color: '#6366f1',
    route: (id) => `/research-packs/${id}`,
  },
  'markdown-document': {
    label: 'Document',
    icon: FileText,
    tile: 'bg-gray-100 text-gray-600',
    ring: 'border-gray-100',
    workboardType: 'note',
    color: '#64748b',
    route: (id) => `/notes/${id}`,
  },
  'action-plan': {
    label: 'Action plan',
    icon: Target,
    tile: 'bg-gray-100 text-gray-500',
    ring: 'border-amber-200',
    workboardType: 'note',
    color: '#f59e0b',
  },
};

const PREVIEW_LINES = 8;

export function ArtifactCard({ artifact }: { artifact: ChatArtifact }) {
  const navigate = useNavigate();
  const meta = ARTIFACT_META[artifact.type] ?? ARTIFACT_META['markdown-document'];
  const Icon = meta.icon;

  const addToWorkboard = useChatStore((s) => s.addToWorkboard);
  const isAdded = useChatStore((s) =>
    s.workboard.some((i) => i.linkedEntityId === artifact.id),
  );
  const addToast = useUIStore((s) => s.addToast);

  const lines = artifact.contentMarkdown.split('\n');
  const isLong = lines.length > PREVIEW_LINES;
  const [expanded, setExpanded] = useState(false);
  const visibleContent = expanded || !isLong
    ? artifact.contentMarkdown
    : lines.slice(0, PREVIEW_LINES).join('\n');

  function handleAdd() {
    if (isAdded) return;
    addToWorkboard({
      type: meta.workboardType,
      linkedEntityId: artifact.id,
      title: artifact.title,
      subtitle: meta.label,
      snippet: artifact.contentMarkdown.slice(0, 180).replace(/[*#]/g, ''),
      color: meta.color,
      isHighlighted: false,
      tags: [meta.label.toLowerCase()],
      metadata: { artifactType: artifact.type },
    });
    addToast({ variant: 'success', title: 'Added to Workboard', message: artifact.title });
  }

  function handleOpen() {
    if (artifact.linkedEntityId && meta.route) {
      navigate(meta.route(artifact.linkedEntityId));
      return;
    }
    addToast({
      variant: 'info',
      title: 'Draft only',
      message: 'This artifact lives in the conversation until you save it.',
    });
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-white', meta.ring)}>
      <div className="flex items-start gap-3 border-b border-gray-100 px-3.5 py-3">
        <div
          aria-hidden="true"
          className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', meta.tile)}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {meta.label}
          </p>
          <h4 className="truncate text-sm font-semibold text-gray-900">{artifact.title}</h4>
        </div>
      </div>

      <div className="px-3.5 py-3">
        <MarkdownText content={visibleContent} />
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            {expanded ? 'Show less' : 'Show full draft'}
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdded}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors',
            isAdded
              ? 'cursor-default bg-gray-100 text-gray-500'
              : 'bg-orange-500 text-white hover:bg-orange-600',
          )}
        >
          {isAdded ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              In Workboard
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add to Workboard
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ── Research pack summary ────────────────────────────────────────────────────

function ResearchPackSummaryCard({ packId }: { packId: string }) {
  const navigate = useNavigate();
  const pack = useResearchPackStore((s) => s.packs.find((p) => p.id === packId));
  const addToWorkboard = useChatStore((s) => s.addToWorkboard);
  const isAdded = useChatStore((s) => s.workboard.some((i) => i.linkedEntityId === packId));
  const addToast = useUIStore((s) => s.addToast);

  if (!pack) {
    return (
      <div className="rounded-lg border border-dashed border-gray-100 bg-gray-50 px-3.5 py-3 text-xs text-gray-500">
        This research pack is no longer available.
      </div>
    );
  }

  const sourceCount = pack.timeline.length;
  const linkedCount =
    pack.linkedEmailIds.length +
    pack.linkedEventIds.length +
    pack.linkedTaskIds.length +
    pack.linkedNoteIds.length +
    pack.linkedContactIds.length;

  return (
    <div className="overflow-hidden rounded-lg border border-indigo-200 bg-white">
      <div
        className="h-1 w-full"
        style={{ backgroundColor: pack.color ?? '#6366f1' }}
        aria-hidden="true"
      />
      <div className="flex items-start gap-3 px-3.5 py-3">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
        >
          <Layers className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Research Pack
          </p>
          <h4 className="text-sm font-semibold text-gray-900">{pack.title}</h4>
          {pack.aiSummary ? (
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-gray-600">
              {pack.aiSummary}
            </p>
          ) : (
            null
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
            <span>{sourceCount} source{sourceCount === 1 ? '' : 's'}</span>
            <span aria-hidden="true">·</span>
            <span>{linkedCount} linked item{linkedCount === 1 ? '' : 's'}</span>
            <span aria-hidden="true">·</span>
            <span>updated {formatRelativeTime(pack.updatedAt)}</span>
          </div>
        </div>
      </div>

      {pack.aiKeyInsights.length > 0 && (
        <ul className="space-y-1 border-t border-gray-100 px-3.5 py-2.5">
          {pack.aiKeyInsights.slice(0, 3).map((insight, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-gray-600">
              <span
                aria-hidden="true"
                className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400"
              />
              <span className="min-w-0 flex-1">{insight}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => navigate(`/research-packs/${pack.id}`)}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-orange-500 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
        >
          Open Research Pack
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={isAdded}
          onClick={() => {
            if (isAdded) return;
            addToWorkboard({
              type: 'research-pack',
              linkedEntityId: pack.id,
              title: pack.title,
              subtitle: `${sourceCount} sources`,
              snippet: pack.aiSummary,
              color: pack.color ?? '#6366f1',
              isHighlighted: false,
              tags: [],
              metadata: {},
            });
            addToast({ variant: 'success', title: 'Added to Workboard', message: pack.title });
          }}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors',
            isAdded
              ? 'cursor-default text-emerald-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          )}
        >
          {isAdded ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              In Workboard
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add to Workboard
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Contextual artifacts derived from plain AI prose ─────────────────────────

/**
 * Plain `text` answers often describe something the user will want to keep —
 * a list of tasks, a meeting, a draft. Surface one matching artifact card so
 * it can be captured to the Workboard without re-asking.
 */
function deriveContextualArtifact(message: ChatMessageModel): ChatArtifact | null {
  if (message.role !== 'assistant' || message.type !== 'text') return null;
  const text = message.textContent ?? '';
  if (text.length < 120) return null;

  const listLines = text
    .split('\n')
    .filter((l) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(l))
    .map((l) => l.trim());

  const base = {
    id: `derived-${message.id}`,
    createdAt: message.createdAt,
    isEditable: false,
  };

  if (/\b(task|to-?do|action item|due|overdue)\b/i.test(text) && listLines.length >= 2) {
    return {
      ...base,
      type: 'task-list',
      title: 'Action items from this answer',
      contentMarkdown: listLines.slice(0, 6).join('\n'),
    };
  }

  if (/\b(meeting|call|standup|review)\b/i.test(text) && /\b(\d{1,2}(:\d{2})?\s?(am|pm)|tomorrow|monday|tuesday|wednesday|thursday|friday)\b/i.test(text)) {
    const line = text
      .split('\n')
      .find((l) => /\b(meeting|call|standup|review)\b/i.test(l))
      ?.trim();
    return {
      ...base,
      type: 'event-summary',
      title: 'Scheduling detail',
      contentMarkdown: line ?? text.slice(0, 200),
    };
  }

  if (/\bresearch pack\b/i.test(text)) {
    return {
      ...base,
      type: 'research-pack',
      title: 'Research thread from this answer',
      contentMarkdown: text.slice(0, 280),
    };
  }

  if (listLines.length >= 4) {
    return {
      ...base,
      type: 'action-plan',
      title: 'Summary you can keep',
      contentMarkdown: listLines.slice(0, 6).join('\n'),
    };
  }

  return null;
}

// ── Message ──────────────────────────────────────────────────────────────────

export function ChatMessage({
  message,
  showAvatar = true,
  onSendMessage,
  onWebSearch,
  onViewAllResults,
  className,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const text = message.textContent ?? '';

  const contextualArtifact = useMemo(() => deriveContextualArtifact(message), [message]);
  const searchResults = message.searchResults ?? [];

  // ── User bubble ──────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className={cn('flex w-full justify-end animate-slide-up', className)}>
        <div className="max-w-[85%] rounded-lg rounded-br-md bg-orange-500 px-4 py-2.5 text-white">
          <MarkdownText content={text} inverted />
        </div>
      </div>
    );
  }

  // ── Assistant bubble ─────────────────────────────────────────────────────
  return (
    <div className={cn('flex w-full items-start gap-2 animate-slide-up', className)}>
      {showAvatar ? (
        <div
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white"
        >
          B
        </div>
      ) : (
        <div aria-hidden="true" className="h-8 w-8 flex-shrink-0" />
      )}

      <div className="min-w-0 max-w-[92%] flex-1 space-y-2.5">
        {text.trim().length > 0 && (
          <div className="rounded-lg rounded-bl-md border border-gray-100 bg-white px-4 py-3 text-gray-800">
            <MarkdownText content={text} />
          </div>
        )}

        {message.error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="mt-px h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{message.error}</span>
          </div>
        )}

        {/* type: artifact */}
        {message.artifact && <ArtifactCard artifact={message.artifact} />}

        {/* type: research-pack-summary */}
        {message.type === 'research-pack-summary' && message.researchPackSummaryId && (
          <ResearchPackSummaryCard packId={message.researchPackSummaryId} />
        )}

        {/* type: search-results */}
        {message.type === 'search-results' && searchResults.length > 0 && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
            <WebSearchResults results={searchResults} variant="inline" pageSize={3} />
            {onViewAllResults && (
              <button
                type="button"
                onClick={() => onViewAllResults(message)}
                className="mt-2 inline-flex items-center gap-1 px-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Open results panel
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Contextual artifact for plain prose answers */}
        {!message.artifact && contextualArtifact && (
          <ArtifactCard artifact={contextualArtifact} />
        )}

        {/* type: action-suggestion (and any message carrying actions) */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <SuggestedActions
            actions={message.suggestedActions}
            onSendMessage={onSendMessage}
            onWebSearch={onWebSearch}
          />
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
