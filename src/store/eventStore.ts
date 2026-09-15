import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarEvent, CalendarAccount } from '@/types/index';
import { mockApi } from '@/services/mockApi';
import { mockEvents, mockCalendarAccounts } from '@/data/events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventStore {
  // State
  events: CalendarEvent[];
  isLoading: boolean;
  selectedDate: string; // ISO date string (YYYY-MM-DD)
  selectedEvent: CalendarEvent | null;
  calendarAccounts: CalendarAccount[];
  error: string | null;

  // Actions
  fetchEvents: (from?: string, to?: string) => Promise<void>;
  createEvent: (input: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  selectEvent: (event: CalendarEvent | null) => void;
  toggleCalendarAccount: (accountId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function buildEvent(input: Partial<CalendarEvent>): CalendarEvent {
  const startAt = input.startAt ?? now();
  const endAt = input.endAt ?? new Date(Date.parse(startAt) + 3_600_000).toISOString();
  return {
    id: `event-${Date.now()}`,
    calendarAccountId: input.calendarAccountId ?? 'cal-account-001',
    externalId: `ext-${Date.now()}`,
    title: input.title ?? 'Untitled Event',
    description: input.description ?? null,
    location: input.location ?? null,
    videoConferenceUrl: input.videoConferenceUrl ?? null,
    type: input.type ?? 'meeting',
    startAt,
    endAt,
    isAllDay: input.isAllDay ?? false,
    timeZone: input.timeZone ?? 'America/Los_Angeles',
    recurrenceType: input.recurrenceType ?? 'none',
    recurrenceRule: input.recurrenceRule ?? null,
    recurrenceInstanceId: null,
    attendees: input.attendees ?? [],
    organizerEmail: input.organizerEmail ?? null,
    color: input.color ?? null,
    isPrivate: input.isPrivate ?? false,
    isCancelled: false,
    isTentative: input.isTentative ?? false,
    createdAt: now(),
    updatedAt: now(),
    reminderMinutesBefore: input.reminderMinutesBefore ?? [15],
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      events: mockEvents,
      isLoading: false,
      selectedDate: new Date().toISOString().slice(0, 10),
      selectedEvent: null,
      calendarAccounts: mockCalendarAccounts,
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      fetchEvents: async (_from?: string, _to?: string) => {
        set({ isLoading: true, error: null });
        try {
          await mockApi.events.list();
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },

      createEvent: async (input: Partial<CalendarEvent>) => {
        const event = buildEvent(input);
        set((s) => ({ events: [...s.events, event] }));
        try {
          await mockApi.events.create({
            title: event.title,
            start: event.startAt,
            end: event.endAt,
            description: event.description ?? '',
            location: event.location ?? '',
          });
        } catch {
          set((s) => ({ events: s.events.filter((e) => e.id !== event.id) }));
          throw new Error('Failed to create event');
        }
        return event;
      },

      updateEvent: async (id: string, patch: Partial<CalendarEvent>) => {
        const prev = get().events.find((e) => e.id === id);
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: now() } : e
          ),
          selectedEvent: s.selectedEvent?.id === id
            ? { ...s.selectedEvent, ...patch, updatedAt: now() }
            : s.selectedEvent,
        }));
        try {
          await mockApi.events.update(id, patch as Record<string, unknown>);
        } catch {
          if (prev) {
            set((s) => ({ events: s.events.map((e) => (e.id === id ? prev : e)) }));
          }
          throw new Error('Failed to update event');
        }
      },

      deleteEvent: async (id: string) => {
        const prev = get().events.find((e) => e.id === id);
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          selectedEvent: s.selectedEvent?.id === id ? null : s.selectedEvent,
        }));
        try {
          await mockApi.events.delete(id);
        } catch {
          if (prev) set((s) => ({ events: [...s.events, prev] }));
          throw new Error('Failed to delete event');
        }
      },

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

      selectEvent: (event: CalendarEvent | null) => {
        set({ selectedEvent: event });
      },

      toggleCalendarAccount: (accountId: string) => {
        set((s) => ({
          calendarAccounts: s.calendarAccounts.map((a) =>
            a.id === accountId ? { ...a, isVisible: !a.isVisible } : a
          ),
        }));
      },
    }),
    {
      name: 'busyme_events',
      partialize: (s) => ({
        events: s.events,
        calendarAccounts: s.calendarAccounts,
        selectedDate: s.selectedDate,
      }),
    }
  )
);
