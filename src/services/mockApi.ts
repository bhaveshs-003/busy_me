// ---------------------------------------------------------------------------
// Unified mock API layer for Busy.me
// All methods simulate network latency and optional random errors.
// ---------------------------------------------------------------------------

import { getDemoDelay, shouldSimulateError } from '../lib/demoConfig';
import { generateId } from '../lib/utils';
import { sleep } from '../lib/utils';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function applyDelay(): Promise<void> {
  const ms = getDemoDelay();
  if (ms > 0) await sleep(ms);
}

function guardError(label: string): void {
  if (shouldSimulateError()) {
    throw new Error(`[mockApi] Simulated error in ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Shared seed data — referenced by multiple namespaces
// ---------------------------------------------------------------------------

export const MOCK_CONTACTS = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice@acmecorp.com', company: 'Acme Corp', role: 'VP of Engineering', avatar: null, phone: '+1 415 555 0101', tags: ['client', 'vip'], createdAt: '2025-01-15T09:00:00Z' },
  { id: 'c2', name: 'Bob Martinez', email: 'bob@startupxyz.io', company: 'StartupXYZ', role: 'CEO', avatar: null, phone: '+1 650 555 0202', tags: ['prospect'], createdAt: '2025-02-03T14:00:00Z' },
  { id: 'c3', name: 'Carol White', email: 'carol@designstudio.co', company: 'Design Studio', role: 'Creative Director', avatar: null, phone: '+44 20 7946 0303', tags: ['partner'], createdAt: '2025-03-10T11:00:00Z' },
  { id: 'c4', name: 'David Kim', email: 'd.kim@globallogistics.com', company: 'Global Logistics', role: 'Procurement Manager', avatar: null, phone: '+82 2 555 0404', tags: ['client'], createdAt: '2025-04-20T08:30:00Z' },
  { id: 'c5', name: 'Eva Rossi', email: 'e.rossi@mediainc.eu', company: 'Media Inc EU', role: 'Head of Marketing', avatar: null, phone: '+39 06 555 0505', tags: ['lead'], createdAt: '2025-05-05T16:00:00Z' },
];

const MOCK_EMAIL_SUBJECTS = [
  'Follow-up: Q3 Partnership Proposal',
  'Re: Invoice #INV-2025-0044',
  'Meeting Request — Product Roadmap Review',
  'Introducing our new pricing tiers',
  'Action required: Contract renewal by Friday',
  'Weekly digest — team updates',
  'Your account summary for August',
  'Webinar invitation: AI in the Enterprise',
  'Fwd: Press release draft for approval',
  'Re: Onboarding checklist — Day 5',
];

const MOCK_EMAIL_BODIES = [
  'Hi,\n\nJust wanted to follow up on our conversation last week regarding the partnership proposal. Please let me know if you have had a chance to review the deck.\n\nBest,',
  'Hello,\n\nPlease find attached the invoice for services rendered in July. Payment is due within 30 days.\n\nRegards,',
  'Hi team,\n\nI would like to schedule a 45-minute review of our Q4 product roadmap. Could we find a slot this Thursday afternoon?\n\nThanks,',
  'Dear valued customer,\n\nWe are excited to announce our new pricing structure effective from next month. Your existing plan is grandfathered until year-end.\n\nSincerely,',
  'Hi,\n\nThis is a friendly reminder that your contract is up for renewal on Friday. Please sign and return at your earliest convenience.\n\nThank you,',
];

function buildEmails(count = 60) {
  const emails = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const contact = MOCK_CONTACTS[i % MOCK_CONTACTS.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now - daysAgo * 86_400_000 - hoursAgo * 3_600_000).toISOString();
    emails.push({
      id: `email-${i + 1}`,
      subject: MOCK_EMAIL_SUBJECTS[i % MOCK_EMAIL_SUBJECTS.length],
      from: { name: contact.name, email: contact.email },
      to: [{ name: 'Me', email: 'me@busyme.app' }],
      body: MOCK_EMAIL_BODIES[i % MOCK_EMAIL_BODIES.length] + '\n' + contact.name,
      snippet: MOCK_EMAIL_BODIES[i % MOCK_EMAIL_BODIES.length].slice(0, 80) + '…',
      timestamp,
      isRead: Math.random() > 0.3,
      isImportant: Math.random() > 0.8,
      isArchived: false,
      hasAttachment: Math.random() > 0.7,
      labels: i % 5 === 0 ? ['work'] : i % 7 === 0 ? ['personal'] : [],
      threadId: `thread-${Math.floor(i / 3) + 1}`,
    });
  }
  return emails.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

const _emails = buildEmails(60);

const _tasks = [
  { id: 't1', title: 'Review Q3 partnership proposal', description: 'Go through Alice\'s deck and prepare feedback', status: 'in-progress', priority: 'high', dueDate: '2026-09-15T17:00:00Z', assignee: 'me', tags: ['business', 'partnership'], createdAt: '2026-09-08T09:00:00Z', updatedAt: '2026-09-09T14:00:00Z' },
  { id: 't2', title: 'Send invoice reminder to Bob', description: 'Invoice #INV-2025-0044 is 15 days overdue', status: 'todo', priority: 'medium', dueDate: '2026-09-11T12:00:00Z', assignee: 'me', tags: ['finance'], createdAt: '2026-09-09T08:00:00Z', updatedAt: '2026-09-09T08:00:00Z' },
  { id: 't3', title: 'Prepare product roadmap slides', description: 'For Thursday\'s roadmap review meeting', status: 'todo', priority: 'high', dueDate: '2026-09-12T09:00:00Z', assignee: 'me', tags: ['product', 'presentation'], createdAt: '2026-09-07T11:00:00Z', updatedAt: '2026-09-08T15:00:00Z' },
  { id: 't4', title: 'Update pricing page copy', description: 'Reflect new pricing tiers announced in newsletter', status: 'done', priority: 'low', dueDate: '2026-09-05T17:00:00Z', assignee: 'me', tags: ['marketing'], createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-05T16:45:00Z' },
  { id: 't5', title: 'Sign contract renewal with David Kim', description: 'Due by end of week', status: 'todo', priority: 'urgent', dueDate: '2026-09-12T17:00:00Z', assignee: 'me', tags: ['legal', 'client'], createdAt: '2026-09-09T07:00:00Z', updatedAt: '2026-09-09T07:00:00Z' },
  { id: 't6', title: 'Schedule onboarding call for new hires', description: 'Coordinate with HR for next Monday', status: 'in-progress', priority: 'medium', dueDate: '2026-09-14T11:00:00Z', assignee: 'me', tags: ['hr'], createdAt: '2026-09-06T09:00:00Z', updatedAt: '2026-09-09T10:00:00Z' },
];

const _events = [
  { id: 'ev1', title: 'Product Roadmap Review', description: 'Q4 roadmap alignment session', start: '2026-09-11T14:00:00Z', end: '2026-09-11T15:00:00Z', location: 'Zoom', attendees: ['alice@acmecorp.com', 'me@busyme.app'], color: '#6366f1', isAllDay: false, recurrence: null, createdAt: '2026-09-08T09:00:00Z' },
  { id: 'ev2', title: 'Lunch with Bob Martinez', description: 'Discuss StartupXYZ collaboration', start: '2026-09-12T12:00:00Z', end: '2026-09-12T13:30:00Z', location: 'The Oak Brasserie, SF', attendees: ['bob@startupxyz.io', 'me@busyme.app'], color: '#10b981', isAllDay: false, recurrence: null, createdAt: '2026-09-07T16:00:00Z' },
  { id: 'ev3', title: 'Weekly Team Standup', description: 'Monday standup', start: '2026-09-14T09:00:00Z', end: '2026-09-14T09:30:00Z', location: 'Slack Huddle', attendees: ['me@busyme.app'], color: '#f59e0b', isAllDay: false, recurrence: 'weekly', createdAt: '2026-08-01T09:00:00Z' },
  { id: 'ev4', title: 'AI in the Enterprise Webinar', description: 'Virtual event — register ahead of time', start: '2026-09-16T18:00:00Z', end: '2026-09-16T19:30:00Z', location: 'Online', attendees: ['me@busyme.app'], color: '#8b5cf6', isAllDay: false, recurrence: null, createdAt: '2026-09-05T11:00:00Z' },
  { id: 'ev5', title: 'Contract Deadline — David Kim', description: 'Must be signed today', start: '2026-09-12T00:00:00Z', end: '2026-09-12T23:59:00Z', location: null, attendees: ['me@busyme.app'], color: '#ef4444', isAllDay: true, recurrence: null, createdAt: '2026-09-09T07:00:00Z' },
];

const _notes = [
  { id: 'n1', title: 'Partnership proposal notes', content: '## Key points from Alice\'s proposal\n- Revenue share: 20/80\n- Integration timeline: 8 weeks\n- Pilot period: 3 months\n\nAction: request updated deck with legal addendum', tags: ['business', 'acme'], isPinned: true, createdAt: '2026-09-08T10:00:00Z', updatedAt: '2026-09-09T09:00:00Z' },
  { id: 'n2', title: 'Pricing page redesign ideas', content: 'Consider adding a comparison table. Highlight the Pro tier. Use social proof snippets near CTA.', tags: ['marketing', 'design'], isPinned: false, createdAt: '2026-09-07T14:00:00Z', updatedAt: '2026-09-07T14:00:00Z' },
  { id: 'n3', title: 'Meeting recap — roadmap session 9/5', content: 'Decisions made:\n1. Ship auth v2 in Oct\n2. Delay mobile app to Q1 2027\n3. Eva to lead EU launch campaign\n\nNext: schedule design review for auth v2', tags: ['product', 'meeting'], isPinned: false, createdAt: '2026-09-05T16:00:00Z', updatedAt: '2026-09-05T16:00:00Z' },
  { id: 'n4', title: 'Books to read — AI / productivity', content: '- Superintelligence — Bostrom\n- Deep Work — Newport\n- The Alignment Problem — Christian\n- Thinking in Systems — Meadows', tags: ['personal', 'reading'], isPinned: false, createdAt: '2026-08-20T20:00:00Z', updatedAt: '2026-09-01T18:00:00Z' },
];

const _researchPacks = [
  { id: 'rp1', title: 'AI Productivity Tools Landscape 2026', description: 'Competitive analysis of AI-first productivity apps', status: 'complete', sources: [{ url: 'https://example.com/ai-tools', title: 'AI Tools Report 2026', snippet: 'Over 200 new AI productivity apps launched in 2025…' }, { url: 'https://example.com/vc-funding', title: 'VC Funding in Productivity', snippet: '$4.2 billion invested in productivity AI last year…' }], summary: 'The AI productivity space is highly fragmented with three emerging leaders…', tags: ['ai', 'competition', 'research'], createdAt: '2026-08-15T09:00:00Z', updatedAt: '2026-09-01T14:00:00Z' },
  { id: 'rp2', title: 'APAC Market Expansion — Feasibility', description: 'Research into potential markets in APAC for Busy.me', status: 'in-progress', sources: [], summary: null, tags: ['market', 'expansion', 'apac'], createdAt: '2026-09-03T10:00:00Z', updatedAt: '2026-09-09T11:00:00Z' },
  { id: 'rp3', title: 'Zero-Knowledge Auth Approaches', description: 'Technical research on passkeys and ZK proofs for login', status: 'draft', sources: [], summary: null, tags: ['security', 'engineering', 'auth'], createdAt: '2026-09-08T16:00:00Z', updatedAt: '2026-09-08T16:00:00Z' },
];

const _files = [
  { id: 'f1', name: 'Q3_Partnership_Deck.pdf', size: 2_450_000, type: 'application/pdf', url: '#', uploadedAt: '2026-09-08T09:30:00Z', tags: ['business'] },
  { id: 'f2', name: 'INV-2025-0044.pdf', size: 84_000, type: 'application/pdf', url: '#', uploadedAt: '2026-09-01T11:00:00Z', tags: ['finance'] },
  { id: 'f3', name: 'Product_Roadmap_Q4_2026.pptx', size: 5_120_000, type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', url: '#', uploadedAt: '2026-09-07T14:00:00Z', tags: ['product'] },
  { id: 'f4', name: 'Contract_DavidKim_Renewal.docx', size: 128_000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', url: '#', uploadedAt: '2026-09-09T07:30:00Z', tags: ['legal'] },
];

const _notifications = [
  { id: 'notif1', type: 'task-due', title: 'Task due soon', body: '"Sign contract renewal with David Kim" is due in 2 days', read: false, createdAt: '2026-09-10T08:00:00Z', link: '/tasks/t5' },
  { id: 'notif2', type: 'email', title: 'New email from Alice Johnson', body: 'Follow-up: Q3 Partnership Proposal', read: false, createdAt: '2026-09-10T07:45:00Z', link: '/mail/email-1' },
  { id: 'notif3', type: 'event-reminder', title: 'Meeting in 30 minutes', body: 'Product Roadmap Review — Zoom', read: true, createdAt: '2026-09-11T13:30:00Z', link: '/calendar/ev1' },
  { id: 'notif4', type: 'connector', title: 'Google Calendar synced', body: '3 new events imported', read: true, createdAt: '2026-09-10T06:00:00Z', link: '/settings/connectors' },
];

// In-memory mutable clones
let emails = [..._emails];
let tasks = [..._tasks];
let events = [..._events];
let notes = [..._notes];
let contacts = [...MOCK_CONTACTS];
let researchPacks = [..._researchPacks];
let files = [..._files];
const notifications = [..._notifications];

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------
export type MockEmail = (typeof _emails)[number];
export type MockTask = (typeof _tasks)[number];
export type MockEvent = (typeof _events)[number];
export type MockNote = (typeof _notes)[number];
export type MockContact = (typeof MOCK_CONTACTS)[number];
export type MockResearchPack = (typeof _researchPacks)[number];
export type MockFile = (typeof _files)[number];
export type MockNotification = (typeof _notifications)[number];

// ---------------------------------------------------------------------------
// mockApi
// ---------------------------------------------------------------------------
export const mockApi = {

  // -------------------------------------------------------------------------
  // auth
  // -------------------------------------------------------------------------
  auth: {
    async sendOTP(email: string): Promise<{ success: true; message: string }> {
      await applyDelay();
      guardError('auth.sendOTP');
      console.debug(`[mockApi] OTP sent to ${email} — use "123456"`);
      return { success: true, message: `OTP sent to ${email}` };
    },

    async login(
      email: string,
      otp: string
    ): Promise<{ success: boolean; user?: { id: string; email: string; name: string } }> {
      await applyDelay();
      guardError('auth.login');
      if (otp !== '123456') {
        throw new Error('Invalid OTP. Use 123456 for the demo.');
      }
      return {
        success: true,
        user: { id: 'user-1', email, name: email.split('@')[0].replace(/[._]/g, ' ') },
      };
    },

    async signup(email: string): Promise<{ success: true; message: string }> {
      await applyDelay();
      guardError('auth.signup');
      return { success: true, message: `Account created for ${email}` };
    },

    async logout(): Promise<{ success: true }> {
      await applyDelay();
      return { success: true };
    },
  },

  // -------------------------------------------------------------------------
  // emails
  // -------------------------------------------------------------------------
  emails: {
    async list(
      page = 1,
      filters: { search?: string; label?: string; isRead?: boolean; isImportant?: boolean } = {}
    ): Promise<{ data: MockEmail[]; total: number; page: number; pageSize: number }> {
      await applyDelay();
      guardError('emails.list');

      let result = emails.filter((e) => !e.isArchived);

      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (e) =>
            e.subject.toLowerCase().includes(q) ||
            e.from.name.toLowerCase().includes(q) ||
            e.snippet.toLowerCase().includes(q)
        );
      }
      if (filters.label) result = result.filter((e) => e.labels.includes(filters.label!));
      if (filters.isRead !== undefined) result = result.filter((e) => e.isRead === filters.isRead);
      if (filters.isImportant !== undefined)
        result = result.filter((e) => e.isImportant === filters.isImportant);

      const pageSize = 20;
      const total = result.length;
      const data = result.slice((page - 1) * pageSize, page * pageSize);
      return { data, total, page, pageSize };
    },

    async get(id: string): Promise<MockEmail> {
      await applyDelay();
      guardError('emails.get');
      const email = emails.find((e) => e.id === id);
      if (!email) throw new Error(`Email ${id} not found`);
      return email;
    },

    async send(draft: Partial<MockEmail>): Promise<MockEmail> {
      await applyDelay();
      guardError('emails.send');
      const newEmail: MockEmail = {
        id: `email-${generateId().slice(0, 8)}`,
        subject: draft.subject ?? '(no subject)',
        from: draft.from ?? { name: 'Me', email: 'me@busyme.app' },
        to: draft.to ?? [],
        body: draft.body ?? '',
        snippet: (draft.body ?? '').slice(0, 80),
        timestamp: new Date().toISOString(),
        isRead: true,
        isImportant: false,
        isArchived: false,
        hasAttachment: false,
        labels: ['sent'],
        threadId: draft.threadId ?? `thread-${generateId().slice(0, 8)}`,
      };
      emails.unshift(newEmail);
      return newEmail;
    },

    async reply(id: string, draft: Partial<MockEmail>): Promise<MockEmail> {
      await applyDelay();
      guardError('emails.reply');
      const original = emails.find((e) => e.id === id);
      if (!original) throw new Error(`Email ${id} not found`);
      return mockApi.emails.send({
        ...draft,
        subject: original.subject.startsWith('Re:')
          ? original.subject
          : `Re: ${original.subject}`,
        to: [original.from],
        threadId: original.threadId,
      });
    },

    async archive(id: string): Promise<{ success: true }> {
      await applyDelay();
      guardError('emails.archive');
      const email = emails.find((e) => e.id === id);
      if (email) email.isArchived = true;
      return { success: true };
    },

    async delete(id: string): Promise<{ success: true }> {
      await applyDelay();
      guardError('emails.delete');
      emails = emails.filter((e) => e.id !== id);
      return { success: true };
    },

    async markRead(id: string, isRead = true): Promise<{ success: true }> {
      await applyDelay();
      guardError('emails.markRead');
      const email = emails.find((e) => e.id === id);
      if (email) email.isRead = isRead;
      return { success: true };
    },

    async markImportant(id: string, isImportant = true): Promise<{ success: true }> {
      await applyDelay();
      guardError('emails.markImportant');
      const email = emails.find((e) => e.id === id);
      if (email) email.isImportant = isImportant;
      return { success: true };
    },
  },

  // -------------------------------------------------------------------------
  // tasks
  // -------------------------------------------------------------------------
  tasks: {
    async list(
      filters: { status?: string; priority?: string; tag?: string; search?: string } = {}
    ): Promise<MockTask[]> {
      await applyDelay();
      guardError('tasks.list');
      let result = [...tasks];
      if (filters.status) result = result.filter((t) => t.status === filters.status);
      if (filters.priority) result = result.filter((t) => t.priority === filters.priority);
      if (filters.tag) result = result.filter((t) => t.tags.includes(filters.tag!));
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        );
      }
      return result;
    },

    async create(data: Partial<MockTask>): Promise<MockTask> {
      await applyDelay();
      guardError('tasks.create');
      const now = new Date().toISOString();
      const task: MockTask = {
        id: `t-${generateId().slice(0, 8)}`,
        title: data.title ?? 'Untitled task',
        description: data.description ?? '',
        status: data.status ?? 'todo',
        priority: data.priority ?? 'medium',
        dueDate: data.dueDate ?? null as unknown as string,
        assignee: data.assignee ?? 'me',
        tags: data.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };
      tasks.unshift(task);
      return task;
    },

    async update(id: string, data: Partial<MockTask>): Promise<MockTask> {
      await applyDelay();
      guardError('tasks.update');
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error(`Task ${id} not found`);
      tasks[idx] = { ...tasks[idx], ...data, updatedAt: new Date().toISOString() };
      return tasks[idx];
    },

    async delete(id: string): Promise<{ success: true }> {
      await applyDelay();
      guardError('tasks.delete');
      tasks = tasks.filter((t) => t.id !== id);
      return { success: true };
    },
  },

  // -------------------------------------------------------------------------
  // events
  // -------------------------------------------------------------------------
  events: {
    async list(
      dateRange?: { start: string; end: string }
    ): Promise<MockEvent[]> {
      await applyDelay();
      guardError('events.list');
      if (!dateRange) return [...events];
      return events.filter(
        (e) => e.start >= dateRange.start && e.start <= dateRange.end
      );
    },

    async create(data: Partial<MockEvent>): Promise<MockEvent> {
      await applyDelay();
      guardError('events.create');
      const event: MockEvent = {
        id: `ev-${generateId().slice(0, 8)}`,
        title: data.title ?? 'New Event',
        description: data.description ?? '',
        start: data.start ?? new Date().toISOString(),
        end: data.end ?? new Date(Date.now() + 3_600_000).toISOString(),
        location: data.location ?? null,
        attendees: data.attendees ?? [],
        color: data.color ?? '#6366f1',
        isAllDay: data.isAllDay ?? false,
        recurrence: data.recurrence ?? null,
        createdAt: new Date().toISOString(),
      };
      events.push(event);
      return event;
    },

    async update(id: string, data: Partial<MockEvent>): Promise<MockEvent> {
      await applyDelay();
      guardError('events.update');
      const idx = events.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error(`Event ${id} not found`);
      events[idx] = { ...events[idx], ...data };
      return events[idx];
    },

    async delete(id: string): Promise<{ success: true }> {
      await applyDelay();
      guardError('events.delete');
      events = events.filter((e) => e.id !== id);
      return { success: true };
    },
  },

  // -------------------------------------------------------------------------
  // notes
  // -------------------------------------------------------------------------
  notes: {
    async list(): Promise<MockNote[]> {
      await applyDelay();
      guardError('notes.list');
      return [...notes].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
    },

    async create(data: Partial<MockNote>): Promise<MockNote> {
      await applyDelay();
      guardError('notes.create');
      const now = new Date().toISOString();
      const note: MockNote = {
        id: `n-${generateId().slice(0, 8)}`,
        title: data.title ?? 'Untitled note',
        content: data.content ?? '',
        tags: data.tags ?? [],
        isPinned: data.isPinned ?? false,
        createdAt: now,
        updatedAt: now,
      };
      notes.unshift(note);
      return note;
    },

    async update(id: string, data: Partial<MockNote>): Promise<MockNote> {
      await applyDelay();
      guardError('notes.update');
      const idx = notes.findIndex((n) => n.id === id);
      if (idx === -1) throw new Error(`Note ${id} not found`);
      notes[idx] = { ...notes[idx], ...data, updatedAt: new Date().toISOString() };
      return notes[idx];
    },

    async delete(id: string): Promise<{ success: true }> {
      await applyDelay();
      guardError('notes.delete');
      notes = notes.filter((n) => n.id !== id);
      return { success: true };
    },
  },

  // -------------------------------------------------------------------------
  // contacts
  // -------------------------------------------------------------------------
  contacts: {
    async list(): Promise<MockContact[]> {
      await applyDelay();
      guardError('contacts.list');
      return [...contacts];
    },

    async create(data: Partial<MockContact>): Promise<MockContact> {
      await applyDelay();
      guardError('contacts.create');
      const contact: MockContact = {
        id: `c-${generateId().slice(0, 8)}`,
        name: data.name ?? 'New Contact',
        email: data.email ?? '',
        company: data.company ?? '',
        role: data.role ?? '',
        avatar: null,
        phone: data.phone ?? '',
        tags: data.tags ?? [],
        createdAt: new Date().toISOString(),
      };
      contacts.push(contact);
      return contact;
    },

    async update(id: string, data: Partial<MockContact>): Promise<MockContact> {
      await applyDelay();
      guardError('contacts.update');
      const idx = contacts.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error(`Contact ${id} not found`);
      contacts[idx] = { ...contacts[idx], ...data };
      return contacts[idx];
    },

    async delete(id: string): Promise<{ success: true }> {
      await applyDelay();
      guardError('contacts.delete');
      contacts = contacts.filter((c) => c.id !== id);
      return { success: true };
    },
  },

  // -------------------------------------------------------------------------
  // researchPacks
  // -------------------------------------------------------------------------
  researchPacks: {
    async list(): Promise<MockResearchPack[]> {
      await applyDelay();
      guardError('researchPacks.list');
      return [...researchPacks];
    },

    async get(id: string): Promise<MockResearchPack> {
      await applyDelay();
      guardError('researchPacks.get');
      const pack = researchPacks.find((p) => p.id === id);
      if (!pack) throw new Error(`Research pack ${id} not found`);
      return pack;
    },

    async create(data: Partial<MockResearchPack>): Promise<MockResearchPack> {
      await applyDelay();
      guardError('researchPacks.create');
      const now = new Date().toISOString();
      const pack: MockResearchPack = {
        id: `rp-${generateId().slice(0, 8)}`,
        title: data.title ?? 'New Research Pack',
        description: data.description ?? '',
        status: 'draft',
        sources: [],
        summary: null,
        tags: data.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };
      researchPacks.unshift(pack);
      return pack;
    },

    async update(id: string, data: Partial<MockResearchPack>): Promise<MockResearchPack> {
      await applyDelay();
      guardError('researchPacks.update');
      const idx = researchPacks.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Research pack ${id} not found`);
      researchPacks[idx] = { ...researchPacks[idx], ...data, updatedAt: new Date().toISOString() };
      return researchPacks[idx];
    },
  },

  // -------------------------------------------------------------------------
  // connectors
  // -------------------------------------------------------------------------
  connectors: {
    /**
     * Simulates a 3-step OAuth connector flow.
     * Calls onProgress with step 1/2/3 as the flow progresses.
     */
    async connect(
      type: string,
      onProgress?: (step: number, label: string) => void
    ): Promise<{ success: true; connectedAt: string }> {
      guardError('connectors.connect');

      const steps = [
        'Opening OAuth window…',
        'Requesting permissions…',
        'Completing authentication…',
      ];

      for (let i = 0; i < steps.length; i++) {
        onProgress?.(i + 1, steps[i]);
        await sleep(800);
      }

      return { success: true, connectedAt: new Date().toISOString() };
    },

    async disconnect(type: string): Promise<{ success: true }> {
      await applyDelay();
      guardError('connectors.disconnect');
      console.debug(`[mockApi] Disconnected connector: ${type}`);
      return { success: true };
    },

    async sync(type: string): Promise<{ success: true; itemsSynced: number }> {
      await applyDelay();
      guardError('connectors.sync');
      const itemsSynced = Math.floor(Math.random() * 50) + 1;
      return { success: true, itemsSynced };
    },
  },

  // -------------------------------------------------------------------------
  // chat
  // -------------------------------------------------------------------------
  chat: {
    async send(
      message: string,
      sessionId: string
    ): Promise<{ id: string; role: 'assistant'; content: string; sessionId: string; timestamp: string; intent?: string; data?: unknown }> {
      await applyDelay();
      guardError('chat.send');

      // Delegate to AI engine
      const { aiEngine } = await import('./aiEngine');
      const intent = aiEngine.detectIntent(message);
      const response = aiEngine.generateResponse(intent, message, { sessionId });

      return {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        sessionId,
        timestamp: new Date().toISOString(),
        intent,
        data: response.data,
      };
    },

    async searchWeb(
      query: string
    ): Promise<Array<{ title: string; url: string; snippet: string; source: string }>> {
      await applyDelay();
      guardError('chat.searchWeb');

      return [
        { title: `${query} — Overview and Latest News`, url: `https://example.com/search?q=${encodeURIComponent(query)}`, snippet: `Comprehensive overview of ${query} including recent developments, key players, and market trends as of 2026.`, source: 'example.com' },
        { title: `Top 10 insights on ${query}`, url: `https://insights.example.com/${encodeURIComponent(query)}`, snippet: `Experts weigh in on ${query}, covering strategic implications and what to watch for in the coming months.`, source: 'insights.example.com' },
        { title: `${query}: A deep-dive analysis`, url: `https://research.example.com/articles/${encodeURIComponent(query)}`, snippet: `Our analysts explore the nuances of ${query} with data-backed findings and actionable takeaways.`, source: 'research.example.com' },
      ];
    },

    async processIntent(
      message: string
    ): Promise<{ intent: string; confidence: number; suggestedResponse: string }> {
      await applyDelay();
      guardError('chat.processIntent');

      const { aiEngine } = await import('./aiEngine');
      const intent = aiEngine.detectIntent(message);
      const response = aiEngine.generateResponse(intent, message, {});

      return {
        intent,
        confidence: 0.87 + Math.random() * 0.12,
        suggestedResponse: response.content,
      };
    },
  },

  // -------------------------------------------------------------------------
  // files
  // -------------------------------------------------------------------------
  files: {
    async list(): Promise<MockFile[]> {
      await applyDelay();
      guardError('files.list');
      return [...files];
    },

    async upload(file: File): Promise<MockFile> {
      await sleep(Math.min(file.size / 10_000, 2000)); // simulate upload time
      guardError('files.upload');
      const uploaded: MockFile = {
        id: `f-${generateId().slice(0, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        tags: [],
      };
      files.unshift(uploaded);
      return uploaded;
    },

    async download(id: string): Promise<{ url: string; filename: string }> {
      await applyDelay();
      guardError('files.download');
      const file = files.find((f) => f.id === id);
      if (!file) throw new Error(`File ${id} not found`);
      return { url: file.url, filename: file.name };
    },
  },

  // -------------------------------------------------------------------------
  // notifications
  // -------------------------------------------------------------------------
  notifications: {
    async list(): Promise<MockNotification[]> {
      await applyDelay();
      guardError('notifications.list');
      return [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  },

  // -------------------------------------------------------------------------
  // search
  // -------------------------------------------------------------------------
  search: {
    async global(
      query: string
    ): Promise<{
      emails: MockEmail[];
      tasks: MockTask[];
      events: MockEvent[];
      notes: MockNote[];
      contacts: MockContact[];
      researchPacks: MockResearchPack[];
    }> {
      await applyDelay();
      guardError('search.global');

      if (!query.trim()) {
        return { emails: [], tasks: [], events: [], notes: [], contacts: [], researchPacks: [] };
      }

      const q = query.toLowerCase();

      return {
        emails: emails
          .filter(
            (e) =>
              e.subject.toLowerCase().includes(q) ||
              e.from.name.toLowerCase().includes(q) ||
              e.snippet.toLowerCase().includes(q)
          )
          .slice(0, 5),

        tasks: tasks
          .filter(
            (t) =>
              t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
          )
          .slice(0, 5),

        events: events
          .filter(
            (e) =>
              e.title.toLowerCase().includes(q) ||
              (e.description ?? '').toLowerCase().includes(q)
          )
          .slice(0, 5),

        notes: notes
          .filter(
            (n) =>
              n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
          )
          .slice(0, 5),

        contacts: contacts
          .filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.email.toLowerCase().includes(q) ||
              c.company.toLowerCase().includes(q)
          )
          .slice(0, 5),

        researchPacks: researchPacks
          .filter(
            (p) =>
              p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
          )
          .slice(0, 5),
      };
    },
  },
};
