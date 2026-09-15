import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact } from '@/types/index';
import { mockApi } from '@/services/mockApi';
import { seededContacts } from '@/data/seeded';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContactFilters {
  isFavorite?: boolean;
  tags?: string[];
  company?: string;
  importedFrom?: string;
}

interface ContactStore {
  // State
  contacts: Contact[];
  isLoading: boolean;
  selectedContact: Contact | null;
  searchQuery: string;
  filters: ContactFilters;
  error: string | null;

  // Actions
  fetchContacts: () => Promise<void>;
  createContact: (input: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: string, patch: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setFilters: (patch: Partial<ContactFilters>) => void;
  importContacts: (source: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  selectContact: (contact: Contact | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function buildContact(input: Partial<Contact>): Contact {
  return {
    id: `contact-${Date.now()}`,
    firstName: input.firstName ?? '',
    lastName: input.lastName ?? '',
    displayName: input.displayName ?? `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim(),
    company: input.company ?? null,
    jobTitle: input.jobTitle ?? null,
    department: input.department ?? null,
    avatarUrl: input.avatarUrl ?? null,
    emails: input.emails ?? [],
    phones: input.phones ?? [],
    linkedInUrl: input.linkedInUrl ?? null,
    twitterHandle: input.twitterHandle ?? null,
    websiteUrl: input.websiteUrl ?? null,
    birthday: input.birthday ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
    tags: input.tags ?? [],
    isFavorite: input.isFavorite ?? false,
    isBlocked: false,
    lastContactedAt: null,
    createdAt: now(),
    updatedAt: now(),
    importedFromConnectorId: input.importedFromConnectorId,
    emailCount: 0,
    meetingCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      contacts: seededContacts,
      isLoading: false,
      selectedContact: null,
      searchQuery: '',
      filters: {},
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      fetchContacts: async () => {
        set({ isLoading: true, error: null });
        try {
          await mockApi.contacts.list();
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },

      createContact: async (input: Partial<Contact>) => {
        const contact = buildContact(input);
        set((s) => ({ contacts: [contact, ...s.contacts] }));
        try {
          await mockApi.contacts.create({
            name: contact.displayName,
            email: contact.emails[0]?.email ?? '',
            company: contact.company ?? '',
            phone: contact.phones[0]?.number ?? '',
          });
        } catch {
          set((s) => ({ contacts: s.contacts.filter((c) => c.id !== contact.id) }));
          throw new Error('Failed to create contact');
        }
        return contact;
      },

      updateContact: async (id: string, patch: Partial<Contact>) => {
        const prev = get().contacts.find((c) => c.id === id);
        const updated = { ...patch, updatedAt: now() };
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updated } : c)),
          selectedContact: s.selectedContact?.id === id
            ? { ...s.selectedContact, ...updated }
            : s.selectedContact,
        }));
        try {
          await mockApi.contacts.update(id, patch as Record<string, unknown>);
        } catch {
          if (prev) {
            set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? prev : c)) }));
          }
          throw new Error('Failed to update contact');
        }
      },

      deleteContact: async (id: string) => {
        const prev = get().contacts.find((c) => c.id === id);
        set((s) => ({
          contacts: s.contacts.filter((c) => c.id !== id),
          selectedContact: s.selectedContact?.id === id ? null : s.selectedContact,
        }));
        try {
          await mockApi.contacts.delete(id);
        } catch {
          if (prev) set((s) => ({ contacts: [prev, ...s.contacts] }));
          throw new Error('Failed to delete contact');
        }
      },

      setSearchQuery: (q: string) => {
        set({ searchQuery: q });
      },

      setFilters: (patch: Partial<ContactFilters>) => {
        set((s) => ({ filters: { ...s.filters, ...patch } }));
      },

      importContacts: async (source: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate import delay.
          await new Promise<void>((r) => setTimeout(r, 1500));
          console.debug(`[contactStore] Imported contacts from ${source}`);
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
          throw err;
        }
      },

      toggleFavorite: (id: string) => {
        set((s) => ({
          contacts: s.contacts.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite, updatedAt: now() } : c
          ),
        }));
      },

      selectContact: (contact: Contact | null) => {
        set({ selectedContact: contact });
      },
    }),
    {
      name: 'busyme_contacts',
      partialize: (s) => ({ contacts: s.contacts, filters: s.filters }),
    }
  )
);
