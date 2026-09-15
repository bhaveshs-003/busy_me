import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Hourglass, Inbox, Mail, Paperclip, Pencil, SearchX, Star } from 'lucide-react';
import type { Email, EmailViewFilter } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterItem } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/LoadingState';
import { EmailCard } from '@/components/email/EmailCard';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import {
  EMAIL_PAGE_SIZE,
  computeEmailStats,
  filterEmails,
  selectFolderEmails,
  useEmailStore,
} from '@/store/emailStore';
import type { EmailFilters } from '@/store/emailStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Quick filters
//
// The FilterBar drives an `EmailViewFilter`, which is stored as the matching
// combination of store-level email filters.
// =============================================================================

const FILTERS: { id: EmailViewFilter; label: string; icon?: React.ReactNode }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread', icon: <Mail /> },
  { id: 'important', label: 'Important', icon: <Star /> },
  { id: 'waiting', label: 'Waiting On', icon: <Hourglass /> },
  { id: 'attachments', label: 'Attachments', icon: <Paperclip /> },
];

/** Reads the active quick filter back out of the store's filter object. */
function viewFilterOf(filters: EmailFilters): EmailViewFilter {
  if (filters.isRead === false) return 'unread';
  if (filters.isImportant) return 'important';
  if (filters.isWaitingOn) return 'waiting';
  if (filters.hasAttachments) return 'attachments';
  return 'all';
}

/** The store filters a quick filter maps onto — every other flag is cleared. */
function filtersForView(view: EmailViewFilter): Partial<EmailFilters> {
  return {
    isRead: view === 'unread' ? false : undefined,
    isImportant: view === 'important' ? true : undefined,
    isWaitingOn: view === 'waiting' ? true : undefined,
    hasAttachments: view === 'attachments' ? true : undefined,
  };
}

function matchesView(email: Email, view: EmailViewFilter): boolean {
  switch (view) {
    case 'unread':
      return email.status === 'unread';
    case 'important':
      return email.isImportant;
    case 'waiting':
      return Boolean(email.waitingOn);
    case 'attachments':
      return email.attachments.length > 0;
    case 'all':
    default:
      return true;
  }
}

// =============================================================================
// Empty states
// =============================================================================

const EMPTY_COPY: Record<EmailViewFilter, { title: string; description: string }> = {
  all: {
    title: 'Inbox zero',
    description: 'Nothing is waiting on you. New mail lands here as it arrives.',
  },
  unread: {
    title: 'Nothing unread',
    description: 'Every message in your inbox has been opened.',
  },
  important: {
    title: 'Nothing flagged',
    description: 'Star a thread and it will be collected here for quick access.',
  },
  waiting: {
    title: 'No replies outstanding',
    description: 'Threads you are chasing show up here with their chase date.',
  },
  attachments: {
    title: 'No attachments',
    description: 'Messages carrying files appear here so you can find them fast.',
  },
};

// =============================================================================
// Page
// =============================================================================

export default function EmailListPage() {
  const emails = useEmailStore((s) => s.emails);
  const isLoading = useEmailStore((s) => s.isLoading);
  const error = useEmailStore((s) => s.error);
  const page = useEmailStore((s) => s.page);
  const hasMore = useEmailStore((s) => s.hasMore);
  const filters = useEmailStore((s) => s.filters);
  const searchQuery = useEmailStore((s) => s.searchQuery);
  const fetchEmails = useEmailStore((s) => s.fetchEmails);
  const loadMore = useEmailStore((s) => s.loadMore);
  const setFilters = useEmailStore((s) => s.setFilters);
  const setSearchQuery = useEmailStore((s) => s.setSearchQuery);
  const markImportant = useEmailStore((s) => s.markImportant);
  const archiveEmail = useEmailStore((s) => s.archiveEmail);
  const addToast = useUIStore((s) => s.addToast);

  const [isComposeOpen, setComposeOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activeFilter = viewFilterOf(filters);

  // Re-fetch whenever the result set changes shape so the store's paging
  // counters (`page` / `hasMore`) are recomputed against the new selection.
  useEffect(() => {
    void fetchEmails();
  }, [fetchEmails, filters, searchQuery]);

  // ── Derived data ────────────────────────────────────────────────────────
  const folderEmails = useMemo(
    () => selectFolderEmails(emails, filters.folder),
    [emails, filters.folder],
  );

  const stats = useMemo(() => computeEmailStats(folderEmails), [folderEmails]);

  /** Folder rows narrowed by the search query only — the basis for the counts. */
  const searchedEmails = useMemo(
    () =>
      filterEmails(
        emails,
        { folder: filters.folder, labels: filters.labels, category: filters.category },
        searchQuery,
      ),
    [emails, filters.folder, filters.labels, filters.category, searchQuery],
  );

  const filterItems: FilterItem[] = useMemo(
    () =>
      FILTERS.map((filter) => ({
        id: filter.id,
        label: filter.label,
        icon: filter.icon,
        count: searchedEmails.filter((email) => matchesView(email, filter.id)).length,
      })),
    [searchedEmails],
  );

  const matchingEmails = useMemo(
    () =>
      // Copy before sorting — `filterEmails` can hand back the source array.
      [...filterEmails(emails, filters, searchQuery)].sort(
        (a, b) => Date.parse(b.date) - Date.parse(a.date),
      ),
    [emails, filters, searchQuery],
  );

  const visibleEmails = useMemo(
    () => matchingEmails.slice(0, page * EMAIL_PAGE_SIZE),
    [matchingEmails, page],
  );

  const canLoadMore = hasMore && visibleEmails.length < matchingEmails.length;

  // ── Infinite scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: '240px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore]);

  // ── Row actions ─────────────────────────────────────────────────────────
  const handleSelectFilter = useCallback(
    (view: EmailViewFilter) => setFilters(filtersForView(view)),
    [setFilters],
  );

  const handleToggleImportant = useCallback(
    (email: Email) => {
      void markImportant(email.id, !email.isImportant);
    },
    [markImportant],
  );

  const handleArchive = useCallback(
    async (email: Email) => {
      try {
        await archiveEmail(email.id);
        addToast({ variant: 'success', title: 'Archived', message: email.subject });
      } catch {
        addToast({
          variant: 'error',
          title: "Couldn't archive email",
          message: 'Please try again.',
        });
      }
    },
    [archiveEmail, addToast],
  );

  const showSkeleton = isLoading && visibleEmails.length === 0 && !error;
  const showEmpty = !showSkeleton && !error && matchingEmails.length === 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Emails"
        subtitle={`${stats.unread} unread · ${folderEmails.length} in inbox`}
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label="Compose email"
            onClick={() => setComposeOpen(true)}
          >
            <Pencil />
          </Button>
        }
      />

      {/* ── Search + filters ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 pb-3 pt-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          isLoading={isLoading && isSearching}
          placeholder="Search sender, subject or body"
          aria-label="Search emails"
        />

        <FilterBar
          aria-label="Email filters"
          className="mt-2"
          filters={filterItems}
          active={activeFilter}
          onChange={(id) => handleSelectFilter(id as EmailViewFilter)}
        />
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {showSkeleton && <ListSkeleton count={6} />}

        {error && !showSkeleton && (
          <ErrorState
            title="Couldn't load your inbox"
            description="The mailbox did not respond. Check your connection and try again."
            detail={error}
            isRetrying={isLoading}
            onRetry={() => void fetchEmails()}
          />
        )}

        {showEmpty &&
          (isSearching ? (
            <EmptyState
              icon={<SearchX />}
              title="No matching emails"
              description={`Nothing in this view matches "${searchQuery.trim()}".`}
              action={{ label: 'Clear search', onClick: () => setSearchQuery('') }}
              secondaryAction={
                activeFilter === 'all'
                  ? undefined
                  : { label: 'Show all emails', onClick: () => handleSelectFilter('all') }
              }
            />
          ) : (
            <EmptyState
              icon={<Inbox />}
              title={EMPTY_COPY[activeFilter].title}
              description={EMPTY_COPY[activeFilter].description}
              action={{ label: 'Compose email', onClick: () => setComposeOpen(true) }}
              secondaryAction={
                activeFilter === 'all'
                  ? undefined
                  : { label: 'Show all emails', onClick: () => handleSelectFilter('all') }
              }
            />
          ))}

        {visibleEmails.length > 0 && (
          <div
            className={cn(
              'overflow-hidden rounded-lg border border-gray-100 bg-white',
              'divide-y divide-gray-100',
            )}
          >
            {visibleEmails.map((email, index) => (
              <EmailCard
                key={email.id}
                email={email}
                swipeable
                showSwipeHint={index === 0}
                onArchive={(row) => void handleArchive(row)}
                onToggleImportant={handleToggleImportant}
              />
            ))}
          </div>
        )}

        {/* Infinite-scroll sentinel */}
        {canLoadMore && (
          <div ref={sentinelRef} className="pt-3">
            <ListSkeleton count={2} />
          </div>
        )}

        {!canLoadMore && visibleEmails.length > 0 && (
          <p className="py-4 text-center text-xs text-gray-400">
            {visibleEmails.length} {visibleEmails.length === 1 ? 'message' : 'messages'} · end of
            list
          </p>
        )}
      </div>

      <ComposeEmail open={isComposeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
}
