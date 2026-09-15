import { useMemo, useState } from 'react';
import { Check, ChevronDown, ExternalLink, Globe, Plus, SearchX, X } from 'lucide-react';
import type { WebSearchResult } from '@/types/index';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate } from '@/lib/utils';

// =============================================================================
// WebSearchResults — scrollable list of web results with workboard capture
// =============================================================================

export interface WebSearchResultsProps {
  results: WebSearchResult[];
  /** The query these results answer — shown in the panel header. */
  query?: string | null;
  isLoading?: boolean;
  /**
   * `panel` — full-height surface with its own header (used by the slide-up
   * panel on ChatPage). `inline` — borderless list embedded in a message.
   */
  variant?: 'panel' | 'inline';
  /** Results revealed before "Show more results" is needed. */
  pageSize?: number;
  onClose?: () => void;
  className?: string;
}

const FAVICON_TONES = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

function toneFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return FAVICON_TONES[hash % FAVICON_TONES.length];
}

// ── Favicon with letter fallback ─────────────────────────────────────────────
function ResultFavicon({ result }: { result: WebSearchResult }) {
  const [failed, setFailed] = useState(false);
  const seed = result.displayUrl || result.sourceName || result.title;
  const letter = (result.sourceName ?? result.displayUrl ?? result.title)
    .replace(/^www\./, '')
    .charAt(0)
    .toUpperCase();

  if (result.faviconUrl && !failed) {
    return (
      <img
        src={result.faviconUrl}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        className="h-8 w-8 flex-shrink-0 rounded-lg border border-gray-100 bg-white object-contain p-1"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold',
        toneFor(seed),
      )}
    >
      {letter || '?'}
    </div>
  );
}

// ── Single result row ────────────────────────────────────────────────────────
function ResultRow({ result }: { result: WebSearchResult }) {
  const addToWorkboard = useChatStore((s) => s.addToWorkboard);
  const isAdded = useChatStore((s) =>
    s.workboard.some((i) => i.type === 'web-result' && i.linkedEntityId === result.id),
  );
  const addToast = useUIStore((s) => s.addToast);

  function handleAdd() {
    if (isAdded) return;
    addToWorkboard({
      type: 'web-result',
      linkedEntityId: result.id,
      title: result.title,
      subtitle: result.sourceName ?? result.displayUrl,
      snippet: result.snippet,
      color: '#0ea5e9',
      isHighlighted: false,
      tags: ['web'],
      metadata: { url: result.url, displayUrl: result.displayUrl },
    });
    addToast({
      variant: 'success',
      title: 'Added to Workboard',
      message: result.title,
    });
  }

  return (
    <article className="group rounded-lg border border-gray-100 bg-white p-3.5 transition-colors hover:border-gray-100">
      <div className="flex items-start gap-3">
        <ResultFavicon result={result} />

        <div className="min-w-0 flex-1">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 hover:text-orange-600"
          >
            {result.title}
          </a>

          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-gray-600">
            {result.snippet}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
            <span className="inline-flex max-w-[180px] items-center gap-1 truncate">
              <Globe className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{result.displayUrl}</span>
            </span>
            {result.publishedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatDate(result.publishedAt)}</span>
              </>
            )}
            {result.relevanceScore >= 0.9 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-orange-600">Top match</span>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdded}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors',
                isAdded
                  ? 'cursor-default bg-gray-100 text-gray-500'
                  : 'bg-gray-100 text-gray-500 hover:bg-orange-100',
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

            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function ResultsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-100 bg-white p-3.5">
          <div className="flex gap-3">
            <div className="skeleton h-8 w-8 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3.5 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function WebSearchResults({
  results,
  query = null,
  isLoading = false,
  variant = 'panel',
  pageSize = 4,
  onClose,
  className,
}: WebSearchResultsProps) {
  const [visible, setVisible] = useState(pageSize);

  const shown = useMemo(() => results.slice(0, visible), [results, visible]);
  const remaining = results.length - shown.length;

  const body = (
    <>
      {isLoading && <ResultsSkeleton rows={variant === 'panel' ? 4 : 2} />}

      {!isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
            <SearchX className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-gray-900">No results found</p>
          <p className="mt-1 max-w-xs text-xs text-gray-500">
            Try a broader phrase or turn off web search to answer from your own
            emails, tasks and research packs.
          </p>
        </div>
      )}

      {!isLoading && shown.length > 0 && (
        <div className="space-y-2.5">
          {shown.map((result) => (
            <ResultRow key={result.id} result={result} />
          ))}
        </div>
      )}

      {!isLoading && remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + pageSize)}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-100 bg-white py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-100 hover:bg-gray-50"
        >
          Show more results
          <span className="text-gray-400">({remaining})</span>
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </>
  );

  if (variant === 'inline') {
    return <div className={cn('w-full', className)}>{body}</div>;
  }

  return (
    <section
      className={cn('flex h-full min-h-0 flex-col bg-gray-50', className)}
      aria-label="Web search results"
    >
      <header className="flex flex-shrink-0 items-start gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
          <Globe className="h-4 w-4 text-orange-600" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900">Web results</h2>
          <p className="truncate text-xs text-gray-500">
            {isLoading
              ? `Searching for "${query ?? ''}"…`
              : query
                ? `${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`
                : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close web results"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">{body}</div>
    </section>
  );
}

export default WebSearchResults;
