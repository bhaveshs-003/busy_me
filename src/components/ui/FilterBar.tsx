import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// FilterBar — horizontally scrollable filter chips
// =============================================================================

export interface FilterItem {
  id: string;
  label: string;
  /** Optional count rendered as a pill inside the chip. */
  count?: number;
  /** Optional leading icon. */
  icon?: ReactNode;
}

export interface FilterBarProps {
  filters: FilterItem[];
  /** Id of the active filter. */
  active: string;
  onChange: (id: string) => void;
  /** Sticks the bar to the top of a scrolling list with a blurred backdrop. */
  sticky?: boolean;
  className?: string;
  'aria-label'?: string;
}

function formatCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function FilterBar({
  filters,
  active,
  onChange,
  sticky = false,
  className,
  'aria-label': ariaLabel = 'Filters',
}: FilterBarProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-2 overflow-x-auto overscroll-x-contain py-1',
        // Hide the scrollbar across engines without a plugin.
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'snap-x snap-mandatory scroll-px-1',
        sticky && 'sticky top-0 z-10 bg-white/85 backdrop-blur-sm',
        className,
      )}
    >
      {filters.map((filter) => {
        const isActive = filter.id === active;

        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(filter.id)}
            className={cn(
              'inline-flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap',
              'rounded-full px-3.5 py-1.5 text-sm font-medium',
              'transition-all duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1',
              isActive
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900',
            )}
          >
            {filter.icon && (
              <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{filter.icon}</span>
            )}
            {filter.label}
            {filter.count !== undefined && (
              <span
                className={cn(
                  'inline-flex h-[18px] min-w-[18px] items-center justify-center px-1',
                  'rounded-full text-[11px] font-semibold tabular-nums',
                  isActive ? 'bg-white/25 text-white' : 'bg-white text-gray-500',
                )}
              >
                {formatCount(filter.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default FilterBar;
