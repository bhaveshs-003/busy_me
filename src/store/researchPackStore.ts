import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResearchPack, TimelineEntry } from '@/types/index';
import { mockApi } from '@/services/mockApi';
// The richest pack seed in the repo: every pack carries real linked email /
// task / event / note / contact / file ids, which the detail screen resolves
// against the other stores.
import { seededPacks } from '@/data/seeded';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResearchPackFilters {
  /** Which slice of packs the list shows. */
  view?: 'all' | 'recent';
  dateFrom?: string;
  dateTo?: string;
}

interface ResearchPackStore {
  // State
  packs: ResearchPack[];
  isLoading: boolean;
  selectedPack: ResearchPack | null;
  filters: ResearchPackFilters;
  error: string | null;

  // Actions
  fetchPacks: () => Promise<void>;
  createPack: (input: Partial<ResearchPack>) => Promise<ResearchPack>;
  updatePack: (id: string, patch: Partial<ResearchPack>) => Promise<void>;
  deletePack: (id: string) => Promise<void>;
  addItemToPack: (packId: string, entry: Omit<TimelineEntry, 'id' | 'researchPackId' | 'addedAt'>) => void;
  removeItemFromPack: (packId: string, entryId: string) => void;
  setFilters: (patch: Partial<ResearchPackFilters>) => void;
  selectPack: (pack: ResearchPack | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function buildPack(input: Partial<ResearchPack>): ResearchPack {
  return {
    id: `pack-${Date.now()}`,
    title: input.title ?? 'Untitled Pack',
    priority: input.priority ?? 'medium',
    coverImageUrl: null,
    color: input.color ?? '#6366f1',
    linkedContactIds: input.linkedContactIds ?? [],
    linkedEmailIds: input.linkedEmailIds ?? [],
    linkedEventIds: input.linkedEventIds ?? [],
    linkedTaskIds: input.linkedTaskIds ?? [],
    linkedNoteIds: input.linkedNoteIds ?? [],
    linkedFileIds: input.linkedFileIds ?? [],
    timeline: [],
    aiSummary: null,
    aiKeyInsights: [],
    aiNextSteps: [],
    createdAt: now(),
    updatedAt: now(),
    startedAt: null,
    completedAt: null,
    dueDate: input.dueDate ?? null,
    createdById: 'user-001',
    isShared: false,
    sharedWithEmails: [],
    watchKeywords: input.watchKeywords ?? [],
    autoAddFromConnectors: false,
    lastActivityAt: null,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useResearchPackStore = create<ResearchPackStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      packs: seededPacks,
      isLoading: false,
      selectedPack: null,
      filters: { status: 'all' },
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      fetchPacks: async () => {
        set({ isLoading: true, error: null });
        try {
          await mockApi.researchPacks.list();
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },

      createPack: async (input: Partial<ResearchPack>) => {
        const pack = buildPack(input);
        set((s) => ({ packs: [pack, ...s.packs] }));
        try {
          await mockApi.researchPacks.create({
            title: pack.title,
            description: '',
            tags: [],
          });
        } catch {
          set((s) => ({ packs: s.packs.filter((p) => p.id !== pack.id) }));
          throw new Error('Failed to create research pack');
        }
        return pack;
      },

      updatePack: async (id: string, patch: Partial<ResearchPack>) => {
        const prev = get().packs.find((p) => p.id === id);
        const updated = { ...patch, updatedAt: now(), lastActivityAt: now() };
        set((s) => ({
          packs: s.packs.map((p) => (p.id === id ? { ...p, ...updated } : p)),
          selectedPack: s.selectedPack?.id === id
            ? { ...s.selectedPack, ...updated }
            : s.selectedPack,
        }));
        try {
          await mockApi.researchPacks.update(id, patch as Record<string, unknown>);
        } catch {
          if (prev) {
            set((s) => ({ packs: s.packs.map((p) => (p.id === id ? prev : p)) }));
          }
          throw new Error('Failed to update research pack');
        }
      },

      deletePack: async (id: string) => {
        const prev = get().packs.find((p) => p.id === id);
        set((s) => ({
          packs: s.packs.filter((p) => p.id !== id),
          selectedPack: s.selectedPack?.id === id ? null : s.selectedPack,
        }));
        try {
          await mockApi.researchPacks.delete(id);
        } catch {
          if (prev) set((s) => ({ packs: [prev, ...s.packs] }));
          throw new Error('Failed to delete research pack');
        }
      },

      addItemToPack: (
        packId: string,
        entryInput: Omit<TimelineEntry, 'id' | 'researchPackId' | 'addedAt'>
      ) => {
        const entry: TimelineEntry = {
          ...entryInput,
          id: `tl-${Date.now()}`,
          researchPackId: packId,
          addedAt: now(),
        };
        set((s) => ({
          packs: s.packs.map((p) =>
            p.id === packId
              ? { ...p, timeline: [...p.timeline, entry], updatedAt: now(), lastActivityAt: now() }
              : p
          ),
          selectedPack: s.selectedPack?.id === packId
            ? { ...s.selectedPack, timeline: [...s.selectedPack.timeline, entry] }
            : s.selectedPack,
        }));
      },

      removeItemFromPack: (packId: string, entryId: string) => {
        set((s) => ({
          packs: s.packs.map((p) =>
            p.id === packId
              ? { ...p, timeline: p.timeline.filter((e) => e.id !== entryId), updatedAt: now() }
              : p
          ),
          selectedPack: s.selectedPack?.id === packId
            ? { ...s.selectedPack, timeline: s.selectedPack.timeline.filter((e) => e.id !== entryId) }
            : s.selectedPack,
        }));
      },

      setFilters: (patch: Partial<ResearchPackFilters>) => {
        set((s) => ({ filters: { ...s.filters, ...patch } }));
      },

      selectPack: (pack: ResearchPack | null) => {
        set({ selectedPack: pack });
      },
    }),
    {
      // Key is versioned: the seed changed shape, so previously persisted packs
      // must not be rehydrated over the richer dataset.
      name: 'busyme_research_packs_v2',
      partialize: (s) => ({ packs: s.packs, filters: s.filters }),
    }
  )
);
