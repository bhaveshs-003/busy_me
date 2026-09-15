import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { CalendarAccount, CalendarEvent, EventType } from '@/types/index';
import type { BadgeColor } from '@/components/ui/Badge';
import { Badge } from '@/components/ui/Badge';
import { AvatarGroup } from '@/components/ui/Avatar';
import { useEventStore } from '@/store/eventStore';
import { cn, formatDate } from '@/lib/utils';

// =============================================================================
// Shared event helpers
// =============================================================================

export const eventTypeLabel: Record<EventType, string> = {
  meeting: 'Meeting',
  call: 'Call',
  deadline: 'Deadline',
  reminder: 'Reminder',
  personal: 'Personal',
};

export const eventTypeBadgeColor: Record<EventType, BadgeColor> = {
  meeting: 'blue',
  call: 'green',
  deadline: 'red',
  reminder: 'yellow',
  personal: 'gray',
};

/** Neutral fallback when neither the event nor its calendar carries a color. */
const DEFAULT_EVENT_COLOR = '#94a3b8';

/**
 * Per-event override wins, otherwise the colour of the calendar the event
 * lives on, otherwise a neutral grey.
 */
export function resolveEventColor(
  event: CalendarEvent,
  accounts: CalendarAccount[],
): string {
  if (event.color) return event.color;
  const account = accounts.find((a) => a.id === event.calendarAccountId);
  return account?.color ?? DEFAULT_EVENT_COLOR;
}

function formatClock(iso: string): string {
  return formatDate(iso, { hour: 'numeric', minute: '2-digit' });
}

/** "9:00 AM – 10:00 AM", or "All day" for all-day events. */
export function formatEventTimeRange(event: CalendarEvent): string {
  if (event.isAllDay) return 'All day';
  return `${formatClock(event.startAt)} – ${formatClock(event.endAt)}`;
}

/** True when the event's window contains the given instant. */
export function isEventInProgress(event: CalendarEvent, now: number = Date.now()): boolean {
  const start = Date.parse(event.startAt);
  const end = Date.parse(event.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return start <= now && now < end;
}

// =============================================================================
// EventCard
// =============================================================================

export interface EventCardProps {
  event: CalendarEvent;
  /** Overrides navigation to the event detail route. */
  onClick?: (event: CalendarEvent) => void;
  className?: string;
}

export function EventCard({ event, onClick, className }: EventCardProps) {
  const navigate = useNavigate();
  const calendarAccounts = useEventStore((s) => s.calendarAccounts);

  const color = resolveEventColor(event, calendarAccounts);
  const inProgress = isEventInProgress(event);

  const handleOpen = () => {
    if (onClick) onClick(event);
    else navigate(`/events/${event.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      className={cn(
        'relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-white p-3.5 text-left',
        'transition-all duration-200 ease-out hover:border-gray-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        event.isCancelled ? 'border-gray-100/60 opacity-60' : 'border-gray-100/80',
        className,
      )}
    >
      {/* ── Calendar colour indicator ──────────────────────────────────── */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
      />

      <div className="min-w-0 flex-1 pl-1.5">
        {/* Time range */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-semibold tabular-nums',
              inProgress ? 'text-orange-600' : 'text-gray-500',
            )}
          >
            {formatEventTimeRange(event)}
          </span>
          {inProgress && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600">
              <span className="h-1.5 w-1.5 animate-pulse-subtle rounded-full bg-orange-500" aria-hidden="true" />
              Now
            </span>
          )}
        </div>

        {/* Title */}
        <p
          className={cn(
            'mt-1 truncate text-sm font-medium leading-snug text-gray-900',
            event.isCancelled && 'line-through',
          )}
        >
          {event.title}
        </p>

        {/* Location */}
        {event.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{event.location}</span>
          </p>
        )}

        {/* Participants + type */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {event.attendees.length > 0 ? (
            <AvatarGroup
              size="xs"
              max={3}
              avatars={event.attendees.map((attendee) => ({
                name: attendee.displayName ?? attendee.email,
              }))}
            />
          ) : (
            <span />
          )}

          <Badge color={eventTypeBadgeColor[event.type]} size="sm">
            {eventTypeLabel[event.type]}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
