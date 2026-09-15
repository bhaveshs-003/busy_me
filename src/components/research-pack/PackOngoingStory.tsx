import { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import type { ResearchPack, TimelineEntry, TimelineEntryType } from '@/types/index';
import { TimelineItem } from '@/components/entity/TimelineItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { PackFilterChips } from './PackSection';
import type { PackFilterChip } from './PackSection';

// =============================================================================
// PackOngoingStory — reverse-chronological activity feed for a pack
// =============================================================================

/** How many entries to reveal at a time. */
const PAGE_SIZE = 8;

type StoryFilter = 'all' | TimelineEntryType;

const FILTER_ORDER: { id: StoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'email', label: 'Emails' },
  { id: 'task', label: 'Tasks' },
  { id: 'event', label: 'Events' },
  { id: 'note', label: 'Notes' },
  { id: 'file', label: 'Files' },
  { id: 'web-search', label: 'Research' },
  { id: 'status-change', label: 'Status' },
];

export interface PackOngoingStoryProps {
  pack: ResearchPack;
}

export function PackOngoingStory({ pack }: PackOngoingStoryProps) {
  const [filter, setFilter] = useState<StoryFilter>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Newest first — the story reads top-down as "what happened most recently".
  const ordered = useMemo(
    () =>
      [...pack.timeline].sort(
        (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
      ),
    [pack.timeline],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of ordered) {
      map.set(entry.type, (map.get(entry.type) ?? 0) + 1);
    }
    return map;
  }, [ordered]);

  // Only offer a filter that would actually match something.
  const chips: PackFilterChip[] = useMemo(
    () =>
      FILTER_ORDER.filter(
        ({ id }) => id === 'all' || (counts.get(id) ?? 0) > 0,
      ).map(({ id, label }) => ({
        id,
        label,
        count: id === 'all' ? ordered.length : counts.get(id),
      })),
    [counts, ordered.length],
  );

  const filtered: TimelineEntry[] = useMemo(
    () => (filter === 'all' ? ordered : ordered.filter((e) => e.type === filter)),
    [ordered, filter],
  );

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > shown.length;

  function handleFilter(next: string) {
    setFilter(next as StoryFilter);
    setVisible(PAGE_SIZE);
  }

  if (ordered.length === 0) {
    return (
      <EmptyState
        icon={<History />}
        title="Nothing has happened yet"
        description="As emails, tasks and events are linked to this pack, they'll appear here as a running story."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PackFilterChips
        chips={chips}
        active={filter}
        onChange={handleFilter}
        aria-label="Filter the story by activity type"
      />

      {shown.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="No matching activity"
          description="Nothing of this type has been added to the pack yet."
        />
      ) : (
        <ol className="pt-1">
          {shown.map((entry, index) => (
            <TimelineItem
              key={entry.id}
              entry={entry}
              isLast={index === shown.length - 1}
            />
          ))}
        </ol>
      )}

      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
        >
          Load earlier activity
        </Button>
      )}
    </div>
  );
}

export default PackOngoingStory;
