import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// SearchBar — debounced search input with loading + clear affordances
// =============================================================================

export interface SearchBarProps {
  /** Committed (debounced) value owned by the parent. */
  value: string;
  /** Fired after `debounceMs` of inactivity, and immediately on clear / Enter. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Swaps the leading icon for a spinner. */
  isLoading?: boolean;
  /** Debounce window in ms. Defaults to 300. */
  debounceMs?: number;
  /** Fired when the user presses Escape on an empty field. */
  onEscape?: () => void;
  autoFocus?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  isLoading = false,
  debounceMs = 300,
  onEscape,
  autoFocus = false,
  className,
  'aria-label': ariaLabel,
}: SearchBarProps) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the last value we pushed up, so external resets still win.
  const lastEmittedRef = useRef(value);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Adopt the prop only when it changed outside of this component.
  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      clearTimer();
      setDraft(value);
    }
  }, [value, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const emit = useCallback(
    (next: string) => {
      clearTimer();
      lastEmittedRef.current = next;
      onChange(next);
    },
    [clearTimer, onChange],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDraft(next);
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      lastEmittedRef.current = next;
      onChange(next);
    }, debounceMs);
  };

  const handleClear = () => {
    setDraft('');
    emit('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      emit(draft); // Skip the debounce — the user asked for it now.
    } else if (event.key === 'Escape') {
      if (draft) {
        handleClear();
      } else {
        onEscape?.();
      }
    }
  };

  return (
    <div className={cn('relative flex items-center', className)} role="search">
      <span className="pointer-events-none absolute left-3 flex items-center">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
        )}
      </span>

      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'h-10 w-full rounded-lg border border-gray-100 bg-white pl-10 pr-10',
          'text-sm text-gray-900 placeholder-gray-400',
          'transition-colors duration-150 ease-out hover:border-gray-400',
          'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
        )}
      />

      {draft.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            'absolute right-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full',
            'text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
