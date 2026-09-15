import type { ReactNode } from 'react';
import { Inbox, ListTodo, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

// =============================================================================
// EmptyState
// =============================================================================

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  /** Icon element — rendered inside a muted circle. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Primary call to action. */
  action?: EmptyStateAction;
  /** Optional low-emphasis secondary action. */
  secondaryAction?: EmptyStateAction;
  /** Tighter spacing for empty states inside cards / panels. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-8' : 'py-16',
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className={cn(
            'mb-4 flex items-center justify-center rounded-full',
            'bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-100',
            compact ? 'h-12 w-12 [&>svg]:h-6 [&>svg]:w-6' : 'h-16 w-16 [&>svg]:h-7 [&>svg]:w-7',
          )}
        >
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-900">{title}</h3>

      {description && (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export function NoEmailsEmpty({ onCompose }: { onCompose?: () => void }) {
  return (
    <EmptyState
      icon={<Inbox />}
      title="No emails found"
      description="Your inbox is clear, or no messages match the current filters."
      action={onCompose ? { label: 'Compose email', onClick: onCompose } : undefined}
    />
  );
}

export function NoTasksEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<ListTodo />}
      title="No tasks yet"
      description="Create your first task to keep track of what needs doing."
      action={onCreate ? { label: 'Create task', onClick: onCreate } : undefined}
    />
  );
}

export function NoResultsEmpty({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon={<SearchX />}
      title="No results"
      description="We couldn't find anything matching your search. Try different keywords."
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

export default EmptyState;
