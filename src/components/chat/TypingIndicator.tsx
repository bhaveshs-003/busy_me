import { cn } from '@/lib/utils';

// =============================================================================
// TypingIndicator — animated three-dot bubble shown while the AI composes
// =============================================================================

export interface TypingIndicatorProps {
  /** Optional status line, e.g. "Searching the web…". */
  label?: string | null;
  /** Hide the leading avatar when stacking under another AI bubble. */
  showAvatar?: boolean;
  className?: string;
}

export function TypingIndicator({
  label = null,
  showAvatar = true,
  className,
}: TypingIndicatorProps) {
  return (
    <div
      className={cn('flex w-full items-end gap-2 animate-fade-in', className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Busy.me is typing'}
    >
      {showAvatar ? (
        <div
          aria-hidden="true"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white"
        >
          B
        </div>
      ) : (
        <div aria-hidden="true" className="h-8 w-8 flex-shrink-0" />
      )}

      <div className="flex items-center gap-2.5 rounded-lg rounded-bl-md border border-gray-100 bg-white px-4 py-3">
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
          <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
          <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
        </span>
        {label && (
          <span className="text-xs font-medium text-gray-500">{label}</span>
        )}
      </div>
    </div>
  );
}

export default TypingIndicator;
