import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note } from '@/types/index';
import { mockApi } from '@/services/mockApi';
import { mockNotes } from '@/data/notes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NoteStore {
  // State
  notes: Note[];
  isLoading: boolean;
  selectedNote: Note | null;
  searchQuery: string;
  error: string | null;

  // Actions
  fetchNotes: () => Promise<void>;
  createNote: (input: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  selectNote: (note: Note | null) => void;
  togglePin: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildNote(input: Partial<Note>): Note {
  const bodyMarkdown = input.bodyMarkdown ?? '';
  const bodyText = input.bodyText ?? bodyMarkdown.replace(/[#*`[\]()_~>-]/g, '').trim();
  return {
    id: `note-${Date.now()}`,
    title: input.title ?? 'Untitled Note',
    bodyMarkdown,
    bodyText,
    tags: input.tags ?? [],
    isPinned: input.isPinned ?? false,
    isArchived: false,
    color: input.color ?? null,
    createdAt: now(),
    updatedAt: now(),
    linkedEmailId: input.linkedEmailId,
    linkedEventId: input.linkedEventId,
    linkedTaskId: input.linkedTaskId,
    linkedResearchPackId: input.linkedResearchPackId,
    linkedContactId: input.linkedContactId,
    attachments: input.attachments ?? [],
    wordCount: countWords(bodyText),
    createdByAI: input.createdByAI ?? false,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      notes: mockNotes,
      isLoading: false,
      selectedNote: null,
      searchQuery: '',
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      fetchNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          await mockApi.notes.list();
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },

      createNote: async (input: Partial<Note>) => {
        const note = buildNote(input);
        set((s) => ({ notes: [note, ...s.notes] }));
        try {
          await mockApi.notes.create({
            title: note.title,
            content: note.bodyMarkdown,
            tags: note.tags,
          });
        } catch {
          set((s) => ({ notes: s.notes.filter((n) => n.id !== note.id) }));
          throw new Error('Failed to create note');
        }
        return note;
      },

      updateNote: async (id: string, patch: Partial<Note>) => {
        const prev = get().notes.find((n) => n.id === id);
        const updatedPatch = {
          ...patch,
          updatedAt: now(),
          ...(patch.bodyMarkdown !== undefined
            ? {
                wordCount: countWords(
                  patch.bodyText ?? patch.bodyMarkdown.replace(/[#*`[\]()_~>-]/g, '').trim()
                ),
              }
            : {}),
        };
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...updatedPatch } : n)),
          selectedNote: s.selectedNote?.id === id
            ? { ...s.selectedNote, ...updatedPatch }
            : s.selectedNote,
        }));
        try {
          await mockApi.notes.update(id, {
            title: patch.title,
            content: patch.bodyMarkdown,
            tags: patch.tags,
            isPinned: patch.isPinned,
          });
        } catch {
          if (prev) {
            set((s) => ({ notes: s.notes.map((n) => (n.id === id ? prev : n)) }));
          }
          throw new Error('Failed to update note');
        }
      },

      deleteNote: async (id: string) => {
        const prev = get().notes.find((n) => n.id === id);
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          selectedNote: s.selectedNote?.id === id ? null : s.selectedNote,
        }));
        try {
          await mockApi.notes.delete(id);
        } catch {
          if (prev) set((s) => ({ notes: [prev, ...s.notes] }));
          throw new Error('Failed to delete note');
        }
      },

      setSearchQuery: (q: string) => {
        set({ searchQuery: q });
      },

      selectNote: (note: Note | null) => {
        set({ selectedNote: note });
      },

      togglePin: (id: string) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: now() } : n
          ),
        }));
        // Fire-and-forget to keep UI snappy.
        mockApi.notes.update(id, {}).catch(() => undefined);
      },
    }),
    {
      name: 'busyme_notes',
      partialize: (s) => ({ notes: s.notes }),
    }
  )
);
