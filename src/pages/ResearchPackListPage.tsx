import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus } from 'lucide-react';
import type { ResearchPack, ResearchPackStatus } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterItem } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/LoadingState';
import { ResearchPackCard } from '@/components/research-pack/ResearchPackCard';
import { CreateResearchPackSheet } from '@/components/research-pack/CreateResearchPackSheet';
import { useResearchPackStore } from '@/store/researchPackStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Filtering
// =============================================================================

type PackFilter = ResearchPackStatus | 'all';

const FILTERS: { id: PackFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'paused', label: 'Paused' },
  { id: 'archived', label: 'Archived' },
];

function matchesFilter(pack: ResearchPack, filter: PackFilter): boolean {
  return filter === 'all' || pack.status === filter;
}

function matchesQuery(pack: ResearchPack, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    pack.title.toLowerCase().includes(needle) ||
    (pack.description ?? '').toLowerCase().includes(needle) ||
    pack.tags.some((tag) => tag.toLowerCase().includes(needle))
  );
}

/** Most recently touched pack first. */
function lastTouched(pack: ResearchPack): number {
  const parsed = Date.parse(pack.lastActivityAt ?? pack.updatedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const EMPTY_COPY: Record<PackFilter, { title: string; description: string }> = {
  all: {
    title: 'No research packs yet',
    description:
      'A research pack keeps the emails, tasks, events and notes for one ongoing thing in a single place.',
  },
  active: {
    title: 'Nothing active',
    description: 'Every pack is paused, completed or archived. Start a new one to pick up a thread.',
  },
  completed: {
    title: 'Nothing completed yet',
    description: 'Packs you wrap up are collected here so you can look back on them.',
  },
  paused: {
    title: 'Nothing paused',
    description: 'Pause a pack when it is on hold and it will wait for you here.',
  },
  archived: {
    title: 'Nothing archived',
    description: 'Archive a pack to take it out of the way without deleting anything.',
  },
};

// =============================================================================
// Page
// =============================================================================

export default function ResearchPackListPage() {
  const navigate = useNavigate();

  const packs = useResearchPackStore((s) => s.packs);
  const isLoading = useResearchPackStore((s) => s.isLoading);
  const error = useResearchPackStore((s) => s.error);
  const fetchPacks = useResearchPackStore((s) => s.fetchPacks);
  const filters = useResearchPackStore((s) => s.filters);
  const setFilters = useResearchPackStore((s) => s.setFilters);

  const [query, setQuery] = useState('');
  const [isSheetOpen, setSheetOpen] = useState(false);

  const activeFilter: PackFilter = filters.status ?? 'all';

  useEffect(() => {
    void fetchPacks();
  }, [fetchPacks]);

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<string, number>>((acc, { id }) => {
        acc[id] = packs.filter((pack) => matchesFilter(pack, id)).length;
        return acc;
      }, {}),
    [packs],
  );

  const filterItems: FilterItem[] = useMemo(
    () => FILTERS.map(({ id, label }) => ({ id, label, count: counts[id] ?? 0 })),
    [counts],
  );

  const visiblePacks = useMemo(
    () =>
      packs
        .filter((pack) => matchesFilter(pack, activeFilter) && matchesQuery(pack, query))
        .sort((a, b) => lastTouched(b) - lastTouched(a)),
    [packs, activeFilter, query],
  );

  const showSkeleton = isLoading && packs.length === 0;
  const showError = Boolean(error) && packs.length === 0;
  const isEmpty = !showSkeleton && !showError && visiblePacks.length === 0;
  const isSearching = query.trim().length > 0;

  return (
    <div className={cn('relative flex h-full flex-col', t.surfaceMuted)}>
      <PageHeader
        title="Research Packs"
        subtitle={`${counts.active ?? 0} active · ${packs.length} total`}
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label="New research pack"
            onClick={() => setSheetOpen(true)}
          >
            <Plus />
          </Button>
        }
      />

      {/* ── Search + filters ────────────────────────────────────────────── */}
      <div className={cn('flex-shrink-0 border-b bg-white px-4 pb-3 pt-2', t.hairline)}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search packs, tags…"
          aria-label="Search research packs"
        />
        <FilterBar
          className="mt-2"
          aria-label="Research pack filters"
          filters={filterItems}
          active={activeFilter}
          onChange={(id) => setFilters({ status: id as PackFilter })}
        />
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3">
        {showSkeleton && <ListSkeleton count={5} showAvatar={false} />}

        {showError && (
          <ErrorState
            title="Couldn't load research packs"
            description="Something went wrong while fetching your packs."
            detail={error ?? undefined}
            onRetry={() => void fetchPacks()}
          />
        )}

        {isEmpty &&
          (isSearching ? (
            <EmptyState
              icon={<Layers />}
              title="No packs match that search"
              description={`Nothing found for "${query.trim()}". Try a different word, or clear the search.`}
              action={{ label: 'Clear search', onClick: () => setQuery('') }}
            />
          ) : (
            <EmptyState
              icon={<Layers />}
              title={EMPTY_COPY[activeFilter].title}
              description={EMPTY_COPY[activeFilter].description}
              action={{ label: 'New research pack', onClick: () => setSheetOpen(true) }}
              secondaryAction={
                activeFilter === 'all'
                  ? undefined
                  : { label: 'Show all packs', onClick: () => setFilters({ status: 'all' }) }
              }
            />
          ))}

        {visiblePacks.length > 0 && (
          <div className={t.listGap}>
            {visiblePacks.map((pack) => (
              <ResearchPackCard key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="New research pack"
        className={cn(
          'absolute bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full',
          t.brandFill,
          t.pressable,
          t.focusRing,
        )}
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>

      <CreateResearchPackSheet
        open={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={(pack) => navigate(`/research-packs/${pack.id}`)}
      />
    </div>
  );
}
