import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarEvent } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventCard, resolveEventColor } from '@/components/events/EventCard';
import { CreateEventSheet } from '@/components/events/CreateEventSheet';
import { useEventStore } from '@/store/eventStore';
import { cn, formatDate } from '@/lib/utils';

// =============================================================================
// Calendar maths
//
// The grid is built by hand rather than with a date-picker library so the month
// view can carry per-day event dots and match the rest of the app's styling.
// =============================================================================

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Weeks rendered per month — fixed at 6 so the grid never changes height. */
const WEEKS_IN_GRID = 6;
const DAYS_IN_WEEK = 7;

/** Guards the day-index expansion against absurd multi-year event spans. */
const MAX_EVENT_SPAN_DAYS = 90;

/** Dots drawn under a day before collapsing into a "+" indicator. */
const MAX_DOTS = 3;

interface GridDay {
  date: Date;
  key: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
}

/** Local-time `YYYY-MM-DD` key. Avoids the UTC shift `toISOString()` causes. */
function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Midnight-aligned copy, so day comparisons ignore the clock. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Six weeks of days covering `month`, padded with the neighbouring months so
 * every row is full. Weeks start on Monday.
 */
function buildMonthGrid(year: number, month: number): GridDay[] {
  const firstOfMonth = new Date(year, month, 1);
  // getDay() is Sunday-based; shift so Monday === 0.
  const leadingDays = (firstOfMonth.getDay() + 6) % DAYS_IN_WEEK;
  const gridStart = new Date(year, month, 1 - leadingDays);

  return Array.from({ length: WEEKS_IN_GRID * DAYS_IN_WEEK }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    return {
      date,
      key: dateKey(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

/**
 * Buckets events by every local day they touch, so a multi-day event shows a
 * dot on each of its days rather than only on the day it starts.
 */
function indexEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const index = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    if (Number.isNaN(start.getTime())) continue;

    const firstDay = startOfDay(start);
    const lastDay = startOfDay(Number.isNaN(end.getTime()) ? start : end);

    const spanDays = Math.min(
      Math.max(0, Math.round((lastDay.getTime() - firstDay.getTime()) / 86_400_000)),
      MAX_EVENT_SPAN_DAYS,
    );

    for (let offset = 0; offset <= spanDays; offset += 1) {
      const day = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + offset);
      const key = dateKey(day);
      const bucket = index.get(key);
      if (bucket) bucket.push(event);
      else index.set(key, [event]);
    }
  }

  // Within a day, all-day events first, then chronologically.
  for (const bucket of index.values()) {
    bucket.sort((a, b) => {
      if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
      return Date.parse(a.startAt) - Date.parse(b.startAt);
    });
  }

  return index;
}

// =============================================================================
// Page
// =============================================================================

export default function CalendarPage() {
  const events = useEventStore((s) => s.events);
  const calendarAccounts = useEventStore((s) => s.calendarAccounts);
  const toggleCalendarAccount = useEventStore((s) => s.toggleCalendarAccount);
  const selectedDate = useEventStore((s) => s.selectedDate);
  const setSelectedDate = useEventStore((s) => s.setSelectedDate);
  const fetchEvents = useEventStore((s) => s.fetchEvents);

  const [isSheetOpen, setSheetOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const base = parseDateKey(selectedDate);
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const todayKey = useMemo(() => dateKey(new Date()), []);

  // Events on calendars the user has hidden should not appear anywhere.
  const visibleEvents = useMemo(() => {
    const visibleIds = new Set(
      calendarAccounts.filter((a) => a.isVisible).map((a) => a.id),
    );
    return events.filter((event) => visibleIds.has(event.calendarAccountId));
  }, [events, calendarAccounts]);

  const eventsByDay = useMemo(() => indexEventsByDay(visibleEvents), [visibleEvents]);

  const grid = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const selectedEvents = eventsByDay.get(selectedDate) ?? [];

  const monthLabel = formatDate(new Date(cursor.year, cursor.month, 1), {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta: number) => {
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDate(dateKey(today));
  };

  const handleSelectDay = (day: GridDay) => {
    setSelectedDate(day.key);
    // Tapping a padded day pulls the grid to the month that day belongs to.
    if (!day.isCurrentMonth) {
      setCursor({ year: day.date.getFullYear(), month: day.date.getMonth() });
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Calendar"
        rightActions={
          <Button size="sm" variant="ghost" onClick={goToToday}>
            Today
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-28">
        {/* ── Month grid ──────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 bg-white px-3 pb-4 pt-3">
          {/* Month navigation */}
          <div className="mb-3 flex items-center justify-between px-1">
            <Button
              iconOnly
              size="sm"
              variant="ghost"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft />
            </Button>

            <h2 className="text-sm font-semibold text-gray-900">{monthLabel}</h2>

            <Button
              iconOnly
              size="sm"
              variant="ghost"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight />
            </Button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400"
              >
                {label.slice(0, 1)}
                <span className="sr-only">{label}</span>
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day) => {
              const dayEvents = eventsByDay.get(day.key) ?? [];
              const isSelected = day.key === selectedDate;
              const isToday = day.key === todayKey;

              return (
                <button
                  key={day.key}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${formatDate(day.date, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}${dayEvents.length ? `, ${dayEvents.length} events` : ''}`}
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    'flex h-12 flex-col items-center justify-center gap-1 rounded-lg',
                    'transition-colors duration-150 ease-out',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : cn(
                          'hover:bg-gray-100',
                          day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300',
                        ),
                  )}
                >
                  <span
                    className={cn(
                      'text-sm leading-none tabular-nums',
                      isToday && !isSelected && 'font-bold text-orange-600',
                      isSelected && 'font-semibold',
                    )}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Event dots */}
                  <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
                    {dayEvents.slice(0, MAX_DOTS).map((event) => (
                      <span
                        key={event.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(255,255,255,0.9)'
                            : resolveEventColor(event, calendarAccounts),
                        }}
                      />
                    ))}
                    {dayEvents.length > MAX_DOTS && (
                      <span
                        className={cn(
                          'text-[9px] font-bold leading-none',
                          isSelected ? 'text-white/90' : 'text-gray-400',
                        )}
                      >
                        +
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Calendar legend / visibility toggles */}
          {calendarAccounts.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              {calendarAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  aria-pressed={account.isVisible}
                  onClick={() => toggleCalendarAccount(account.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
                    'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                    account.isVisible
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-transparent text-gray-400 line-through',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: account.isVisible ? account.color : '#d1d5db',
                    }}
                  />
                  {account.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Selected day's events ───────────────────────────────────── */}
        <section className="px-4 pt-4">
          <h2 className="mb-3 flex items-baseline gap-2 px-1">
            <span className="text-sm font-semibold text-gray-900">
              {formatDate(parseDateKey(selectedDate), {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {selectedEvents.length > 0 && (
              <span className="text-xs tabular-nums text-gray-400">
                {selectedEvents.length} event{selectedEvents.length === 1 ? '' : 's'}
              </span>
            )}
          </h2>

          {selectedEvents.length === 0 ? (
            <EmptyState
              compact
              icon={<CalendarDays />}
              title="Nothing scheduled"
              description="This day is clear. Create an event to fill it."
              action={{ label: 'New event', onClick: () => setSheetOpen(true) }}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="New event"
        className={cn(
          'absolute bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-orange-500 text-white',
          'transition-all duration-200 ease-out hover:bg-orange-600 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        )}
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>

      <CreateEventSheet
        open={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        defaultDate={selectedDate}
      />
    </div>
  );
}
