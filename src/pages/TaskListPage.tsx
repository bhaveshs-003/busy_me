import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Hourglass,
  ListTodo,
  Plus,
  Star,
} from 'lucide-react';
import { endOfWeek, isToday } from 'date-fns';
import type { Task, TaskSortKey, TaskViewFilter } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterItem } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/LoadingState';
import {
  TaskCard,
  isTaskOverdue,
  taskPriorityWeight,
} from '@/components/tasks/TaskCard';
import { CreateTaskSheet } from '@/components/tasks/CreateTaskSheet';
import { useTaskStore } from '@/store/taskStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Grouping
// =============================================================================

type GroupKey = 'overdue' | 'today' | 'week' | 'later' | 'none' | 'completed';

interface GroupConfig {
  label: string;
  /** Applied to the sticky group header. */
  className: string;
}

const GROUP_CONFIG: Record<GroupKey, GroupConfig> = {
  overdue: { label: 'Overdue', className: 'text-red-600' },
  today: { label: 'Today', className: 'text-gray-900' },
  week: { label: 'This week', className: 'text-gray-900' },
  later: { label: 'Later', className: 'text-gray-500' },
  none: { label: 'No due date', className: 'text-gray-500' },
  completed: { label: 'Completed', className: 'text-gray-400' },
};

/** Render order of the groups, top to bottom. */
const GROUP_ORDER: GroupKey[] = ['overdue', 'today', 'week', 'later', 'none', 'completed'];

function groupForTask(task: Task, now: Date, weekEnd: number): GroupKey {
  if (task.status === 'completed') return 'completed';
  if (!task.dueDate) return 'none';

  const due = Date.parse(task.dueDate);
  if (Number.isNaN(due)) return 'none';

  if (due < now.getTime()) return 'overdue';
  if (isToday(new Date(due))) return 'today';
  return due <= weekEnd ? 'week' : 'later';
}

// =============================================================================
// Filtering + sorting
// =============================================================================

const FILTERS: { id: TaskViewFilter; label: string; icon?: React.ReactNode }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed', icon: <CheckCircle2 /> },
  { id: 'important', label: 'Important', icon: <Star /> },
  { id: 'waiting', label: 'Waiting On', icon: <Hourglass /> },
];

function matchesFilter(task: Task, filter: TaskViewFilter, now: number): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'open':
      return task.status !== 'completed';
    case 'overdue':
      return isTaskOverdue(task, now);
    case 'completed':
      return task.status === 'completed';
    case 'important':
      return Boolean(task.isImportant);
    case 'waiting':
      return Boolean(task.waitingOn) && task.status !== 'completed';
    default:
      return true;
  }
}

const SORT_OPTIONS: { id: TaskSortKey; label: string }[] = [
  { id: 'dueDate', label: 'By due date' },
  { id: 'priority', label: 'By priority' },
  { id: 'created', label: 'By created' },
];

/** Tasks without a due date sort after every dated task. */
const NO_DUE_DATE = Number.POSITIVE_INFINITY;

function dueValue(task: Task): number {
  if (!task.dueDate) return NO_DUE_DATE;
  const parsed = Date.parse(task.dueDate);
  return Number.isNaN(parsed) ? NO_DUE_DATE : parsed;
}

function compareTasks(a: Task, b: Task, sort: TaskSortKey): number {
  switch (sort) {
    case 'priority': {
      const delta = taskPriorityWeight[b.priority] - taskPriorityWeight[a.priority];
      return delta !== 0 ? delta : dueValue(a) - dueValue(b);
    }
    case 'created':
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    case 'dueDate':
    default: {
      const delta = dueValue(a) - dueValue(b);
      return delta !== 0 ? delta : Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
  }
}

// =============================================================================
// Empty states
// =============================================================================

const EMPTY_COPY: Record<TaskViewFilter, { title: string; description: string }> = {
  all: {
    title: 'No tasks yet',
    description: 'Create your first task and it will show up here, grouped by when it is due.',
  },
  open: {
    title: 'Nothing open',
    description: 'Every task is done. Enjoy the quiet while it lasts.',
  },
  overdue: {
    title: 'Nothing overdue',
    description: 'You are on top of your due dates — nothing has slipped past.',
  },
  completed: {
    title: 'Nothing completed yet',
    description: 'Tasks you tick off will be collected here.',
  },
  important: {
    title: 'No important tasks',
    description: 'Star a task to flag it as important and it will appear in this list.',
  },
  waiting: {
    title: 'Not waiting on anyone',
    description: 'Tasks blocked on someone else show up here with their chase date.',
  },
};

// =============================================================================
// Page
// =============================================================================

/** Tasks rendered per infinite-scroll page. */
const PAGE_SIZE = 20;

export default function TaskListPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const isLoading = useTaskStore((s) => s.isLoading);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);
  const filters = useTaskStore((s) => s.filters);
  const setFilters = useTaskStore((s) => s.setFilters);
  const addToast = useUIStore((s) => s.addToast);

  const [isSheetOpen, setSheetOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activeFilter: TaskViewFilter = filters.view ?? 'all';
  const activeSort: TaskSortKey = filters.sort ?? 'dueDate';

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // `now` is captured once per render pass so every task in a pass is bucketed
  // against the same instant — otherwise a task could land in two groups.
  const now = useMemo(() => new Date(), []);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 1 }).getTime(), [now]);

  const counts = useMemo(() => {
    const nowMs = now.getTime();
    return FILTERS.reduce<Record<string, number>>((acc, { id }) => {
      acc[id] = tasks.filter((task) => matchesFilter(task, id, nowMs)).length;
      return acc;
    }, {});
  }, [tasks, now]);

  const filterItems: FilterItem[] = useMemo(
    () =>
      FILTERS.map((filter) => ({
        id: filter.id,
        label: filter.label,
        icon: filter.icon,
        count: counts[filter.id] ?? 0,
      })),
    [counts],
  );

  const visibleTasks = useMemo(() => {
    const nowMs = now.getTime();
    return tasks
      .filter((task) => matchesFilter(task, activeFilter, nowMs))
      .sort((a, b) => compareTasks(a, b, activeSort));
  }, [tasks, activeFilter, activeSort, now]);

  // Only the tasks paged in so far, regrouped for display.
  const groups = useMemo(() => {
    const page = visibleTasks.slice(0, visibleCount);
    const buckets = new Map<GroupKey, Task[]>();

    for (const task of page) {
      const key = groupForTask(task, now, weekEnd);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(task);
      else buckets.set(key, [task]);
    }

    return GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
      key,
      tasks: buckets.get(key) as Task[],
    }));
  }, [visibleTasks, visibleCount, now, weekEnd]);

  const hasMore = visibleCount < visibleTasks.length;

  // Reset paging whenever the result set changes shape under the user.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter, activeSort]);

  // Infinite scroll — pull in another page as the sentinel enters the viewport.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

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

  const showSkeleton = isLoading && tasks.length === 0;
  const isEmpty = !showSkeleton && visibleTasks.length === 0;

  return (
    <div className="relative flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Tasks"
        subtitle={`${counts.open ?? 0} open · ${counts.overdue ?? 0} overdue`}
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label="New task"
            onClick={() => setSheetOpen(true)}
          >
            <Plus />
          </Button>
        }
      />

      {/* ── Filters + sort ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 pb-3 pt-2">
        <FilterBar
          aria-label="Task filters"
          filters={filterItems}
          active={activeFilter}
          onChange={(id) => setFilters({ view: id as TaskViewFilter })}
        />

        <div className="mt-2 flex items-center justify-end">
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Sort tasks</span>
            <select
              value={activeSort}
              onChange={(e) => setFilters({ sort: e.target.value as TaskSortKey })}
              className={cn(
                'cursor-pointer rounded-lg border border-transparent bg-transparent py-1 pl-1 pr-6 text-xs font-medium',
                'text-gray-600 transition-colors hover:text-gray-900',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
              )}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-3">
        {showSkeleton && <ListSkeleton count={6} />}

        {isEmpty && (
          <EmptyState
            icon={<ListTodo />}
            title={EMPTY_COPY[activeFilter].title}
            description={EMPTY_COPY[activeFilter].description}
            action={{ label: 'New task', onClick: () => setSheetOpen(true) }}
            secondaryAction={
              activeFilter === 'all'
                ? undefined
                : { label: 'Show all tasks', onClick: () => setFilters({ view: 'all' }) }
            }
          />
        )}

        {groups.map((group) => (
          <section key={group.key} className="mb-5">
            <h2
              className={cn(
                'sticky top-0 z-10 -mx-1 mb-2 bg-gray-50/90 px-1 py-1.5 backdrop-blur-sm',
                'text-xs font-semibold uppercase tracking-wide',
                GROUP_CONFIG[group.key].className,
              )}
            >
              {GROUP_CONFIG[group.key].label}
              <span className="ml-1.5 font-normal tabular-nums opacity-60">
                {group.tasks.length}
              </span>
            </h2>

            <div className="flex flex-col gap-2">
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Infinite-scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="py-4">
            <ListSkeleton count={2} />
          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="New task"
        className={cn(
          'absolute bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-orange-500 text-white',
          'transition-all duration-200 ease-out hover:bg-orange-600 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        )}
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>

      <CreateTaskSheet open={isSheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
