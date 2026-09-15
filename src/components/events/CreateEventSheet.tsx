import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import type {
  CalendarEvent,
  Contact,
  EventAttendee,
  EventType,
  RecurrenceType,
} from '@/types/index';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useEventStore } from '@/store/eventStore';
import { useContactStore } from '@/store/contactStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { eventTypeLabel } from './EventCard';

// =============================================================================
// CreateEventSheet
// =============================================================================

export interface CreateEventSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (event: CalendarEvent) => void;
  /** Pre-selects the day (YYYY-MM-DD) — used when creating from the calendar. */
  defaultDate?: string;
}

const EVENT_TYPES: EventType[] = ['meeting', 'call', 'deadline', 'reminder', 'personal'];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

/** iCal RRULE emitted for each supported recurrence. */
const RECURRENCE_RULES: Record<RecurrenceType, string | null> = {
  none: null,
  daily: 'FREQ=DAILY',
  weekdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  weekly: 'FREQ=WEEKLY',
  biweekly: 'FREQ=WEEKLY;INTERVAL=2',
  monthly: 'FREQ=MONTHLY',
  yearly: 'FREQ=YEARLY',
  custom: null,
};

const REMINDER_OPTIONS: { value: number; label: string }[] = [
  { value: -1, label: 'No reminder' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

const MAX_CONTACT_SUGGESTIONS = 6;

const fieldLabel = 'text-sm font-medium text-gray-700';

const selectClass = cn(
  'h-11 w-full rounded-lg border border-gray-100 bg-white px-3.5 text-sm text-gray-900',
  'transition-colors duration-150 ease-out hover:border-gray-400',
  'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
);

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function primaryEmail(contact: Contact): string {
  const primary = contact.emails.find((e) => e.isPrimary) ?? contact.emails[0];
  return primary?.email ?? '';
}

/**
 * Builds the instant for one end of the event. All-day events are pinned to
 * midnight so they sort ahead of timed events on the same day.
 */
function toIso(date: string, time: string, isAllDay: boolean): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T${isAllDay ? '00:00' : time || '09:00'}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function CreateEventSheet({
  open,
  onClose,
  onCreated,
  defaultDate,
}: CreateEventSheetProps) {
  const createEvent = useEventStore((s) => s.createEvent);
  const calendarAccounts = useEventStore((s) => s.calendarAccounts);
  const contacts = useContactStore((s) => s.contacts);
  const addToast = useUIStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [isAllDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [accountId, setAccountId] = useState('');
  const [participants, setParticipants] = useState<Contact[]>([]);
  const [contactQuery, setContactQuery] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [reminder, setReminder] = useState(15);
  const [type, setType] = useState<EventType>('meeting');
  const [errors, setErrors] = useState<{ title?: string; range?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Writable calendars only — you cannot add an event to a read-only feed.
  const writableAccounts = useMemo(
    () => calendarAccounts.filter((a) => a.accessRole !== 'reader'),
    [calendarAccounts],
  );

  // Reset to a clean draft each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    const day = defaultDate || todayInputValue();
    setTitle('');
    setAllDay(false);
    setStartDate(day);
    setStartTime('09:00');
    setEndDate(day);
    setEndTime('10:00');
    setLocation('');
    setAccountId(
      writableAccounts.find((a) => a.isPrimary)?.id ?? writableAccounts[0]?.id ?? '',
    );
    setParticipants([]);
    setContactQuery('');
    setDescription('');
    setRecurrence('none');
    setReminder(15);
    setType('meeting');
    setErrors({});
    setIsSaving(false);
  }, [open, defaultDate, writableAccounts]);

  const suggestions = useMemo(() => {
    const query = contactQuery.trim().toLowerCase();
    if (!query) return [];
    const chosen = new Set(participants.map((p) => p.id));
    return contacts
      .filter((contact) => {
        if (chosen.has(contact.id)) return false;
        return (
          contact.displayName.toLowerCase().includes(query) ||
          (contact.company?.toLowerCase().includes(query) ?? false) ||
          contact.emails.some((e) => e.email.toLowerCase().includes(query))
        );
      })
      .slice(0, MAX_CONTACT_SUGGESTIONS);
  }, [contacts, contactQuery, participants]);

  const addParticipant = (contact: Contact) => {
    setParticipants((prev) => [...prev, contact]);
    setContactQuery('');
  };

  const removeParticipant = (contactId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== contactId));
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const startAt = toIso(startDate, startTime, isAllDay);
    const endAt = toIso(endDate || startDate, endTime, isAllDay);

    const nextErrors: { title?: string; range?: string } = {};
    if (!trimmedTitle) nextErrors.title = 'Give the event a title.';
    if (!startAt || !endAt) nextErrors.range = 'Pick a start and end date.';
    else if (!isAllDay && Date.parse(endAt) <= Date.parse(startAt)) {
      nextErrors.range = 'The event must end after it starts.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    const attendees: EventAttendee[] = participants.map((contact) => ({
      email: primaryEmail(contact),
      displayName: contact.displayName,
      responseStatus: 'needsAction',
      isOrganizer: false,
      isOptional: false,
    }));

    try {
      const event = await createEvent({
        title: trimmedTitle,
        description: description.trim() || null,
        location: location.trim() || null,
        type,
        startAt: startAt as string,
        endAt: endAt as string,
        isAllDay,
        calendarAccountId: accountId || undefined,
        attendees,
        recurrenceType: recurrence,
        recurrenceRule: RECURRENCE_RULES[recurrence],
        reminderMinutesBefore: reminder >= 0 ? [reminder] : [],
      });

      addToast({ variant: 'success', title: 'Event created', message: event.title });
      onCreated?.(event);
      onClose();
    } catch {
      addToast({
        variant: 'error',
        title: "Couldn't create event",
        message: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="New event">
      <div className="flex flex-col gap-5 px-5 pb-6 pt-4">
        {/* ── Title ─────────────────────────────────────────────────────── */}
        <Input
          label="Title"
          required
          autoFocus
          value={title}
          error={errors.title}
          placeholder="What's happening?"
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
        />

        {/* ── All-day toggle ────────────────────────────────────────────── */}
        <button
          type="button"
          role="switch"
          aria-checked={isAllDay}
          onClick={() => setAllDay((v) => !v)}
          className={cn(
            'flex items-center justify-between rounded-lg border px-3.5 py-3 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            isAllDay ? 'border-orange-300 bg-orange-50' : 'border-gray-100 bg-white hover:bg-gray-50',
          )}
        >
          <span className="text-sm font-medium text-gray-800">All day</span>
          <span
            aria-hidden="true"
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
              isAllDay ? 'bg-orange-500' : 'bg-gray-200',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                isAllDay ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </span>
        </button>

        {/* ── Start / end ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Starts"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                // Keep the end on or after the start as the user edits.
                if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
              }}
            />
            {!isAllDay && (
              <Input
                label="Start time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ends"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {!isAllDay && (
              <Input
                label="End time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            )}
          </div>

          {errors.range && (
            <p role="alert" className="text-xs text-red-600">
              {errors.range}
            </p>
          )}
        </div>

        {/* ── Location ──────────────────────────────────────────────────── */}
        <Input
          label="Location"
          value={location}
          prefix={<MapPin />}
          placeholder="Room, address, or meeting link"
          onChange={(e) => setLocation(e.target.value)}
        />

        {/* ── Calendar account ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="create-event-calendar">
            Calendar
          </label>
          <select
            id="create-event-calendar"
            className={selectClass}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {writableAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── Participants ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className={fieldLabel}>Participants</span>

          {participants.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {participants.map((contact) => (
                <li
                  key={contact.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2"
                >
                  <Avatar size="xs" name={contact.displayName} src={contact.avatarUrl} />
                  <span className="max-w-[140px] truncate text-xs font-medium text-gray-700">
                    {contact.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeParticipant(contact.id)}
                    aria-label={`Remove ${contact.displayName}`}
                    className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="relative">
            <Input
              value={contactQuery}
              prefix={<Search />}
              placeholder="Search contacts…"
              aria-label="Search contacts"
              onChange={(e) => setContactQuery(e.target.value)}
            />

            {suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-100 bg-white py-1">
                {suggestions.map((contact) => (
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() => addParticipant(contact)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                    >
                      <Avatar size="sm" name={contact.displayName} src={contact.avatarUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800">
                          {contact.displayName}
                        </span>
                        <span className="block truncate text-xs text-gray-400">
                          {primaryEmail(contact)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Description ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="create-event-description">
            Description
          </label>
          <textarea
            id="create-event-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda, notes, dial-in details…"
            className={cn(
              'w-full resize-y rounded-lg border border-gray-100 bg-white px-3.5 py-2.5 text-sm',
              'text-gray-900 placeholder-gray-400 transition-colors duration-150',
              'hover:border-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
            )}
          />
        </div>

        {/* ── Recurrence + reminder ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="create-event-recurrence">
              Repeats
            </label>
            <select
              id="create-event-recurrence"
              className={selectClass}
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel} htmlFor="create-event-reminder">
              Reminder
            </label>
            <select
              id="create-event-reminder"
              className={selectClass}
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
            >
              {REMINDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Event type ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>Event type</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Event type">
            {EVENT_TYPES.map((value) => {
              const isActive = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setType(value)}
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
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} isLoading={isSaving}>
            Create event
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default CreateEventSheet;
