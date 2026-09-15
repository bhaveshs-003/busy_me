import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// EntityCard — base row/card shared by Email, Task, Event, Note and Contact
// =============================================================================

export interface EntityCardProps {
  /** Leading slot: icon, avatar or checkbox. */
  icon?: ReactNode;
  /** Primary line. */
  title: ReactNode;
  /** Secondary line — clamped to two lines. */
  subtitle?: ReactNode;
  /** Metadata row (timestamps, tags, status badges). */
  meta?: ReactNode;
  /** Trailing slot on the title row (time, badge, chevron). */
  rightContent?: ReactNode;
  /** Action slot on the meta row (button or menu). */
  action?: ReactNode;
  /** Highlights the card as the current selection. */
  isSelected?: boolean;
  /** Bolds the title and shows a brand dot. */
  isUnread?: boolean;
  /** Dims the card, e.g. a completed task. */
  isMuted?: boolean;
  /** Left accent stripe color (Tailwind bg-* class). */
  accentClassName?: string;
  onClick?: () => void;
  className?: string;
}

export function EntityCard({
  icon,
  title,
  subtitle,
  meta,
  rightContent,
  action,
  isSelected = false,
  isUnread = false,
  isMuted = false,
  accentClassName,
  onClick,
  className,
}: EntityCardProps) {
  const isInteractive = Boolean(onClick);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={cn(
        'group relative flex w-full items-start gap-3 overflow-hidden rounded-lg border px-4 py-3.5 text-left',
        'transition-all duration-150 ease-out',
        isSelected
          ? 'border-orange-200 bg-orange-50/70'
          : 'border-gray-100/80 bg-white',
        isInteractive &&
          !isSelected &&
          'cursor-pointer hover:border-gray-100 hover:bg-gray-50',
        isInteractive &&
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        isMuted && 'opacity-60',
        className,
      )}
    >
      {accentClassName && (
        <span
          aria-hidden="true"
          className={cn('absolute inset-y-0 left-0 w-1', accentClassName)}
        />
      )}

      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex min-w-0 items-center gap-1.5 text-sm leading-snug',
              isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800',
              isMuted && 'line-through decoration-gray-300',
            )}
          >
            {isUnread && (
              <span
                aria-label="Unread"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
              />
            )}
            <span className="truncate">{title}</span>
          </div>

          {rightContent && (
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-gray-400">
              {rightContent}
            </div>
          )}
        </div>

        {subtitle && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {subtitle}
          </p>
        )}

        {(meta || action) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">{meta}</div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default EntityCard;
