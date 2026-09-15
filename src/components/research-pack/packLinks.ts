import { useMemo } from 'react';
import type {
  CalendarEvent,
  Contact,
  Email,
  MockFile,
  Note,
  ResearchPack,
  Task,
  TaskPriority,
  TimelineEntry,
} from '@/types/index';
import { mockFiles } from '@/data/mockFiles';
import { useEmailStore } from '@/store/emailStore';
import { useTaskStore } from '@/store/taskStore';
import { useEventStore } from '@/store/eventStore';
import { useNoteStore } from '@/store/noteStore';
import { useContactStore } from '@/store/contactStore';

// =============================================================================
// Pack link resolution
//
// A research pack stores only ids. Every surface of the feature needs the same
// resolved entities, so the lookup lives here once and is shared by the card,
// the detail tabs and the briefing.
//
// An entity counts as linked when either side points at the other:
//   1. the pack lists its id (`linkedEmailIds`, `linkedTaskIds`, …),
//   2. a timeline entry references it, or
//   3. the entity itself carries `linkedResearchPackId`.
// Ids that do not resolve against a store are dropped rather than rendered as
// broken rows.
// =============================================================================

export interface PackLinks {
  emails: Email[];
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  contacts: Contact[];
  files: MockFile[];
}

type TimelineIdKey =
  | 'linkedEmailId'
  | 'linkedEventId'
  | 'linkedNoteId'
  | 'linkedTaskId'
  | 'linkedContactId'
  | 'linkedFileId';

function idSet(
  explicitIds: string[],
  timeline: TimelineEntry[],
  timelineKey: TimelineIdKey,
): Set<string> {
  const ids = new Set(explicitIds);
  for (const entry of timeline) {
    const id = entry[timelineKey];
    if (id) ids.add(id);
  }
  return ids;
}

export function usePackLinks(pack: ResearchPack | null | undefined): PackLinks {
  const emails = useEmailStore((s) => s.emails);
  const tasks = useTaskStore((s) => s.tasks);
  const events = useEventStore((s) => s.events);
  const notes = useNoteStore((s) => s.notes);
  const contacts = useContactStore((s) => s.contacts);

  return useMemo<PackLinks>(() => {
    if (!pack) {
      return { emails: [], tasks: [], events: [], notes: [], contacts: [], files: [] };
    }

    const timeline = pack.timeline;
    const emailIds = idSet(pack.linkedEmailIds, timeline, 'linkedEmailId');
    const taskIds = idSet(pack.linkedTaskIds, timeline, 'linkedTaskId');
    const eventIds = idSet(pack.linkedEventIds, timeline, 'linkedEventId');
    const noteIds = idSet(pack.linkedNoteIds, timeline, 'linkedNoteId');
    const contactIds = idSet(pack.linkedContactIds, timeline, 'linkedContactId');
    const fileIds = idSet(pack.linkedFileIds, timeline, 'linkedFileId');

    return {
      emails: emails.filter((email) => emailIds.has(email.id)),
      tasks: tasks.filter(
        (task) => taskIds.has(task.id) || task.linkedResearchPackId === pack.id,
      ),
      events: events.filter(
        (event) => eventIds.has(event.id) || event.linkedResearchPackId === pack.id,
      ),
      notes: notes.filter(
        (note) => noteIds.has(note.id) || note.linkedResearchPackId === pack.id,
      ),
      contacts: contacts.filter((contact) => contactIds.has(contact.id)),
      files: mockFiles.filter(
        (file) => fileIds.has(file.id) || file.linkedResearchPackId === pack.id,
      ),
    };
  }, [pack, emails, tasks, events, notes, contacts]);
}

// ---------------------------------------------------------------------------
// Derived summaries
// ---------------------------------------------------------------------------

/** `4 emails · 2 tasks · 1 event` — zero-count entities are omitted. */
export function formatPackCounts(links: PackLinks, max = 3): string {
  const parts: string[] = [];
  const add = (count: number, singular: string) => {
    if (count > 0) parts.push(`${count} ${count === 1 ? singular : `${singular}s`}`);
  };

  add(links.emails.length, 'email');
  add(links.tasks.length, 'task');
  add(links.events.length, 'event');
  add(links.notes.length, 'note');
  add(links.files.length, 'file');
  add(links.contacts.length, 'contact');

  return parts.slice(0, max).join(' · ');
}

export const packPriorityLabel: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** Packs seeded before priority existed read as `medium`. */
export function packPriority(pack: ResearchPack): TaskPriority {
  return pack.priority ?? 'medium';
}
