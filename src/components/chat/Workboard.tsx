import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  FolderPlus,
  Globe,
  Layers,
  Loader2,
  Mail,
  ListTodo,
  Search,
  NotebookPen,
  User,
  X,
} from 'lucide-react';
import type { TimelineEntryType, WorkboardItem, WorkboardItemType } from '@/types/index';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useOverlay } from '@/lib/useOverlay';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';

// =============================================================================
// Workboard — collection tray for artifacts captured from the conversation
// =============================================================================

export interface WorkboardProps {
  open: boolean;
  onClose: () => void;
}

interface TypeMeta {
  label: string;
  icon: typeof Mail;
  tile: string;
  timelineType: TimelineEntryType;
  route?: (id: string) => string;
}

export const WORKBOARD_TYPE_META: Record<WorkboardItemType, TypeMeta> = {
  email: {
    label: 'Email',
    icon: Mail,
    tile: 'bg-gray-100 text-gray-500',
    timelineType: 'email',
    route: (id) => `/emails/${id}`,
  },
  task: {
    label: 'Task',
    icon: ListTodo,
    tile: 'bg-gray-100 text-gray-500',
    timelineType: 'task',
    route: (id) => `/tasks/${id}`,
  },
  event: {
    label: 'Event',
    icon: Calendar,
    tile: 'bg-gray-100 text-gray-500',
    timelineType: 'event',
    route: (id) => `/events/${id}`,
  },
  note: {
    label: 'Note',
    icon: NotebookPen,
    tile: 'bg-gray-100 text-gray-500',
    timelineType: 'note',
    route: (id) => `/notes/${id}`,
  },
  contact: {
    label: 'Contact',
    icon: User,
    tile: 'bg-gray-100 text-gray-500',
    timelineType: 'contact-added',
    route: (id) => `/contacts/${id}`,
  },
  'research-pack': {
    label: 'Research Pack',
    icon: Layers,
    tile: 'bg-gray-100 text-gray-500',
    timelineType: 'note',
    route: (id) => `/research-packs/${id}`,
  },
  'web-result': {
    label: 'Web result',
    icon: Globe,
    tile: 'bg-gray-100 text-gray-500',
    timelineType: 'web-search',
  },
};

// ── Single row ───────────────────────────────────────────────────────────────
function WorkboardRow({ item, onOpen }: { item: WorkboardItem; onOpen: (i: WorkboardItem) => void }) {
  const removeFromWorkboard = useChatStore((s) => s.removeFromWorkboard);
  const meta = WORKBOARD_TYPE_META[item.type] ?? WORKBOARD_TYPE_META.note;
  const Icon = meta.icon;

  return (
    <li className="group relative rounded-lg border border-gray-100 bg-white p-3 transition-colors hover:border-gray-100">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
            meta.tile,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1 pr-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {meta.label}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{item.subtitle}</p>
          )}
          {item.snippet && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
              {item.snippet}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-gray-100 px-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Open
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="text-[11px] text-gray-400">Added {formatDate(item.addedAt)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => removeFromWorkboard(item.id)}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label={`Remove ${item.title} from workboard`}
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

// ── Panel body ───────────────────────────────────────────────────────────────
function WorkboardBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const workboard = useChatStore((s) => s.workboard);
  const removeFromWorkboard = useChatStore((s) => s.removeFromWorkboard);
  const addToast = useUIStore((s) => s.addToast);
  const packs = useResearchPackStore((s) => s.packs);
  const createPack = useResearchPackStore((s) => s.createPack);
  const addItemToPack = useResearchPackStore((s) => s.addItemToPack);

  // The footer is a small state machine: pick a destination, then act on it.
  const [mode, setMode] = useState<'idle' | 'new' | 'existing'>('idle');
  const [packTitle, setPackTitle] = useState('');
  const [packQuery, setPackQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const count = workboard.length;

  // Most recently touched first — the pack you are working in is the one you
  // are most likely filing into.
  const sortedPacks = useMemo(
    () =>
      [...packs].sort(
        (a, b) =>
          Date.parse(b.lastActivityAt ?? b.updatedAt) -
          Date.parse(a.lastActivityAt ?? a.updatedAt),
      ),
    [packs],
  );

  const matchingPacks = useMemo(() => {
    const needle = packQuery.trim().toLowerCase();
    if (!needle) return sortedPacks;
    return sortedPacks.filter((pack) => pack.title.toLowerCase().includes(needle));
  }, [sortedPacks, packQuery]);

  function defaultTitle(): string {
    if (workboard.length === 1) return workboard[0].title.slice(0, 60);
    return `Workboard Pack — ${formatDate(new Date())}`;
  }

  function startNew() {
    if (count === 0) return;
    setPackTitle(defaultTitle());
    setMode('new');
  }

  function startExisting() {
    if (count === 0) return;
    setPackQuery('');
    setMode('existing');
  }

  /**
   * Moves every Workboard item onto a pack's timeline and clears the tray.
   *
   * Shared by both destinations so the two paths cannot drift — a new pack and
   * an existing one file items identically.
   */
  function fileItemsIntoPack(packId: string, items: WorkboardItem[]) {
    for (const item of items) {
      const meta = WORKBOARD_TYPE_META[item.type] ?? WORKBOARD_TYPE_META.note;
      const url = item.metadata?.url;
      addItemToPack(packId, {
        type: meta.timelineType,
        title: item.title,
        summary: item.snippet ?? item.subtitle,
        occurredAt: item.addedAt,
        sourceUrl: typeof url === 'string' ? url : undefined,
        metadata: item.metadata ?? {},
        isAIGenerated: false,
      });
      removeFromWorkboard(item.id);
    }
  }

  async function handleAddToExisting(pack: { id: string; title: string }) {
    if (count === 0 || isCreating) return;
    const items = [...workboard];
    setIsCreating(true);
    try {
      fileItemsIntoPack(pack.id, items);
      addToast({
        variant: 'success',
        title: 'Added to Research Pack',
        message: `${items.length} item${items.length === 1 ? '' : 's'} added to "${pack.title}".`,
      });
      setMode('idle');
      onClose();
      navigate(`/research-packs/${pack.id}`);
    } catch (err) {
      addToast({
        variant: 'error',
        title: "Couldn't add to the pack",
        message: (err as Error).message,
      });
    } finally {
      setIsCreating(false);
    }
  }

  function handleOpen(item: WorkboardItem) {
    const meta = WORKBOARD_TYPE_META[item.type];
    const url = item.metadata?.url;
    if (item.type === 'web-result' && typeof url === 'string') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (meta?.route && item.linkedEntityId && !item.linkedEntityId.startsWith('derived-')) {
      onClose();
      navigate(meta.route(item.linkedEntityId));
      return;
    }
    addToast({
      variant: 'info',
      title: 'Draft item',
      message: 'This item lives in the Workboard until it is saved into a pack.',
    });
  }

  async function handleCreatePack() {
    if (count === 0 || isCreating) return;
    const items = [...workboard];
    setIsCreating(true);

    try {
      const pack = await createPack({
        title: packTitle.trim() || defaultTitle(),
      });

      fileItemsIntoPack(pack.id, items);

      addToast({
        variant: 'success',
        title: 'Research Pack created',
        message: `${items.length} item${items.length === 1 ? '' : 's'} added to "${pack.title}".`,
      });

      setMode('idle');
      onClose();
      navigate(`/research-packs/${pack.id}`);
    } catch (err) {
      addToast({
        variant: 'error',
        title: "Couldn't create the pack",
        message: (err as Error).message,
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Workboard</h2>
            <span
              className={cn(
                'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                count > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500',
              )}
            >
              {count}
            </span>
          </div>
          <p className="truncate text-xs text-gray-500">
            {count === 0 ? 'Nothing collected yet' : 'Captured from this conversation'}
          </p>
        </div>

        <button
          type="button"
          onClick={startNew}
          disabled={count === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-orange-500 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Save</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="-mr-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close workboard"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Items */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {count === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <div
              aria-hidden="true"
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-gray-100 bg-white"
            >
              <Layers className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Your Workboard is empty</h3>
            <p className="mt-1.5 max-w-[15rem] text-xs leading-relaxed text-gray-500">
              Add artifacts from your conversation to build a collection
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {workboard.map((item, index) => (
              <WorkboardRow key={`${item.id}-${index}`} item={item} onOpen={handleOpen} />
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-gray-100 bg-white p-3 safe-bottom">
        {mode === 'new' && (
          <div className="space-y-2">
            <label htmlFor="wb-pack-title" className="block text-xs font-semibold text-gray-600">
              Name your Research Pack
            </label>
            <input
              id="wb-pack-title"
              value={packTitle}
              autoFocus
              onChange={(e) => setPackTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreatePack();
                if (e.key === 'Escape') setMode('idle');
              }}
              className="w-full rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="Research Pack title"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('idle')}
                className="h-10 flex-1 rounded-lg border border-gray-100 text-sm font-semibold text-gray-700 transition-colors active:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreatePack()}
                disabled={isCreating}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-semibold text-white transition-colors active:bg-orange-600 disabled:opacity-60"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Create
              </button>
            </div>
          </div>
        )}

        {mode === 'existing' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-600">
                Add {count} item{count === 1 ? '' : 's'} to…
              </span>
              <button
                type="button"
                onClick={() => setMode('idle')}
                className="rounded-lg px-1.5 py-1 text-xs font-semibold text-gray-500 active:opacity-60"
              >
                Cancel
              </button>
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                value={packQuery}
                autoFocus
                onChange={(e) => setPackQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setMode('idle');
                }}
                placeholder="Search packs"
                aria-label="Search research packs"
                className="w-full rounded-lg border border-gray-100 py-2 pl-8 pr-3 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {matchingPacks.length === 0 ? (
                <li className="px-1 py-3 text-center text-xs text-gray-400">
                  {packs.length === 0
                    ? 'No packs yet — create one instead.'
                    : `No packs match “${packQuery}”.`}
                </li>
              ) : (
                matchingPacks.map((pack) => (
                  <li key={pack.id}>
                    <button
                      type="button"
                      disabled={isCreating}
                      onClick={() => void handleAddToExisting(pack)}
                      className="flex w-full items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-left transition-opacity active:opacity-60 disabled:opacity-50"
                    >
                      <Layers className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {pack.title}
                        </span>
                        <span className="block truncate text-[11px] text-gray-400">
                          {pack.timeline.length} item
                          {pack.timeline.length === 1 ? '' : 's'} · updated{' '}
                          {formatRelativeTime(pack.updatedAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startExisting}
              disabled={count === 0 || packs.length === 0}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-100 text-sm font-semibold text-gray-700 transition-opacity active:opacity-60 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              Add to Pack
            </button>
            <button
              type="button"
              onClick={startNew}
              disabled={count === 0}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-semibold text-white transition-colors active:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              <FolderPlus className="h-4 w-4" aria-hidden="true" />
              New Pack
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

// ── Slide-in shell: right drawer on desktop, bottom sheet on mobile ──────────
export function Workboard({ open, onClose }: WorkboardProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useOverlay(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Workboard"
    >
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="bottom-sheet-panel absolute inset-x-0 bottom-0 flex h-[85%] flex-col overflow-hidden rounded-t-2xl bg-white"
      >
        <div className="flex flex-shrink-0 justify-center bg-white pt-2.5" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="min-h-0 flex-1">
          <WorkboardBody onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

export default Workboard;
