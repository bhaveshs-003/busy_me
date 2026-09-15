import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  Layers,
  ListTodo,
  Mail,
  Search,
  StickyNote,
  Users,
} from 'lucide-react';
import type {
  CalendarEvent,
  Contact,
  Email,
  Note,
  ResearchPack,
  Task,
} from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/LoadingState';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmailCard } from '@/components/email/EmailCard';
import { EventCard } from '@/components/events/EventCard';
import { TaskCard, isTaskOverdue } from '@/components/tasks/TaskCard';
import { selectFolderEmails } from '@/store/emailStore';
import { useEmailStore } from '@/store/emailStore';
import { useEventStore } from '@/store/eventStore';
import { useTaskStore } from '@/store/taskStore';
import { useNoteStore } from '@/store/noteStore';
import { useContactStore } from '@/store/contactStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  dayBounds,
  dayLabel,
  isOnDay,
  isRecent,
  isUpcoming,
  isWithinWindow,
} from '@/lib/dateWindow';
import * as t from '@/lib/theme';

// =============================================================================
// Categories
// =============================================================================

type CategoryId = 'todo' | 'packs' | 'emails' | 'tasks' | 'events' | 'notes' | 'contacts';

interface CategoryMeta {
  id: CategoryId;
  label: string;
  /** Shorter label for the chip row, where horizontal space is scarce. */
  chipLabel?: string;
  /** Icon for the category's empty state. */
  icon: React.ReactNode;
  searchPlaceholder: string;
  /**
   * The category's dedicated full screen. Ongoings is a digest; each of these
   * pages carries the tools the digest omits (compose, grouping, A–Z, filters),
   * and with a four-tab bottom nav this is their only entry point.
   *
   * Absent for To-Do, which is a cross-entity view with no single home screen —
   * the "View all" affordance is hidden when there is nothing to open.
   */
  route?: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'todo', label: 'To-Do', icon: <ListTodo />, searchPlaceholder: 'Search this day…' },
  { id: 'packs', label: 'Research Packs', chipLabel: 'Packs', icon: <Layers />, searchPlaceholder: 'Search research packs…', route: '/research-packs' },
  { id: 'emails', label: 'Emails', icon: <Mail />, searchPlaceholder: 'Search emails…', route: '/emails' },
  { id: 'tasks', label: 'Tasks', icon: <ListTodo />, searchPlaceholder: 'Search tasks…', route: '/tasks' },
  { id: 'events', label: 'Events', icon: <CalendarDays />, searchPlaceholder: 'Search events…', route: '/events' },
  { id: 'notes', label: 'Notes', icon: <StickyNote />, searchPlaceholder: 'Search notes…', route: '/notes' },
  { id: 'contacts', label: 'Contacts', icon: <Users />, searchPlaceholder: 'Search contacts…', route: '/contacts' },
];

const CATEGORY_BY_ID: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, meta) => {
    acc[meta.id] = meta;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

/** Singular/plural noun used in the header subtitle. */
const CATEGORY_NOUN: Record<CategoryId, [string, string]> = {
  todo: ['item', 'items'],
  packs: ['research pack', 'research packs'],
  emails: ['email', 'emails'],
  tasks: ['task', 'tasks'],
  events: ['event', 'events'],
  notes: ['note', 'notes'],
  contacts: ['contact', 'contacts'],
};

// =============================================================================
// Ordering + matching
//
// Every category surfaces "what still needs me" first, then falls back to
// recency. The sorts run over shallow copies so store arrays stay untouched.
// =============================================================================

/** Packs whose last activity is inside this window read as "live". */
const PACK_PULSE_WINDOW_MS = 24 * 60 * 60 * 1000;

function packTimestamp(pack: ResearchPack): number {
  const parsed = Date.parse(pack.lastActivityAt ?? pack.updatedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function packItemCount(pack: ResearchPack): number {
  return (
    pack.linkedEmailIds.length +
    pack.linkedEventIds.length +
    pack.linkedTaskIds.length +
    pack.linkedNoteIds.length +
    pack.linkedContactIds.length +
    pack.linkedFileIds.length
  );
}

function isPackLive(pack: ResearchPack, now: number): boolean {
  if (!pack.lastActivityAt) return false;
  const last = Date.parse(pack.lastActivityAt);
  return !Number.isNaN(last) && now - last < PACK_PULSE_WINDOW_MS;
}

function sortPacks(packs: ResearchPack[]): ResearchPack[] {
  return [...packs].sort((a, b) => packTimestamp(b) - packTimestamp(a));
}

/** Unread first, then important, then newest. */
function sortEmails(emails: Email[]): Email[] {
  const rank = (email: Email) => {
    if (email.status === 'unread') return 0;
    if (email.isImportant) return 1;
    return 2;
  };
  return [...emails].sort((a, b) => {
    const delta = rank(a) - rank(b);
    return delta !== 0 ? delta : Date.parse(b.date) - Date.parse(a.date);
  });
}

/** Open before completed; overdue before the rest; then by due date. */
function sortTasks(tasks: Task[], now: number): Task[] {
  const rank = (task: Task) => {
    if (task.status === 'completed') return 2;
    return isTaskOverdue(task, now) ? 0 : 1;
  };
  const due = (task: Task) => {
    if (!task.dueDate) return Number.POSITIVE_INFINITY;
    const parsed = Date.parse(task.dueDate);
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
  };
  return [...tasks].sort((a, b) => {
    const delta = rank(a) - rank(b);
    return delta !== 0 ? delta : due(a) - due(b);
  });
}

/** Upcoming ascending (soonest first), then past descending. */
function sortEvents(events: CalendarEvent[], now: number): CalendarEvent[] {
  const start = (event: CalendarEvent) => {
    const parsed = Date.parse(event.startAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  return [...events].sort((a, b) => {
    const aUpcoming = start(a) >= now;
    const bUpcoming = start(b) >= now;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return aUpcoming ? start(a) - start(b) : start(b) - start(a);
  });
}

/** Pinned first, then most recently edited. */
function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

/** Favourites first, then alphabetical. */
function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });
}

/** Case-insensitive substring match across a row's searchable fields. */
function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some(
    (field) => typeof field === 'string' && field.toLowerCase().includes(needle),
  );
}

// =============================================================================
// Compact rows
// =============================================================================

const rowClass = cn(
  'flex w-full items-center gap-3 px-3.5 py-3 text-left',
  t.touchTarget,
  t.divider,
  t.pressable,
  t.focusRing,
);

/** Container that turns a stack of compact rows into one hairline card. */
function RowCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('overflow-hidden', t.surface, t.border, t.radius)}>{children}</div>
  );
}

function PackRow({
  pack,
  isLive,
  onOpen,
}: {
  pack: ResearchPack;
  isLive: boolean;
  onOpen: (pack: ResearchPack) => void;
}) {
  const itemCount = packItemCount(pack);
  const dotTone = isLive ? t.statusDot.active : t.statusDot.neutral;

  return (
    <button type="button" onClick={() => onOpen(pack)} className={rowClass}>
      <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center" aria-hidden="true">
        {isLive && (
          <span className={cn('absolute h-2.5 w-2.5 animate-pulse-subtle rounded-full', dotTone, 'opacity-40')} />
        )}
        <span className={cn('h-2 w-2 rounded-full', dotTone)} />
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn('block truncate', t.title)}>{pack.title}</span>
        <span className={cn('mt-0.5 block truncate', t.meta)}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
          {' · '}
          {/* A pack can carry a future `lastActivityAt` (scheduled work), and
              "updated in 2 weeks" reads as a bug — so the label always uses the
              backward-looking `updatedAt`. Sorting still uses lastActivityAt. */}
          updated {formatRelativeTime(pack.updatedAt)}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
    </button>
  );
}

function NoteRow({ note, onOpen }: { note: Note; onOpen: (note: Note) => void }) {
  const preview = note.bodyText.replace(/\s+/g, ' ').trim();

  return (
    <button type="button" onClick={() => onOpen(note)} className={rowClass}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <StickyNote className="h-4 w-4" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn('block truncate', t.title)}>{note.title}</span>
        <span className={cn('mt-0.5 block truncate', t.meta)}>
          {formatRelativeTime(note.updatedAt)}
          {preview ? ` · ${preview}` : ''}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
    </button>
  );
}

function ContactRow({
  contact,
  onOpen,
}: {
  contact: Contact;
  onOpen: (contact: Contact) => void;
}) {
  const secondary = [contact.jobTitle, contact.company].filter(Boolean).join(' · ');

  return (
    <button type="button" onClick={() => onOpen(contact)} className={rowClass}>
      <Avatar src={contact.avatarUrl} name={contact.displayName} size="sm" />

      <span className="min-w-0 flex-1">
        <span className={cn('block truncate', t.title)}>{contact.displayName}</span>
        <span className={cn('mt-0.5 block truncate', t.meta)}>
          {secondary || contact.emails[0]?.email || 'No company'}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
    </button>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function OngoingsPage() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);

  // ── Stores ───────────────────────────────────────────────────────────────
  const packs = useResearchPackStore((s) => s.packs);
  const packsLoading = useResearchPackStore((s) => s.isLoading);
  const packsError = useResearchPackStore((s) => s.error);
  const fetchPacks = useResearchPackStore((s) => s.fetchPacks);

  const emails = useEmailStore((s) => s.emails);
  const emailsLoading = useEmailStore((s) => s.isLoading);
  const emailsError = useEmailStore((s) => s.error);
  const fetchEmails = useEmailStore((s) => s.fetchEmails);
  const archiveEmail = useEmailStore((s) => s.archiveEmail);
  const markImportant = useEmailStore((s) => s.markImportant);

  const tasks = useTaskStore((s) => s.tasks);
  const tasksLoading = useTaskStore((s) => s.isLoading);
  const tasksError = useTaskStore((s) => s.error);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);

  const events = useEventStore((s) => s.events);
  const eventsLoading = useEventStore((s) => s.isLoading);
  const eventsError = useEventStore((s) => s.error);
  const fetchEvents = useEventStore((s) => s.fetchEvents);

  const notes = useNoteStore((s) => s.notes);
  const notesLoading = useNoteStore((s) => s.isLoading);
  const notesError = useNoteStore((s) => s.error);
  const fetchNotes = useNoteStore((s) => s.fetchNotes);

  const contacts = useContactStore((s) => s.contacts);
  const contactsLoading = useContactStore((s) => s.isLoading);
  const contactsError = useContactStore((s) => s.error);
  const fetchContacts = useContactStore((s) => s.fetchContacts);

  // ── Local state ──────────────────────────────────────────────────────────
  const [category, setCategory] = useState<CategoryId>('todo');
  /** Days from today for the To-Do view: -1, 0 or +1. */
  const [dayOffset, setDayOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [isSearchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    void fetchPacks();
    void fetchEmails();
    void fetchTasks();
    void fetchEvents();
    void fetchNotes();
    void fetchContacts();
  }, [fetchPacks, fetchEmails, fetchTasks, fetchEvents, fetchNotes, fetchContacts]);

  // Switching category must not carry the previous query across.
  const handleCategoryChange = useCallback((next: CategoryId) => {
    setCategory(next);
    setQuery('');
  }, []);

  // Captured once per render so every row is ranked against the same instant.
  const now = useMemo(() => Date.now(), []);

  // ── This-week pools (drive the chip counts) ──────────────────────────────
  //
  // Ongoings is a digest of what is live right now, so every category is cut to
  // a rolling 7-day window. Things that already happened look backwards; things
  // that are scheduled look forwards.
  const orderedPacks = useMemo(
    () =>
      sortPacks(
        packs.filter((pack) => isWithinWindow(pack.lastActivityAt ?? pack.updatedAt, now)),
      ),
    [packs, now],
  );

  const orderedEmails = useMemo(
    () =>
      sortEmails(
        selectFolderEmails(emails, 'inbox').filter((email) => isRecent(email.date, now)),
      ),
    [emails, now],
  );

  // Overdue work stays visible however old it is — a digest that hides what you
  // have already missed is worse than useless.
  const orderedTasks = useMemo(
    () =>
      sortTasks(
        tasks.filter(
          (task) =>
            isUpcoming(task.dueDate, now) ||
            (task.status !== 'completed' && isTaskOverdue(task, now)),
        ),
        now,
      ),
    [tasks, now],
  );

  const orderedEvents = useMemo(
    () => sortEvents(events.filter((event) => isUpcoming(event.startAt, now)), now),
    [events, now],
  );

  const orderedNotes = useMemo(
    () =>
      sortNotes(
        notes.filter((note) => !note.isArchived && isRecent(note.updatedAt, now)),
      ),
    [notes, now],
  );

  // Contacts have no timestamp of their own that means "this week", so the set
  // is derived: anyone on an in-window email or event, plus anyone the contact
  // record itself says was contacted recently.
  const activeAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const email of orderedEmails) {
      set.add(email.from.email.toLowerCase());
      for (const to of email.to) set.add(to.email.toLowerCase());
    }
    for (const event of orderedEvents) {
      for (const attendee of event.attendees) set.add(attendee.email.toLowerCase());
    }
    return set;
  }, [orderedEmails, orderedEvents]);

  const orderedContacts = useMemo(
    () =>
      sortContacts(
        contacts.filter(
          (contact) =>
            !contact.isBlocked &&
            (isRecent(contact.lastContactedAt, now) ||
              contact.emails.some((entry) => activeAddresses.has(entry.email.toLowerCase()))),
        ),
      ),
    [contacts, activeAddresses, now],
  );

  // ── To-Do: one calendar day, across entity types ─────────────────────────
  //
  // A separate axis from the 7-day digest above: these are the things that
  // actually land on the selected day.
  const bounds = useMemo(() => dayBounds(dayOffset, now), [dayOffset, now]);

  /** Due or reminded that day, and not already done. */
  const todoTasks = useMemo(
    () =>
      sortTasks(
        tasks.filter(
          (task) =>
            task.status !== 'completed' &&
            (isOnDay(task.dueDate, bounds) || isOnDay(task.reminderAt, bounds)),
        ),
        now,
      ),
    [tasks, bounds, now],
  );

  const todoEvents = useMemo(
    () => sortEvents(events.filter((event) => isOnDay(event.startAt, bounds)), now),
    [events, bounds, now],
  );

  /**
   * A pack lands on the day when its own due date does, or when any task or
   * event linked to it does. The counts come from the same filtered pools above
   * so the pack row and the Tasks/Events groups can never disagree.
   */
  const todoPacks = useMemo(
    () =>
      packs
        .map((pack) => {
          const pendingCount =
            todoTasks.filter(
              (t) => pack.linkedTaskIds.includes(t.id) || t.linkedResearchPackId === pack.id,
            ).length +
            todoEvents.filter(
              (e) => pack.linkedEventIds.includes(e.id) || e.linkedResearchPackId === pack.id,
            ).length;
          return { pack, pendingCount, isDue: isOnDay(pack.dueDate, bounds) };
        })
        .filter((row) => row.pendingCount > 0 || row.isDue)
        .sort((a, b) => b.pendingCount - a.pendingCount),
    [packs, todoTasks, todoEvents, bounds],
  );

  /** Notes never qualify alone — only as context on a pack that landed today. */
  const todoNotes = useMemo(() => {
    const packIds = new Set(todoPacks.map((row) => row.pack.id));
    if (packIds.size === 0) return [];
    return sortNotes(
      notes.filter(
        (note) =>
          !note.isArchived &&
          note.linkedResearchPackId !== undefined &&
          packIds.has(note.linkedResearchPackId),
      ),
    );
  }, [notes, todoPacks]);

  const todoTotal =
    todoTasks.length + todoEvents.length + todoPacks.length + todoNotes.length;

  const counts: Record<CategoryId, number> = useMemo(
    () => ({
      todo: todoTotal,
      packs: orderedPacks.length,
      emails: orderedEmails.length,
      tasks: orderedTasks.length,
      events: orderedEvents.length,
      notes: orderedNotes.length,
      contacts: orderedContacts.length,
    }),
    [
      todoTotal,
      orderedPacks,
      orderedEmails,
      orderedTasks,
      orderedEvents,
      orderedNotes,
      orderedContacts,
    ],
  );

  // ── Search applied within the active category ────────────────────────────
  const visiblePacks = useMemo(
    () => orderedPacks.filter((p) => matches(query, p.title)),
    [orderedPacks, query],
  );
  const visibleEmails = useMemo(
    () =>
      orderedEmails.filter((e) =>
        matches(query, e.subject, e.snippet, e.from.name, e.from.email),
      ),
    [orderedEmails, query],
  );
  const visibleTasks = useMemo(
    () => orderedTasks.filter((task) => matches(query, task.title, task.description)),
    [orderedTasks, query],
  );
  const visibleEvents = useMemo(
    () =>
      orderedEvents.filter((e) => matches(query, e.title, e.location, e.description)),
    [orderedEvents, query],
  );
  const visibleNotes = useMemo(
    () => orderedNotes.filter((n) => matches(query, n.title, n.bodyText, n.tags.join(' '))),
    [orderedNotes, query],
  );
  const visibleContacts = useMemo(
    () =>
      orderedContacts.filter((c) =>
        matches(query, c.displayName, c.company, c.jobTitle, c.emails[0]?.email),
      ),
    [orderedContacts, query],
  );

  const visibleCount: Record<CategoryId, number> = {
    todo: todoTotal,
    packs: visiblePacks.length,
    emails: visibleEmails.length,
    tasks: visibleTasks.length,
    events: visibleEvents.length,
    notes: visibleNotes.length,
    contacts: visibleContacts.length,
  };

  // ── Per-category loading / error plumbing ────────────────────────────────
  const loadingByCategory: Record<CategoryId, boolean> = {
    todo: false,
    packs: packsLoading,
    emails: emailsLoading,
    tasks: tasksLoading,
    events: eventsLoading,
    notes: notesLoading,
    contacts: contactsLoading,
  };

  const errorByCategory: Record<CategoryId, string | null> = {
    todo: null,
    packs: packsError,
    emails: emailsError,
    tasks: tasksError,
    events: eventsError,
    notes: notesError,
    contacts: contactsError,
  };

  const retryByCategory: Record<CategoryId, () => void> = {
    todo: () => undefined,
    packs: () => void fetchPacks(),
    emails: () => void fetchEmails(),
    tasks: () => void fetchTasks(),
    events: () => void fetchEvents(),
    notes: () => void fetchNotes(),
    contacts: () => void fetchContacts(),
  };

  const emptyByCategory: Record<
    CategoryId,
    { title: string; description: string; actionLabel: string; onAction: () => void }
  > = {
    todo: {
      title: `Nothing due ${dayLabel(dayOffset)}`,
      description:
        dayOffset === 0
          ? 'No tasks, events or packs land on today. Enjoy the quiet.'
          : `Nothing is scheduled for ${dayLabel(dayOffset)}.`,
      actionLabel: 'View all tasks',
      onAction: () => navigate('/tasks'),
    },
    packs: {
      title: 'No packs active this week',
      description: 'Nothing has moved in the last 7 days. Open all packs to see the rest.',
      actionLabel: 'View all packs',
      onAction: () => navigate('/research-packs'),
    },
    emails: {
      title: 'No mail this week',
      description: 'Nothing has arrived in the last 7 days. Your full inbox is still there.',
      actionLabel: 'Open inbox',
      onAction: () => navigate('/emails'),
    },
    tasks: {
      title: 'Nothing due this week',
      description: 'No tasks are due in the next 7 days and nothing is overdue.',
      actionLabel: 'View all tasks',
      onAction: () => navigate('/tasks'),
    },
    events: {
      title: 'Nothing scheduled this week',
      description: 'Your next 7 days are clear.',
      actionLabel: 'Open calendar',
      onAction: () => navigate('/calendar'),
    },
    notes: {
      title: 'No notes this week',
      description: 'Nothing has been written or edited in the last 7 days.',
      actionLabel: 'View all notes',
      onAction: () => navigate('/notes'),
    },
    contacts: {
      title: 'No one in touch this week',
      description: 'Nobody has appeared on your mail or calendar in the last 7 days.',
      actionLabel: 'View all contacts',
      onAction: () => navigate('/contacts'),
    },
  };

  const handleToggleComplete = useCallback(
    async (task: Task) => {
      try {
        if (task.status === 'completed') {
          await uncompleteTask(task.id);
        } else {
          await completeTask(task.id);
          addToast({ variant: 'success', title: 'Task completed', message: task.title });
        }
      } catch {
        addToast({
          variant: 'error',
          title: "Couldn't update task",
          message: 'Please try again.',
        });
      }
    },
    [completeTask, uncompleteTask, addToast],
  );

  const handleArchiveEmail = useCallback(
    (email: Email) => {
      void archiveEmail(email.id);
      addToast({ variant: 'success', title: 'Email archived', message: email.subject });
    },
    [archiveEmail, addToast],
  );

  // ── Render helpers ───────────────────────────────────────────────────────
  const activeMeta = CATEGORY_BY_ID[category];
  const total = counts[category];
  const shown = visibleCount[category];
  const error = errorByCategory[category];
  const showSkeleton = !error && loadingByCategory[category] && total === 0;
  const isEmpty = !error && !showSkeleton && shown === 0;
  const [singular, plural] = CATEGORY_NOUN[category];

  /** Hairline group heading inside the To-Do list. */
  const TodoGroup = ({ label, count, children }: { label: string; count: number; children: React.ReactNode }) =>
    count === 0 ? null : (
      <section>
        <h3 className={cn(t.label, 'mb-1.5 uppercase tracking-wide')}>
          {label} <span className="text-gray-400">{count}</span>
        </h3>
        {children}
      </section>
    );

  const renderList = () => {
    switch (category) {
      case 'todo':
        return (
          <div className="space-y-5">
            <TodoGroup label="Tasks" count={todoTasks.length}>
              <ul className="space-y-2">
                {todoTasks.map((task) => (
                  <li key={task.id}>
                    <TaskCard
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onClick={(x) => navigate(`/tasks/${x.id}`)}
                    />
                  </li>
                ))}
              </ul>
            </TodoGroup>

            <TodoGroup label="Events" count={todoEvents.length}>
              <ul className="space-y-2">
                {todoEvents.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} onClick={(x) => navigate(`/events/${x.id}`)} />
                  </li>
                ))}
              </ul>
            </TodoGroup>

            <TodoGroup label="Research packs" count={todoPacks.length}>
              <RowCard>
                {todoPacks.map(({ pack, pendingCount }) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => navigate(`/research-packs/${pack.id}`)}
                    className={rowClass}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <Layers className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate', t.title)}>{pack.title}</span>
                      <span className={cn('mt-0.5 block truncate', t.meta)}>
                        {pendingCount > 0
                          ? `${pendingCount} item${pendingCount === 1 ? '' : 's'} due`
                          : 'Pack due'}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
                  </button>
                ))}
              </RowCard>
            </TodoGroup>

            <TodoGroup label="Notes" count={todoNotes.length}>
              <RowCard>
                {todoNotes.map((note) => (
                  <NoteRow key={note.id} note={note} onOpen={(n) => navigate(`/notes/${n.id}`)} />
                ))}
              </RowCard>
            </TodoGroup>
          </div>
        );

      case 'packs':
        return (
          <RowCard>
            {visiblePacks.map((pack) => (
              <PackRow
                key={pack.id}
                pack={pack}
                isLive={isPackLive(pack, now)}
                onOpen={(p) => navigate(`/research-packs/${p.id}`)}
              />
            ))}
          </RowCard>
        );

      case 'emails':
        return (
          <div className={cn('overflow-hidden', t.surface, t.border, t.radius)}>
            {visibleEmails.map((email) => (
              <div key={email.id} className={t.divider}>
                <EmailCard
                  email={email}
                  swipeable
                  onArchive={handleArchiveEmail}
                  onToggleImportant={(e) => void markImportant(e.id, !e.isImportant)}
                />
              </div>
            ))}
          </div>
        );

      case 'tasks':
        return (
          <div className={t.listGap}>
            {visibleTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} />
            ))}
          </div>
        );

      case 'events':
        return (
          <div className={t.listGap}>
            {visibleEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        );

      case 'notes':
        return (
          <RowCard>
            {visibleNotes.map((note) => (
              <NoteRow key={note.id} note={note} onOpen={(n) => navigate(`/notes/${n.id}`)} />
            ))}
          </RowCard>
        );

      case 'contacts':
      default:
        return (
          <RowCard>
            {visibleContacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                onOpen={(c) => navigate(`/contacts/${c.id}`)}
              />
            ))}
          </RowCard>
        );
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Ongoings"
        subtitle={
          category === 'todo'
            ? `${total} ${total === 1 ? singular : plural} due ${dayLabel(dayOffset)}`
            : `${total} ${total === 1 ? singular : plural} this week`
        }
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label={isSearchOpen ? 'Hide search' : 'Search ongoings'}
            aria-pressed={isSearchOpen}
            onClick={() => {
              setSearchOpen((open) => {
                if (open) setQuery('');
                return !open;
              });
            }}
          >
            <Search />
          </Button>
        }
      />

      {/* ── Category chips + search ──────────────────────────────────────── */}
      <div className={cn('flex-shrink-0 border-b bg-white px-4 pb-3 pt-2', t.hairline)}>
        {/* Six categories cannot fit 420px at once, so the row scrolls. The
            right-edge fade is the only cue that there is more beyond Events —
            without it Notes and Contacts read as missing features. */}
        <div className="relative -mx-4">
          <div
            role="tablist"
            aria-label="Ongoing categories"
            className="scrollbar-hide flex gap-1.5 overflow-x-auto px-4 pb-0.5"
          >
            {CATEGORIES.map((item) => {
              const isActive = item.id === category;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryChange(item.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] font-medium',
                    'min-h-[44px] rounded-lg border',
                    t.pressable,
                    t.focusRing,
                    isActive
                      ? cn('border-transparent', t.brandFill)
                      : cn(t.hairline, 'bg-white text-gray-600'),
                  )}
                >
                  {item.chipLabel ?? item.label}
                  <span
                    className={cn(
                      'tabular-nums text-xs',
                      isActive ? 'text-white/80' : 'text-gray-400',
                    )}
                  >
                    {counts[item.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
          />
        </div>

        {category === 'todo' && (
          <div
            role="tablist"
            aria-label="Pick a day"
            className="mt-2 flex items-center gap-1.5"
          >
            {([-1, 0, 1] as const).map((offset) => {
              const isActive = offset === dayOffset;
              const label =
                offset === -1 ? 'Yesterday' : offset === 1 ? 'Tomorrow' : 'Today';
              return (
                <button
                  key={offset}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setDayOffset(offset)}
                  className={cn(
                    'flex-1 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-medium',
                    t.pressable,
                    t.focusRing,
                    isActive
                      ? cn('border-transparent', t.brandFill)
                      : cn(t.hairline, 'bg-white text-gray-600'),
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {isSearchOpen && (
          <SearchBar
            className="mt-2"
            value={query}
            onChange={setQuery}
            autoFocus
            placeholder={activeMeta.searchPlaceholder}
            aria-label={activeMeta.searchPlaceholder}
            onEscape={() => setSearchOpen(false)}
          />
        )}
      </div>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {showSkeleton && <ListSkeleton count={6} />}

        {error && (
          <ErrorState
            title={`Couldn't load ${plural}`}
            description="Check your connection and try again."
            detail={error}
            onRetry={retryByCategory[category]}
          />
        )}

        {isEmpty &&
          (query ? (
            <EmptyState
              icon={activeMeta.icon}
              title="No matches"
              description={`Nothing in ${activeMeta.label.toLowerCase()} matches “${query}”.`}
              action={{ label: 'Clear search', onClick: () => setQuery('') }}
            />
          ) : (
            <EmptyState
              icon={activeMeta.icon}
              title={emptyByCategory[category].title}
              description={emptyByCategory[category].description}
              action={{
                label: emptyByCategory[category].actionLabel,
                onClick: emptyByCategory[category].onAction,
              }}
            />
          ))}

        {!error && !showSkeleton && shown > 0 && (
          <>
            {/* Digest header — the only route into the category's full screen.
                To-Do has no such screen and its subtitle already states the
                count, so the row would just repeat itself. */}
            <div className={cn('mb-2 flex items-center justify-between gap-3', category === 'todo' && 'hidden')}>
              <span className={t.label}>
                {shown} {shown === 1 ? activeMeta.label.replace(/s$/, '') : activeMeta.label}
              </span>
              {activeMeta.route && (
              <button
                type="button"
                onClick={() => navigate(activeMeta.route!)}
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600',
                  t.pressable,
                  t.focusRing,
                  'rounded-lg px-1 py-1',
                )}
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              )}
            </div>
            {renderList()}
          </>
        )}
      </div>
    </div>
  );
}
