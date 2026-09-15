import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task,
  TaskPriority,
  TaskSortKey,
  TaskStatus,
  TaskViewFilter,
} from '@/types/index';
import { mockApi } from '@/services/mockApi';
import { seededTasks } from '@/data/seeded';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority;
  dueDate?: 'today' | 'week' | 'overdue' | 'upcoming' | null;
  tags?: string[];
  /** Active chip in the task list FilterBar. */
  view?: TaskViewFilter;
  /** Active sort order in the task list. */
  sort?: TaskSortKey;
}

const DEFAULT_FILTERS: TaskFilters = { status: 'all', view: 'all', sort: 'dueDate' };

interface TaskStore {
  // State
  tasks: Task[];
  isLoading: boolean;
  filters: TaskFilters;
  selectedTask: Task | null;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (input: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  uncompleteTask: (id: string) => Promise<void>;
  setFilters: (patch: Partial<TaskFilters>) => void;
  selectTask: (task: Task | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function buildTask(input: Partial<Task>): Task {
  return {
    id: `task-${Date.now()}`,
    title: input.title ?? '',
    description: input.description ?? null,
    status: input.status ?? 'open',
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ?? null,
    dueTime: input.dueTime ?? null,
    completedAt: null,
    createdAt: now(),
    updatedAt: now(),
    checklist: input.checklist ?? [],
    tags: input.tags ?? [],
    isImportant: input.isImportant ?? false,
    waitingOn: input.waitingOn ?? null,
    attachments: input.attachments ?? [],
    linkedEmailId: input.linkedEmailId,
    linkedEventId: input.linkedEventId,
    linkedResearchPackId: input.linkedResearchPackId,
    assigneeId: input.assigneeId,
    createdByAI: input.createdByAI ?? false,
    aiSource: input.aiSource,
    reminderAt: input.reminderAt,
    recurrenceRule: input.recurrenceRule,
    estimatedMinutes: input.estimatedMinutes,
    actualMinutes: input.actualMinutes,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      tasks: seededTasks,
      isLoading: false,
      filters: DEFAULT_FILTERS,
      selectedTask: null,
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          // Re-seed from mock data — in production this would call a real endpoint.
          await new Promise<void>((r) => setTimeout(r, 300));
          set({ isLoading: false, tasks: get().tasks });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },

      createTask: async (input: Partial<Task>) => {
        const task = buildTask(input);
        set((s) => ({ tasks: [task, ...s.tasks] }));
        try {
          await mockApi.tasks.create({ title: task.title, description: task.description ?? '' });
        } catch {
          // Roll back on failure.
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }));
          throw new Error('Failed to create task');
        }
        return task;
      },

      updateTask: async (id: string, patch: Partial<Task>) => {
        const prev = get().tasks.find((t) => t.id === id);
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: now() } : t
          ),
          selectedTask: s.selectedTask?.id === id
            ? { ...s.selectedTask, ...patch, updatedAt: now() }
            : s.selectedTask,
        }));
        try {
          await mockApi.tasks.update(id, patch as Record<string, unknown>);
        } catch {
          if (prev) {
            set((s) => ({
              tasks: s.tasks.map((t) => (t.id === id ? prev : t)),
            }));
          }
          throw new Error('Failed to update task');
        }
      },

      deleteTask: async (id: string) => {
        const prev = get().tasks.find((t) => t.id === id);
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          selectedTask: s.selectedTask?.id === id ? null : s.selectedTask,
        }));
        try {
          await mockApi.tasks.delete(id);
        } catch {
          if (prev) set((s) => ({ tasks: [prev, ...s.tasks] }));
          throw new Error('Failed to delete task');
        }
      },

      completeTask: async (id: string) => {
        const completedAt = now();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'completed' as const, completedAt, updatedAt: now() } : t
          ),
        }));
        try {
          await mockApi.tasks.update(id, { status: 'done' });
        } catch {
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, status: 'open' as const, completedAt: null } : t
            ),
          }));
          throw new Error('Failed to complete task');
        }
      },

      uncompleteTask: async (id: string) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'open' as const, completedAt: null, updatedAt: now() } : t
          ),
        }));
        try {
          await mockApi.tasks.update(id, { status: 'open', completedAt: null });
        } catch {
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, status: 'completed' as const } : t
            ),
          }));
          throw new Error('Failed to uncomplete task');
        }
      },

      setFilters: (patch: Partial<TaskFilters>) => {
        set((s) => ({ filters: { ...s.filters, ...patch } }));
      },

      selectTask: (task: Task | null) => {
        set({ selectedTask: task });
      },
    }),
    {
      name: 'busyme_tasks',
      partialize: (s) => ({ tasks: s.tasks, filters: s.filters }),
    }
  )
);
