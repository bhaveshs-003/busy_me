import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  Check,
  Layers,
  MapPin,
  Pencil,
  Repeat,
  Trash2,
  Video,
} from 'lucide-react';
import type { CalendarEvent, EventAttendee, EventType } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  eventTypeBadgeColor,
  eventTypeLabel,
  resolveEventColor,
} from '@/components/events/EventCard';
import { useEventStore } from '@/store/eventStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate } from '@/lib/utils';

// =============================================================================
// Helpers
// =============================================================================

const EVENT_TYPES: EventType[] = ['meeting', 'call', 'deadline', 'reminder', 'personal'];

const sectionLabel = 'text-xs font-semibold uppercase tracking-wide text-gray-400';

const selectClass = cn(
  'h-11 w-full rounded-lg border border-gray-100 bg-white px-3.5 text-sm text-gray-900',
  'transition-colors duration-150 ease-out hover:border-gray-400',
  'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
);

const RESPONSE_LABEL: Record<EventAttendee['responseStatus'], string> = {
  accepted: 'Going',
  declined: 'Declined',
  tentative: 'Maybe',
  needsAction: 'No reply',
};

const RESPONSE_COLOR: Record<EventAttendee['responseStatus'], string> = {
  accepted: 'text-emerald-600',
  declined: 'text-red-500',
  tentative: 'text-amber-600',
  needsAction: 'text-gray-400',
};

const RECURRENCE_DESCRIPTION: Record<string, string> = {
  none: 'Does not repeat',
  daily: 'Repeats every day',
  weekdays: 'Repeats every weekday',
  weekly: 'Repeats every week',
  biweekly: 'Repeats every two weeks',
  monthly: 'Repeats every month',
  yearly: 'Repeats every year',
  custom: 'Custom recurrence',
};

/** Human label for a reminder offset expressed in minutes before the start. */
function formatReminder(minutes: number): string {
  if (minutes === 0) return 'At start time';
  if (minutes < 60) return `${minutes} minutes before`;
  if (minutes < 1440) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'} before`;
  }
  const days = minutes / 1440;
  return `${days} day${days === 1 ? '' : 's'} before`;
}

/**
 * Full date/time range. Same-day events collapse to one date with a time range;
 * multi-day events spell out both ends.
 */
function formatFullRange(event: CalendarEvent): string {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (event.isAllDay) {
    return sameDay
      ? formatDate(start, dateOpts)
      : `${formatDate(start, dateOpts)} – ${formatDate(end, dateOpts)}`;
  }

  if (sameDay) {
    return `${formatDate(start, dateOpts)} · ${formatDate(start, timeOpts)} – ${formatDate(end, timeOpts)}`;
  }

  return `${formatDate(start, { ...dateOpts, ...timeOpts })} – ${formatDate(end, { ...dateOpts, ...timeOpts })}`;
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-gray-100/80 bg-white p-4', className)}>
      <h2 className={cn(sectionLabel, 'mb-3')}>{title}</h2>
      {children}
    </section>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const event = useEventStore((s) => s.events.find((e) => e.id === id));
  const calendarAccounts = useEventStore((s) => s.calendarAccounts);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const deleteEvent = useEventStore((s) => s.deleteEvent);
  const packs = useResearchPackStore((s) => s.packs);
  const addItemToPack = useResearchPackStore((s) => s.addItemToPack);
  const updatePack = useResearchPackStore((s) => s.updatePack);
  const addToast = useUIStore((s) => s.addToast);

  const [isEditing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  // Adopt stored values whenever a different event is loaded.
  useEffect(() => {
    if (!event) return;
    setTitleDraft(event.title);
    setLocationDraft(event.location ?? '');
    setDescriptionDraft(event.description ?? '');
    setEditing(false);
    // Re-sync on identity only, so an in-flight write never clobbers typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  const account = useMemo(
    () => calendarAccounts.find((a) => a.id === event?.calendarAccountId) ?? null,
    [calendarAccounts, event?.calendarAccountId],
  );

  const linkedPack = useMemo(
    () => packs.find((p) => p.id === event?.linkedResearchPackId) ?? null,
    [packs, event?.linkedResearchPackId],
  );

  if (!event) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Event" showBack />
        <EmptyState
          icon={<CalendarDays />}
          title="Event not found"
          description="This event may have been deleted or never existed."
          action={{ label: 'Back to calendar', onClick: () => navigate('/calendar') }}
        />
      </div>
    );
  }

  const color = resolveEventColor(event, calendarAccounts);
  const reminders = event.reminderMinutesBefore ?? [];

  // ── Mutations ────────────────────────────────────────────────────────
  const patch = async (changes: Partial<CalendarEvent>) => {
    try {
      await updateEvent(event.id, changes);
    } catch {
      addToast({ variant: 'error', title: "Couldn't save changes", message: 'Please try again.' });
    }
  };

  const commitEdits = () => {
    const trimmedTitle = titleDraft.trim();
    void patch({
      title: trimmedTitle || event.title,
      location: locationDraft.trim() || null,
      description: descriptionDraft.trim() || null,
    });
    if (!trimmedTitle) setTitleDraft(event.title);
    setEditing(false);
  };

  const cancelEdits = () => {
    setTitleDraft(event.title);
    setLocationDraft(event.location ?? '');
    setDescriptionDraft(event.description ?? '');
    setEditing(false);
  };

  const handleAddToPack = async (packId: string) => {
    if (!packId) return;
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return;

    addItemToPack(packId, {
      type: 'event',
      title: event.title,
      summary: event.description,
      occurredAt: event.startAt,
      linkedEventId: event.id,
      metadata: {},
      isAIGenerated: false,
    });

    try {
      // Keep the pack's own link list in step with the timeline entry.
      if (!pack.linkedEventIds.includes(event.id)) {
        await updatePack(packId, { linkedEventIds: [...pack.linkedEventIds, event.id] });
      }
      await patch({ linkedResearchPackId: packId });
      addToast({
        variant: 'success',
        title: 'Added to research pack',
        message: pack.title,
      });
    } catch {
      addToast({ variant: 'error', title: "Couldn't add to research pack" });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      addToast({ variant: 'success', title: 'Event deleted', message: event.title });
      navigate('/calendar', { replace: true });
    } catch {
      addToast({ variant: 'error', title: "Couldn't delete event" });
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Event"
        showBack
        rightActions={
          isEditing ? (
            <Button size="sm" variant="ghost" onClick={commitEdits} leftIcon={<Check />}>
              Done
            </Button>
          ) : (
            <Button
              iconOnly
              variant="ghost"
              aria-label="Edit event"
              onClick={() => setEditing(true)}
            >
              <Pencil />
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {/* ── Title + when ───────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-lg border border-gray-100/80 bg-white p-4">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1.5"
              style={{ backgroundColor: color }}
            />

            <div className="pl-2">
              {isEditing ? (
                <Input
                  label="Title"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                />
              ) : (
                <h1
                  className={cn(
                    'text-lg font-semibold leading-snug text-gray-900',
                    event.isCancelled && 'line-through',
                  )}
                >
                  {event.title}
                </h1>
              )}

              <p className="mt-2 text-sm text-gray-600">{formatFullRange(event)}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge color={eventTypeBadgeColor[event.type]} size="sm">
                  {eventTypeLabel[event.type]}
                </Badge>
                {event.isAllDay && (
                  <Badge color="blue" size="sm">
                    All day
                  </Badge>
                )}
                {event.isTentative && (
                  <Badge color="yellow" size="sm">
                    Tentative
                  </Badge>
                )}
                {event.isCancelled && (
                  <Badge color="red" size="sm">
                    Cancelled
                  </Badge>
                )}
                {event.isPrivate && (
                  <Badge color="gray" size="sm">
                    Private
                  </Badge>
                )}
              </div>
            </div>
          </section>

          {/* ── Location ───────────────────────────────────────────────── */}
          <Section title="Location">
            {isEditing ? (
              <Input
                value={locationDraft}
                prefix={<MapPin />}
                placeholder="Room, address, or meeting link"
                onChange={(e) => setLocationDraft(e.target.value)}
              />
            ) : event.location ? (
              <p className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <span className="min-w-0 break-words">{event.location}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400">No location set.</p>
            )}

            {event.videoConferenceUrl && !isEditing && (
              <a
                href={event.videoConferenceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Video className="h-4 w-4" aria-hidden="true" />
                Join video call
              </a>
            )}
          </Section>

          {/* ── Calendar account ───────────────────────────────────────── */}
          <Section title="Calendar">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-800">
                  {account?.name ?? 'Unknown calendar'}
                </span>
                {account && (
                  <span className="block truncate text-xs text-gray-400">
                    {account.calendarId}
                  </span>
                )}
              </span>
              {account?.isPrimary && (
                <Badge color="gray" size="sm">
                  Primary
                </Badge>
              )}
            </div>
          </Section>

          {/* ── Participants ───────────────────────────────────────────── */}
          <Section
            title={`Participants${event.attendees.length ? ` · ${event.attendees.length}` : ''}`}
          >
            {event.attendees.length === 0 ? (
              <p className="text-sm text-gray-400">No one else is invited.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {event.attendees.map((attendee) => (
                  <li key={attendee.email} className="flex items-center gap-3">
                    <Avatar size="sm" name={attendee.displayName ?? attendee.email} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-gray-800">
                          {attendee.displayName ?? attendee.email}
                        </span>
                        {attendee.isOrganizer && (
                          <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                            Organiser
                          </span>
                        )}
                        {attendee.isOptional && (
                          <span className="shrink-0 text-[10px] uppercase text-gray-400">
                            Optional
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        {attendee.email}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-medium',
                        RESPONSE_COLOR[attendee.responseStatus],
                      )}
                    >
                      {RESPONSE_LABEL[attendee.responseStatus]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── Description ────────────────────────────────────────────── */}
          <Section title="Description">
            {isEditing ? (
              <textarea
                rows={4}
                aria-label="Event description"
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                placeholder="Agenda, notes, dial-in details…"
                className={cn(
                  'w-full resize-y rounded-lg border border-gray-100 bg-white px-3.5 py-2.5 text-sm',
                  'text-gray-900 placeholder-gray-400 transition-colors duration-150',
                  'hover:border-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
                )}
              />
            ) : event.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {event.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400">No description.</p>
            )}

            {event.aiSummary && !isEditing && (
              <p className="mt-3 rounded-lg bg-purple-50 px-3 py-2 text-xs leading-relaxed text-purple-800 ring-1 ring-inset ring-purple-200/70">
                <span className="font-semibold">AI summary · </span>
                {event.aiSummary}
              </p>
            )}
          </Section>

          {/* ── Event type ─────────────────────────────────────────────── */}
          <Section title="Event type">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Event type">
              {EVENT_TYPES.map((value) => {
                const isActive = event.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => void patch({ type: value })}
                    className={cn(
                      'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                      isActive
                        ? 'border-orange-500 bg-gray-100 text-gray-500'
                        : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {eventTypeLabel[value]}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Reminders + recurrence ─────────────────────────────────── */}
          <Section title="Reminders">
            {reminders.length === 0 ? (
              <p className="text-sm text-gray-400">No reminders set.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {reminders.map((minutes) => (
                  <li key={minutes} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Bell className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    {formatReminder(minutes)}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="flex items-center gap-2.5 text-sm text-gray-700">
                <Repeat className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                {RECURRENCE_DESCRIPTION[event.recurrenceType] ?? 'Does not repeat'}
              </p>
              {event.recurrenceRule && (
                <p className="mt-1 pl-6 font-mono text-[11px] text-gray-400">
                  {event.recurrenceRule}
                </p>
              )}
            </div>
          </Section>

          {/* ── Research pack ──────────────────────────────────────────── */}
          <Section title="Research pack">
            {linkedPack && (
              <button
                type="button"
                onClick={() => navigate(`/research-packs/${linkedPack.id}`)}
                className="mb-3 flex w-full items-center gap-3 rounded-lg border border-gray-100/80 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: linkedPack.color }}
                >
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800">
                    {linkedPack.title}
                  </span>
                  <span className="block text-xs capitalize text-gray-400">
                    {linkedPack.status}
                  </span>
                </span>
              </button>
            )}

            <label className="sr-only" htmlFor="event-add-to-pack">
              Add to research pack
            </label>
            <select
              id="event-add-to-pack"
              className={selectClass}
              value=""
              onChange={(e) => void handleAddToPack(e.target.value)}
            >
              <option value="">
                {linkedPack ? 'Add to another research pack…' : 'Add to research pack…'}
              </option>
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.title}
                </option>
              ))}
            </select>
          </Section>

          {/* ── Actions ────────────────────────────────────────────────── */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" className="flex-1" onClick={cancelEdits}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={commitEdits}>
                  Save changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Pencil />}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                  leftIcon={<Trash2 />}
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>

          {/* ── Timestamps ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1 px-1 pb-2 text-xs text-gray-400">
            <span>Created {formatDate(event.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>Updated {formatDate(event.updatedAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete this event?"
        description={`"${event.title}" will be removed from ${account?.name ?? 'your calendar'}. This cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
