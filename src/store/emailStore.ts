import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Email,
  EmailAddress,
  EmailCategory,
  EmailDraft,
  EmailStatus,
  EmailWaitingOn,
} from '@/types/index';
import { mockApi } from '@/services/mockApi';
import { seedDrafts, seedEmails, mailboxOwner } from '@/data/emailSeed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailFilters {
  folder: 'inbox' | 'sent' | 'drafts' | 'archived' | 'trash' | 'important';
  labels: string[];
  isRead?: boolean;
  hasAttachments?: boolean;
  category?: EmailCategory | 'all';
  /** Only emails flagged important. */
  isImportant?: boolean;
  /** Only emails with an outstanding reply we are chasing. */
  isWaitingOn?: boolean;
}

const DEFAULT_FILTERS: EmailFilters = {
  folder: 'inbox',
  labels: [],
  category: 'all',
};

const PAGE_SIZE = 20;

/** Rows appended per infinite-scroll page. */
export const EMAIL_PAGE_SIZE = PAGE_SIZE;

/** Attachments newer than this count toward the "recent attachments" stat. */
export const RECENT_ATTACHMENT_WINDOW_DAYS = 14;

interface EmailStore {
  // State
  emails: Email[];
  drafts: EmailDraft[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  searchQuery: string;
  filters: EmailFilters;
  selectedEmail: Email | null;
  error: string | null;

  // Actions
  fetchEmails: () => Promise<void>;
  loadMore: () => Promise<void>;
  fetchEmail: (id: string) => Promise<void>;
  sendEmail: (draft: Partial<EmailDraft>) => Promise<Email>;
  replyEmail: (id: string, draft: Partial<EmailDraft>) => Promise<void>;
  forwardEmail: (id: string, to: string[]) => Promise<void>;
  archiveEmail: (id: string) => Promise<void>;
  restoreEmail: (id: string, status?: EmailStatus) => void;
  deleteEmail: (id: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  markImportant: (id: string, important?: boolean) => Promise<void>;
  toggleStarred: (id: string) => void;
  setWaitingOn: (id: string, waitingOn: EmailWaitingOn | null) => void;
  selectEmail: (email: Email | null) => void;
  createDraft: (draft: Partial<EmailDraft>) => EmailDraft;
  updateDraft: (id: string, patch: Partial<EmailDraft>) => void;
  setSearchQuery: (q: string) => void;
  setFilters: (patch: Partial<EmailFilters>) => void;
  resetFilters: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function filterEmails(
  emails: Email[],
  filters: EmailFilters,
  query: string
): Email[] {
  let result = emails;

  if (filters.folder === 'inbox') {
    result = result.filter(
      (e) =>
        e.status !== 'archived' &&
        e.status !== 'trashed' &&
        e.status !== 'sent' &&
        e.status !== 'draft'
    );
  } else if (filters.folder === 'sent') {
    result = result.filter((e) => e.status === 'sent');
  } else if (filters.folder === 'drafts') {
    result = result.filter((e) => e.status === 'draft');
  } else if (filters.folder === 'archived') {
    result = result.filter((e) => e.status === 'archived');
  } else if (filters.folder === 'trash') {
    result = result.filter((e) => e.status === 'trashed');
  } else if (filters.folder === 'important') {
    result = result.filter((e) => e.isImportant);
  }

  if (filters.isRead !== undefined) {
    // `unread` is the only status that means "not yet opened" — sent and draft
    // rows must not fall into the unread bucket.
    result = result.filter((e) =>
      filters.isRead ? e.status !== 'unread' : e.status === 'unread'
    );
  }

  if (filters.hasAttachments) {
    result = result.filter((e) => e.attachments.length > 0);
  }

  if (filters.isImportant) {
    result = result.filter((e) => e.isImportant);
  }

  if (filters.isWaitingOn) {
    result = result.filter((e) => Boolean(e.waitingOn));
  }

  if (filters.category && filters.category !== 'all') {
    result = result.filter((e) => e.category === filters.category);
  }

  if (filters.labels.length > 0) {
    result = result.filter((e) => filters.labels.some((l) => e.labels.includes(l)));
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        (e.from.name?.toLowerCase().includes(q) ?? false) ||
        e.from.email.toLowerCase().includes(q) ||
        e.snippet.toLowerCase().includes(q) ||
        (e.bodyText?.toLowerCase().includes(q) ?? false) ||
        e.labels.some((l) => l.toLowerCase().includes(q))
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

export interface EmailStats {
  unread: number;
  important: number;
  waitingOn: number;
  recentAttachments: number;
  /** Per-category counts for the inbox chips. */
  byCategory: Record<EmailCategory | 'all', number>;
}

/** Inbox-scoped counters powering the summary cards and category chips. */
export function computeEmailStats(emails: Email[]): EmailStats {
  const cutoff = Date.now() - RECENT_ATTACHMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const stats: EmailStats = {
    unread: 0,
    important: 0,
    waitingOn: 0,
    recentAttachments: 0,
    byCategory: { all: 0, primary: 0, social: 0, updates: 0, promotions: 0, other: 0 },
  };

  for (const email of emails) {
    stats.byCategory.all += 1;
    stats.byCategory[email.category] += 1;
    if (email.status === 'unread') stats.unread += 1;
    if (email.isImportant) stats.important += 1;
    if (email.waitingOn) stats.waitingOn += 1;
    if (email.attachments.length > 0 && new Date(email.date).getTime() >= cutoff) {
      stats.recentAttachments += email.attachments.length;
    }
  }

  return stats;
}

/** Emails visible in a folder before quick filters / search narrow them down. */
export function selectFolderEmails(
  emails: Email[],
  folder: EmailFilters['folder']
): Email[] {
  return filterEmails(emails, { folder, labels: [], category: 'all' }, '');
}

// ---------------------------------------------------------------------------
// Draft → Email
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function plainSnippet(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 140);
}

/** Materialises a composed draft as a `sent` email so the list reflects it. */
function draftToEmail(draft: Partial<EmailDraft>, from: EmailAddress): Email {
  const bodyText = draft.bodyText ?? '';
  const timestamp = draft.scheduledSendAt ?? nowIso();
  const id = `email-sent-${Date.now()}`;

  return {
    id,
    connectorId: draft.connectorId ?? 'gmail',
    threadId: draft.inReplyToId ?? `thread-${id}`,
    messageId: `<${id}@busy.me>`,
    subject: draft.subject?.trim() ? draft.subject : '(no subject)',
    snippet: plainSnippet(bodyText),
    bodyHtml: draft.bodyHtml || null,
    bodyText,
    from,
    to: draft.to ?? [],
    cc: draft.cc ?? [],
    bcc: draft.bcc ?? [],
    replyTo: null,
    date: timestamp,
    receivedAt: timestamp,
    status: 'sent',
    category: 'primary',
    labels: draft.scheduledSendAt ? ['sent', 'scheduled'] : ['sent'],
    attachments: draft.attachments ?? [],
    isStarred: false,
    isImportant: draft.isImportant ?? false,
    waitingOn: draft.waitingOn ?? null,
    hasCalendarInvite: false,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEmailStore = create<EmailStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      emails: seedEmails,
      drafts: seedDrafts,
      isLoading: false,
      hasMore: seedEmails.length > PAGE_SIZE,
      page: 1,
      searchQuery: '',
      filters: DEFAULT_FILTERS,
      selectedEmail: null,
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      fetchEmails: async () => {
        set({ isLoading: true, error: null, page: 1 });
        try {
          // Use mockApi for the side-effect; keep local store as source of truth.
          await mockApi.emails.list(1, {});
          const filtered = filterEmails(get().emails, get().filters, get().searchQuery);
          set({
            isLoading: false,
            hasMore: filtered.length > PAGE_SIZE,
          });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },

      loadMore: async () => {
        const { isLoading, hasMore, page } = get();
        if (isLoading || !hasMore) return;
        set({ isLoading: true });
        try {
          await mockApi.emails.list(page + 1, {});
          const filtered = filterEmails(get().emails, get().filters, get().searchQuery);
          const nextPage = page + 1;
          set({
            isLoading: false,
            page: nextPage,
            hasMore: filtered.length > nextPage * PAGE_SIZE,
          });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },

      fetchEmail: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // Mark as read optimistically.
          set((s) => ({
            isLoading: false,
            selectedEmail: s.emails.find((e) => e.id === id) ?? null,
            emails: s.emails.map((e) =>
              e.id === id ? { ...e, status: e.status === 'unread' ? 'read' : e.status } : e
            ),
          }));
          await mockApi.emails.markRead(id, true);
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },

      sendEmail: async (draft: Partial<EmailDraft>) => {
        set({ isLoading: true, error: null });
        try {
          await mockApi.emails.send({
            subject: draft.subject ?? '(no subject)',
            body: draft.bodyText ?? '',
            to: draft.to?.map((a) => ({ name: a.name ?? null, email: a.email })) ?? [],
          });

          const sent = draftToEmail(draft, mailboxOwner);

          set((s) => {
            // A reply carries its "waiting on" flag back onto the source thread
            // so the inbox row — not just the sent copy — shows the chase.
            const existing =
              draft.inReplyToId && draft.waitingOn
                ? s.emails.map((e) =>
                    e.id === draft.inReplyToId ? { ...e, waitingOn: draft.waitingOn } : e
                  )
                : s.emails;

            return {
              isLoading: false,
              // Sent mail joins the mailbox so Sent / Waiting-on views stay honest.
              emails: [sent, ...existing],
              // A sent draft is no longer a draft.
              drafts: draft.id ? s.drafts.filter((d) => d.id !== draft.id) : s.drafts,
            };
          });

          return sent;
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
          throw err;
        }
      },

      replyEmail: async (id: string, draft: Partial<EmailDraft>) => {
        set({ isLoading: true, error: null });
        try {
          await mockApi.emails.reply(id, {
            body: draft.bodyText ?? '',
            to: draft.to?.map((a) => ({ name: a.name ?? null, email: a.email })) ?? [],
          });
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
          throw err;
        }
      },

      forwardEmail: async (id: string, to: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const original = get().emails.find((e) => e.id === id);
          if (!original) throw new Error(`Email ${id} not found`);
          await mockApi.emails.send({
            subject: `Fwd: ${original.subject}`,
            body: original.bodyText ?? '',
            to: to.map((email) => ({ name: null, email })),
          });
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
          throw err;
        }
      },

      archiveEmail: async (id: string) => {
        const previousStatus = get().emails.find((e) => e.id === id)?.status ?? 'read';
        // Optimistic update.
        set((s) => ({
          emails: s.emails.map((e) =>
            e.id === id ? { ...e, status: 'archived' as const } : e
          ),
          selectedEmail: s.selectedEmail?.id === id ? null : s.selectedEmail,
        }));
        try {
          await mockApi.emails.archive(id);
        } catch (err) {
          // Roll back.
          set((s) => ({
            emails: s.emails.map((e) =>
              e.id === id ? { ...e, status: previousStatus } : e
            ),
          }));
          throw err;
        }
      },

      /** Undo support for archive / delete — puts a row back in the inbox. */
      restoreEmail: (id: string, status: EmailStatus = 'read') => {
        set((s) => ({
          emails: s.emails.map((e) => (e.id === id ? { ...e, status } : e)),
        }));
      },

      deleteEmail: async (id: string) => {
        set((s) => ({
          emails: s.emails.map((e) =>
            e.id === id ? { ...e, status: 'trashed' as const } : e
          ),
          selectedEmail: s.selectedEmail?.id === id ? null : s.selectedEmail,
        }));
        try {
          await mockApi.emails.delete(id);
        } catch (err) {
          set((s) => ({
            emails: s.emails.map((e) =>
              e.id === id ? { ...e, status: 'read' as const } : e
            ),
          }));
          throw err;
        }
      },

      markRead: async (id: string) => {
        set((s) => ({
          emails: s.emails.map((e) =>
            e.id === id ? { ...e, status: 'read' as const } : e
          ),
        }));
        await mockApi.emails.markRead(id, true).catch(() => undefined);
      },

      markUnread: async (id: string) => {
        set((s) => ({
          emails: s.emails.map((e) =>
            e.id === id ? { ...e, status: 'unread' as const } : e
          ),
        }));
        await mockApi.emails.markRead(id, false).catch(() => undefined);
      },

      markImportant: async (id: string, important = true) => {
        set((s) => ({
          emails: s.emails.map((e) =>
            e.id === id ? { ...e, isImportant: important } : e
          ),
        }));
        await mockApi.emails.markImportant(id, important).catch(() => undefined);
      },

      toggleStarred: (id: string) => {
        set((s) => ({
          emails: s.emails.map((e) =>
            e.id === id ? { ...e, isStarred: !e.isStarred } : e
          ),
          selectedEmail:
            s.selectedEmail?.id === id
              ? { ...s.selectedEmail, isStarred: !s.selectedEmail.isStarred }
              : s.selectedEmail,
        }));
      },

      setWaitingOn: (id: string, waitingOn: EmailWaitingOn | null) => {
        set((s) => ({
          emails: s.emails.map((e) => (e.id === id ? { ...e, waitingOn } : e)),
          selectedEmail:
            s.selectedEmail?.id === id ? { ...s.selectedEmail, waitingOn } : s.selectedEmail,
        }));
      },

      selectEmail: (email: Email | null) => set({ selectedEmail: email }),

      createDraft: (draftInput: Partial<EmailDraft>) => {
        const draft: EmailDraft = {
          id: `draft-${Date.now()}`,
          connectorId: 'connector-gmail',
          subject: draftInput.subject ?? '',
          bodyHtml: draftInput.bodyHtml ?? '',
          bodyText: draftInput.bodyText ?? '',
          to: draftInput.to ?? [],
          cc: draftInput.cc ?? [],
          bcc: draftInput.bcc ?? [],
          attachments: draftInput.attachments ?? [],
          inReplyToId: draftInput.inReplyToId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ drafts: [draft, ...s.drafts] }));
        return draft;
      },

      updateDraft: (id: string, patch: Partial<EmailDraft>) => {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      setSearchQuery: (q: string) => {
        set({ searchQuery: q, page: 1 });
      },

      setFilters: (patch: Partial<EmailFilters>) => {
        set((s) => ({ filters: { ...s.filters, ...patch }, page: 1 }));
      },

      resetFilters: () => {
        set({ filters: DEFAULT_FILTERS, searchQuery: '', page: 1 });
      },
    }),
    {
      name: 'busyme_emails',
      // Bumped when the seed dataset changes shape — older persisted mailboxes
      // are replaced rather than merged so new fields are never missing.
      version: 2,
      migrate: (persisted, version) => {
        const fresh = { emails: seedEmails, drafts: seedDrafts, filters: DEFAULT_FILTERS };
        if (version < 2) return fresh;
        return (persisted as typeof fresh | undefined) ?? fresh;
      },
      partialize: (s) => ({
        emails: s.emails,
        drafts: s.drafts,
        filters: s.filters,
      }),
    }
  )
);
