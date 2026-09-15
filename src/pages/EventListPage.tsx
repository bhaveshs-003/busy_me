import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import {
  endOfWeek,
  format,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
} from 'date-fns';
import type { CalendarEvent } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterItem } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import { EventCard } from '@/components/events/EventCard';
import { CreateEventSheet } from '@/components/events/CreateEventSheet';
import { useEventStore } from '@/store/eventStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Filtering
// =============================================================================

type EventFilter = 'upcoming' | 'today' | 'week' | 'past' | 'important';

const FILTERS: { id: EventFilter; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'past', label: 'Past' },
  { id: 'important', label: 'Important' },
];

/** An event counts as important when missing it is expensive. */
const IMPORTANT_ATTENDEE_THRESHOLD = 3;

function isImportantEvent(event: CalendarEvent): boolean {
  if (event.isCancelled) return false;
  return (
    event.type === 'deadline' ||
    event.attendees.length >= IMPORTANT_ATTENDEE_THRESHOLD
  );
}

interface TimeWindow {
  /** Start of the current instant. */
  now: number;
  /** End of the current week (Monday-based). */
  weekEnd: number;
  /** Start of today, used for whole-day comparisons. */
  todayStart: number;
}

function matchesFilter(event: CalendarEvent, filter: EventFilter, w: TimeWindow): boolean {
  const start = Date.parse(event.startAt);
  const end = Date.parse(event.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;

  switch (filter) {
    case 'upcoming':
      // Anything still running counts as upcoming, not past.
      return end >= w.now;
    case 'today':
      return isToday(new Date(start)) || (start < w.todayStart && end >= w.todayStart);
    case 'week':
      return end >= w.now && start <= w.weekEnd;
    case 'past':
      return end < w.now;
    case 'important':
      return isImportantEvent(event);
    default:
      return true;
  }
}

/** Past events read newest-first; everything else reads soonest-first. */
function sortForFilter(events: CalendarEvent[], filter: EventFilter): CalendarEvent[] {
  const direction = filter === 'past' ? -1 : 1;
  return [...events].sort((a, b) => {
    const delta = Date.parse(a.startAt) - Date.parse(b.startAt);
    if (delta !== 0) return delta * direction;
    return a.title.localeCompare(b.title);
  });
}

// =============================================================================
// Day grouping
// =============================================================================

interface DayGroup {
  /** `YYYY-MM-DD` of the day, used as the React key. */
  key: string;
  label: string;
  /** Secondary line, e.g. "Wed 16 Sep" beside "Tomorrow". */
  sublabel: string | null;
  events: CalendarEvent[];
}

function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function dayLabel(date: Date): { label: string; sublabel: string | null } {
  const full = format(date, 'EEE d MMM');
  if (isToday(date)) return { label: 'Today', sublabel: full };
  if (isTomorrow(date)) return { label: 'Tomorrow', sublabel: full };
  if (isYesterday(date)) return { label: 'Yesterday', sublabel: full };
  return { label: full, sublabel: null };
}

function groupByDay(events: CalendarEvent[]): DayGroup[] {
  const buckets = new Map<string, DayGroup>();

  for (const event of events) {
    const date = new Date(event.startAt);
    if (Number.isNaN(date.getTime())) continue;

    const key = dayKey(date);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.events.push(event);
    } else {
      buckets.set(key, { key, ...dayLabel(date), events: [event] });
    }
  }

  // Insertion order already reflects the sort applied upstream.
  return [...buckets.values()];
}

// =============================================================================
// Empty states
// =============================================================================

const EMPTY_COPY: Record<EventFilter, { title: string; description: string }> = {
  upcoming: {
    title: 'Nothing scheduled',
    description: 'Your calendar is clear from here on. Add an event to fill it in.',
  },
  today: {
    title: 'Nothing today',
    description: 'No meetings, calls or deadlines land on today.',
  },
  week: {
    title: 'Clear for the week',
    description: 'Nothing left on the calendar before the week is out.',
  },
  past: {
    title: 'No past events',
    description: 'Events that have already finished are collected here.',
  },
  important: {
    title: 'Nothing critical',
    description: 'Deadlines and meetings with three or more people show up here.',
  },
};

// =============================================================================
// Page
// =============================================================================

export default function EventListPage() {
  const events = useEventStore((s) => s.events);
  const calendarAccounts = useEventStore((s) => s.calendarAccounts);
  const isLoading = useEventStore((s) => s.isLoading);
  const error = useEventStore((s) => s.error);
  const fetchEvents = useEventStore((s) => s.fetchEvents);

  const [filter, setFilter] = useState<EventFilter>('upcoming');
  const [isSheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // One instant per render pass so every event is bucketed against the same
  // "now" — otherwise an event could fall into two filters at a boundary.
  const timeWindow = useMemo<TimeWindow>(() => {
    const now = new Date();
    return {
      now: now.getTime(),
      weekEnd: endOfWeek(now, { weekStartsOn: 1 }).getTime(),
      todayStart: startOfDay(now).getTime(),
    };
  }, []);

  // Events on calendars the user has hidden never appear in the agenda.
  const visibleCalendarIds = useMemo(
    () => new Set(calendarAccounts.filter((a) => a.isVisible).map((a) => a.id)),
    [calendarAccounts],
  );

  const scopedEvents = useMemo(
    () => events.filter((event) => visibleCalendarIds.has(event.calendarAccountId)),
    [events, visibleCalendarIds],
  );

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<string, number>>((acc, { id }) => {
        acc[id] = scopedEvents.filter((event) => matchesFilter(event, id, timeWindow)).length;
        return acc;
      }, {}),
    [scopedEvents, timeWindow],
  );

  const filterItems: FilterItem[] = useMemo(
    () => FILTERS.map(({ id, label }) => ({ id, label, count: counts[id] ?? 0 })),
    [counts],
  );

  const groups = useMemo(() => {
    const matching = scopedEvents.filter((event) => matchesFilter(event, filter, timeWindow));
    return groupByDay(sortForFilter(matching, filter));
  }, [scopedEvents, filter, timeWindow]);

  const showSkeleton = isLoading && scopedEvents.length === 0;
  const showError = Boolean(error) && !isLoading;
  const isEmpty = !showSkeleton && !showError && groups.length === 0;

  return (
    <div className="relative flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Events"
        subtitle={`${counts.upcoming ?? 0} upcoming · ${counts.today ?? 0} today`}
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label="New event"
            onClick={() => setSheetOpen(true)}
          >
            <Plus />
          </Button>
        }
      />

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 pb-3 pt-2">
        <FilterBar
          aria-label="Event filters"
          filters={filterItems}
          active={filter}
          onChange={(id) => setFilter(id as EventFilter)}
        />
      </div>

      {/* ── Agenda ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-3">
        {showSkeleton && <ListSkeleton count={5} />}

        {showError && (
          <ErrorState
            title="Couldn't load your calendar"
            description="We couldn't reach your calendar accounts just now."
            detail={error ?? undefined}
            isRetrying={isLoading}
            onRetry={() => void fetchEvents()}
          />
        )}

        {isEmpty && (
          <EmptyState
            icon={<CalendarDays />}
            title={EMPTY_COPY[filter].title}
            description={EMPTY_COPY[filter].description}
            action={{ label: 'New event', onClick: () => setSheetOpen(true) }}
            secondaryAction={
              filter === 'upcoming'
                ? undefined
                : { label: 'Show upcoming', onClick: () => setFilter('upcoming') }
            }
          />
        )}

        {!showError &&
          groups.map((group) => (
            <section key={group.key} className="mb-5">
              <h2
                className={cn(
                  'sticky top-0 z-10 -mx-1 mb-2 flex items-baseline gap-2 px-1 py-1.5',
                  'bg-gray-50/90 backdrop-blur-sm',
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">
                  {group.label}
                </span>
                {group.sublabel && (
                  <span className="text-[11px] font-normal text-gray-400">
                    {group.sublabel}
                  </span>
                )}
                <span className="ml-auto text-[11px] tabular-nums text-gray-400">
                  {group.events.length}
                </span>
              </h2>

              <div className="flex flex-col gap-2">
                {group.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="New event"
        className={cn(
          'absolute bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-orange-500 text-white transition-opacity active:opacity-60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        )}
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>

      <CreateEventSheet open={isSheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
