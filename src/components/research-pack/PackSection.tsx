import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Shared chrome for the research pack tabs
// =============================================================================

export interface PackSectionProps {
  title: string;
  /** Right-aligned slot in the section header (counts, buttons). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A titled white card. Every tab is built out of these. */
export function PackSection({ title, action, children, className }: PackSectionProps) {
  return (
    <section className={cn('bg-white p-4', t.border, t.radius, className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={cn('uppercase tracking-wide', t.label)}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// PackTagList
// ---------------------------------------------------------------------------

export function PackTagList({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium leading-none text-gray-500"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// PackFilterChips — greyscale chip row used inside tabs
// ---------------------------------------------------------------------------

export interface PackFilterChip {
  id: string;
  label: string;
  count?: number;
}

export interface PackFilterChipsProps {
  chips: PackFilterChip[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  'aria-label': string;
}

export function PackFilterChips({
  chips,
  active,
  onChange,
  className,
  'aria-label': ariaLabel,
}: PackFilterChipsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('scrollbar-hide flex items-center gap-1.5 overflow-x-auto', className)}
    >
      {chips.map((chip) => {
        const isActive = chip.id === active;
        return (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(chip.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5',
              'text-xs font-medium',
              t.pressable,
              t.focusRing,
              isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500',
            )}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span className={cn('tabular-nums', isActive ? 'text-white/70' : 'text-gray-400')}>
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PackSection;
