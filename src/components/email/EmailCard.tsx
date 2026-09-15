import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Hourglass, Paperclip, Star } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { Email } from '@/types/index';
import {
  CATEGORY_META,
  displayName,
  formatEmailTimestamp,
  formatFullTimestamp,
  formatShortDate,
} from './emailUtils';

// =============================================================================
// EmailCard — one row in the inbox list
// =============================================================================

export interface EmailCardProps {
  email: Email;
  /** Highlights the row (desktop two-pane selection). */
  isActive?: boolean;
  /** Enables the left-swipe-to-archive gesture. Enable on touch layouts. */
  swipeable?: boolean;
  /** Renders the one-time "swipe to archive" affordance on the first row. */
  showSwipeHint?: boolean;
  /** Called after a completed swipe or from the row's archive affordance. */
  onArchive?: (email: Email) => void;
  /** Star / unstar from the row. Omit to hide the toggle. */
  onToggleImportant?: (email: Email) => void;
  /** Overrides the default `/emails/:id` navigation. */
  onOpen?: (email: Email) => void;
  className?: string;
}

/** Horizontal travel (px) past which releasing archives the row. */
const ARCHIVE_THRESHOLD = 88;
/** Maximum rubber-banded travel. */
const MAX_TRAVEL = 128;
/** Movement (px) before the gesture commits to an axis. */
const AXIS_LOCK = 10;

export function EmailCard({
  email,
  isActive = false,
  swipeable = false,
  showSwipeHint = false,
  onArchive,
  onToggleImportant,
  onOpen,
  className,
}: EmailCardProps) {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const axisRef = useRef<'horizontal' | 'vertical' | null>(null);
  const swipedRef = useRef(false);

  const isUnread = email.status === 'unread';
  const canSwipe = swipeable && Boolean(onArchive);
  const category = CATEGORY_META[email.category];
  const waitingOn = email.waitingOn ?? null;

  // ── Open ────────────────────────────────────────────────────────────────
  const open = useCallback(() => {
    if (onOpen) onOpen(email);
    else navigate(`/emails/${email.id}`);
  }, [email, navigate, onOpen]);

  const handleClick = () => {
    // A completed swipe must not also navigate.
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    open();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };

  // ── Swipe gesture ───────────────────────────────────────────────────────
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canSwipe || event.pointerType === 'mouse') return;
    startRef.current = { x: event.clientX, y: event.clientY };
    axisRef.current = null;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!canSwipe || !start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (axisRef.current === null) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      if (axisRef.current === 'horizontal') {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    if (axisRef.current !== 'horizontal') return;

    // Left only; rubber-band past the threshold.
    const travel = Math.min(0, dx);
    setOffset(Math.max(-MAX_TRAVEL, travel < -ARCHIVE_THRESHOLD ? -ARCHIVE_THRESHOLD + (travel + ARCHIVE_THRESHOLD) / 3 : travel));
  };

  const endGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canSwipe || !startRef.current) return;
    const travelled = offset;

    startRef.current = null;
    axisRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (travelled <= -ARCHIVE_THRESHOLD) {
      swipedRef.current = true;
      setIsDismissing(true);
      setOffset(-MAX_TRAVEL * 3);
      // Let the row slide out before the store drops it from the list.
      window.setTimeout(() => onArchive?.(email), 180);
      return;
    }

    setOffset(0);
  };

  const revealed = offset < -4;

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden bg-white',
        isDismissing && 'pointer-events-none',
        className,
      )}
    >
      {/* Swipe action revealed underneath the row */}
      {canSwipe && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 right-0 flex w-40 items-center justify-end gap-2 pr-6',
            'bg-gradient-to-l from-orange-500 to-orange-400 text-white',
            'transition-opacity duration-150',
            revealed ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Archive className="h-5 w-5" />
          <span className="text-sm font-semibold">Archive</span>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label={`${isUnread ? 'Unread. ' : ''}Email from ${displayName(email.from)}: ${email.subject}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        style={{ transform: offset ? `translate3d(${offset}px, 0, 0)` : undefined }}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-start gap-3 px-4 py-3.5 text-left',
          'touch-pan-y bg-white transition-colors duration-150',
          'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500',
          offset === 0 ? 'transition-[transform,background-color] duration-200 ease-out' : '',
          isUnread && 'bg-orange-50/40 hover:bg-orange-50/70',
          isActive && 'bg-orange-50 hover:bg-orange-50',
        )}
      >
        {/* Unread rail */}
        <span className="mt-4 flex w-2 shrink-0 justify-center" aria-hidden="true">
          {isUnread && <span className="h-2 w-2 rounded-full bg-orange-500" />}
        </span>

        <Avatar name={displayName(email.from)} size="md" className="mt-0.5" />

        <div className="min-w-0 flex-1">
          {/* Sender + timestamp */}
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                'min-w-0 flex-1 truncate text-sm',
                isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700',
              )}
            >
              {displayName(email.from)}
            </p>

            <div className="flex shrink-0 items-center gap-1.5">
              {email.attachments.length > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-gray-400"
                  title={`${email.attachments.length} attachment${email.attachments.length === 1 ? '' : 's'}`}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {email.attachments.length > 1 && (
                    <span className="text-[11px] font-medium tabular-nums">
                      {email.attachments.length}
                    </span>
                  )}
                </span>
              )}

              <time
                dateTime={email.date}
                title={formatFullTimestamp(email.date)}
                className={cn(
                  'text-xs tabular-nums',
                  isUnread ? 'font-semibold text-orange-600' : 'text-gray-400',
                )}
              >
                {formatEmailTimestamp(email.date)}
              </time>

              {onToggleImportant ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleImportant(email);
                  }}
                  aria-label={email.isImportant ? 'Remove importance' : 'Mark important'}
                  aria-pressed={email.isImportant}
                  className={cn(
                    'rounded-md p-1 transition-colors',
                    email.isImportant
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-gray-300 hover:text-amber-500',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                  )}
                >
                  <Star
                    className="h-4 w-4"
                    fill={email.isImportant ? 'currentColor' : 'none'}
                  />
                </button>
              ) : (
                email.isImportant && (
                  <Star className="h-4 w-4 text-amber-500" fill="currentColor" aria-label="Important" />
                )
              )}
            </div>
          </div>

          {/* Subject */}
          <p
            className={cn(
              'mt-0.5 truncate text-sm',
              isUnread ? 'font-semibold text-gray-900' : 'text-gray-700',
            )}
          >
            {email.subject}
          </p>

          {/* Preview */}
          <p className="mt-0.5 truncate text-xs leading-relaxed text-gray-500">
            {email.snippet}
          </p>

          {/* Meta row */}
          {(waitingOn || email.category !== 'primary' || showSwipeHint) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {waitingOn && (
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-100">
                  <Hourglass className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    Waiting on {waitingOn.contactName ?? waitingOn.contactEmail}
                    {waitingOn.chaseDate && ` · chase ${formatShortDate(waitingOn.chaseDate)}`}
                  </span>
                </span>
              )}

              {email.category !== 'primary' && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  {category.label}
                </span>
              )}

              {showSwipeHint && canSwipe && (
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
                  <Archive className="h-3 w-3" />
                  Swipe left to archive
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailCard;
