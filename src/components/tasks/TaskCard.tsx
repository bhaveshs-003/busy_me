import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Hourglass, Paperclip, Star } from 'lucide-react';
import { isToday, isTomorrow, isYesterday } from 'date-fns';
import type { Task, TaskPriority } from '@/types/index';
import type { BadgeColor } from '@/components/ui/Badge';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDate } from '@/lib/utils';

// =============================================================================
// Shared task helpers
//
// Kept beside the card because every task surface (list, detail, create sheet)
// needs the same notion of "overdue" and the same priority vocabulary.
// =============================================================================

/**
 * A task is overdue when it has a due date in the past and has not been
 * completed. The stored `status` field can also say `overdue`, but it is a
 * snapshot taken at write time — recomputing from `dueDate` keeps the UI honest
 * as the clock moves past a due date while the app is open.
 */
export function isTaskOverdue(task: Task, now: number = Date.now()): boolean {
  if (task.status === 'completed') return false;
  if (!task.dueDate) return false;
  const due = Date.parse(task.dueDate);
  return !Number.isNaN(due) && due < now;
}

/** Effective status for display, reconciling stored status with the clock. */
export function effectiveTaskStatus(task: Task, now: number = Date.now()) {
  if (task.status === 'completed') return 'completed' as const;
  return isTaskOverdue(task, now) ? ('overdue' as const) : ('open' as const);
}

export const taskPriorityLabel: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const taskPriorityBadgeColor: Record<TaskPriority, BadgeColor> = {
  high: 'red',
  medium: 'yellow',
  low: 'gray',
};

/** Sort weight — higher sorts first. */
export const taskPriorityWeight: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Human due-date label. Relative wording for the days either side of today,
 * absolute date beyond that. `dueTime` is appended when the task has one.
 */
export function formatTaskDueDate(task: Task): string | null {
  if (!task.dueDate) return null;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return null;

  let day: string;
  if (isToday(due)) day = 'Today';
  else if (isTomorrow(due)) day = 'Tomorrow';
  else if (isYesterday(due)) day = 'Yesterday';
  else day = formatDate(due, { month: 'short', day: 'numeric' });

  return task.dueTime ? `${day} · ${task.dueTime}` : day;
}

// =============================================================================
// TaskCard
// =============================================================================

export interface TaskCardProps {
  task: Task;
  /** Toggles completion. The card owns only the animation, not the mutation. */
  onToggleComplete: (task: Task) => void;
  /** Overrides navigation to the task detail route. */
  onClick?: (task: Task) => void;
  className?: string;
}

/** How long the check-mark pop runs before the row settles into its done state. */
const COMPLETE_ANIMATION_MS = 400;

export function TaskCard({
  task,
  onToggleComplete,
  onClick,
  className,
}: TaskCardProps) {
  const navigate = useNavigate();
  const [isPopping, setIsPopping] = useState(false);

  const isCompleted = task.status === 'completed';
  const overdue = isTaskOverdue(task);
  const dueLabel = formatTaskDueDate(task);
  const attachmentCount = task.attachments?.length ?? 0;
  const waitingOn = task.waitingOn ?? null;
  const checklistDone = task.checklist.filter((i) => i.isCompleted).length;

  const handleOpen = () => {
    if (onClick) onClick(task);
    else navigate(`/tasks/${task.id}`);
  };

  const handleToggle = (event: React.MouseEvent) => {
    // The checkbox sits inside the tappable row — don't navigate as well.
    event.stopPropagation();
    if (!isCompleted) {
      setIsPopping(true);
      window.setTimeout(() => setIsPopping(false), COMPLETE_ANIMATION_MS);
    }
    onToggleComplete(task);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      }}
      className={cn(
        'group flex w-full items-start gap-3 rounded-lg border bg-white p-3.5 text-left',
        'transition-all duration-200 ease-out',
        'hover:border-gray-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        isCompleted ? 'border-gray-100/60 bg-gray-50/60' : 'border-gray-100/80',
        className,
      )}
    >
      {/* ── Checkbox ───────────────────────────────────────────────────── */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={isCompleted ? `Mark "${task.title}" as open` : `Complete "${task.title}"`}
        onClick={handleToggle}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
          isCompleted
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-gray-100 bg-white text-transparent hover:border-emerald-400',
          isPopping && 'scale-125',
        )}
      >
        <Check
          className={cn(
            'h-3 w-3 transition-transform duration-200 ease-out',
            isCompleted ? 'scale-100' : 'scale-0',
          )}
          strokeWidth={3.5}
          aria-hidden="true"
        />
      </button>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              'min-w-0 flex-1 text-sm font-medium leading-snug transition-colors duration-200',
              isCompleted ? 'text-gray-400 line-through' : 'text-gray-900',
            )}
          >
            {task.title}
          </p>

          {task.isImportant && (
            <Star
              className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400"
              aria-label="Important"
            />
          )}
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {dueLabel && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                overdue ? 'text-red-600' : 'text-gray-500',
              )}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {dueLabel}
            </span>
          )}

          <Badge color={taskPriorityBadgeColor[task.priority]} size="sm">
            {taskPriorityLabel[task.priority]}
          </Badge>

          {task.checklist.length > 0 && (
            <span className="text-xs tabular-nums text-gray-400">
              {checklistDone}/{task.checklist.length}
            </span>
          )}

          {attachmentCount > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs text-gray-400"
              aria-label={`${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}`}
            >
              <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
              {attachmentCount}
            </span>
          )}
        </div>

        {/* Waiting-on indicator */}
        {waitingOn && !isCompleted && (
          <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200/70">
            <Hourglass className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">Waiting on {waitingOn.contactName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
