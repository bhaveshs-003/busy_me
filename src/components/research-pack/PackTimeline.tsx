import { useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import type { ResearchPack, TimelineEntry } from '@/types/index';
import { TimelineItem } from '@/components/entity/TimelineItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatDate } from '@/lib/utils';
import * as t from '@/lib/theme';
import { PackFilterChips } from './PackSection';

// =============================================================================
// PackTimeline — dated milestones, grouped under month headers
//
// Where the Story tab is "what happened most recently", the Timeline reads
// oldest-to-newest so the arc of the pack is legible end to end.
// =============================================================================

type TimelineFilter = 'all' | 'meetings' | 'emails' | 'tasks';

const FILTER_MATCH: Record<TimelineFilter, (entry: TimelineEntry) => boolean> = {
  all: () => true,
  meetings: (entry) => entry.type === 'event',
  emails: (entry) => entry.type === 'email',
  tasks: (entry) => entry.type === 'task',
};

function monthKey(iso: string): string {
  return formatDate(iso, { month: 'long', year: 'numeric' });
}

export interface PackTimelineProps {
  pack: ResearchPack;
}

export function PackTimeline({ pack }: PackTimelineProps) {
  const [filter, setFilter] = useState<TimelineFilter>('all');

  const ordered = useMemo(
    () =>
      [...pack.timeline].sort(
        (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
      ),
    [pack.timeline],
  );

  const chips = useMemo(
    () =>
      (Object.keys(FILTER_MATCH) as TimelineFilter[]).map((id) => ({
        id,
        label: id === 'all' ? 'All' : id[0].toUpperCase() + id.slice(1),
        count: ordered.filter(FILTER_MATCH[id]).length,
      })),
    [ordered],
  );

  // Group into months so a long pack stays scannable.
  const groups = useMemo(() => {
    const matched = ordered.filter(FILTER_MATCH[filter]);
    const map = new Map<string, TimelineEntry[]>();
    for (const entry of matched) {
      const key = monthKey(entry.occurredAt);
      const bucket = map.get(key);
      if (bucket) bucket.push(entry);
      else map.set(key, [entry]);
    }
    return [...map.entries()];
  }, [ordered, filter]);

  if (ordered.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange />}
        title="No milestones yet"
        description="Dated activity on this pack will plot here as it accumulates."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PackFilterChips
        chips={chips}
        active={filter}
        onChange={(id) => setFilter(id as TimelineFilter)}
        aria-label="Filter the timeline"
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<CalendarRange />}
          title="Nothing in this view"
          description="Try a different filter to see the rest of the timeline."
        />
      ) : (
        <div className="space-y-5">
          {groups.map(([month, entries]) => (
            <section key={month}>
              <h3
                className={cn(
                  t.label,
                  'sticky top-0 z-10 -mx-4 bg-gray-50/95 px-4 py-1.5 uppercase tracking-wide backdrop-blur',
                )}
              >
                {month}
              </h3>
              <ol className="pt-2">
                {entries.map((entry, index) => (
                  <TimelineItem
                    key={entry.id}
                    entry={entry}
                    isLast={index === entries.length - 1}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default PackTimeline;
