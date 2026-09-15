/**
 * Date-rebased seed data — the single entry point stores should seed from.
 *
 * The raw seed modules keep their hardcoded ISO timestamps so they stay readable
 * in a diff. This module shifts those timestamps to sit around *today* (see
 * `./seedClock`), which is what keeps the rolling 7-day Ongoings digest populated
 * however long after authoring the demo is run.
 *
 * Import from here rather than from the raw seed files.
 */

import type { CalendarEvent, Contact, Email, Note, ResearchPack, Task } from '@/types/index'
import { notFuture, rebase, rebaseAll } from './seedClock'

import { seedEmails as rawEmails, seedDrafts, mailboxOwner } from './emailSeed'
import { mockTasks as rawTasks } from './tasks'
import { mockEvents as rawEvents, mockCalendarAccounts } from './events'
import { mockNotes as rawNotes } from './notes'
import { mockContacts as rawContacts } from './contacts'
import { mockResearchPacks as rawPacks } from './mockResearchPacks'

export const seededEmails: Email[] = rebaseAll(rawEmails, ['date', 'receivedAt']).map((e) => ({
  ...e,
  date: notFuture(e.date),
  receivedAt: notFuture(e.receivedAt),
}))

export const seededTasks: Task[] = rebaseAll(rawTasks, [
  'dueDate',
  'completedAt',
  'createdAt',
  'updatedAt',
  'reminderAt',
])

export const seededEvents: CalendarEvent[] = rebaseAll(rawEvents, [
  'startAt',
  'endAt',
  'createdAt',
  'updatedAt',
])

export const seededNotes: Note[] = rebaseAll(rawNotes, ['createdAt', 'updatedAt']).map((n) => ({
  ...n,
  createdAt: notFuture(n.createdAt),
  updatedAt: notFuture(n.updatedAt),
}))

export const seededContacts: Contact[] = rebaseAll(rawContacts, [
  'lastContactedAt',
  'createdAt',
  'updatedAt',
]).map((c) => ({
  ...c,
  lastContactedAt: notFuture(c.lastContactedAt),
  createdAt: notFuture(c.createdAt),
  updatedAt: notFuture(c.updatedAt),
}))

/**
 * Packs carry a nested `timeline`, so the generic field-level helper is not
 * enough — each entry's own dates have to move with the pack.
 */
export const seededPacks: ResearchPack[] = rawPacks.map((pack) => ({
  ...pack,
  createdAt: notFuture(rebase(pack.createdAt)),
  updatedAt: notFuture(rebase(pack.updatedAt)),
  startedAt: rebase(pack.startedAt),
  completedAt: rebase(pack.completedAt),
  dueDate: rebase(pack.dueDate),
  lastActivityAt: rebase(pack.lastActivityAt),
  timeline: pack.timeline.map((entry) => ({
    ...entry,
    occurredAt: notFuture(rebase(entry.occurredAt)),
    addedAt: notFuture(rebase(entry.addedAt)),
  })),
}))

// Pass-through: no date fields that need shifting.
export { seedDrafts, mailboxOwner, mockCalendarAccounts }
