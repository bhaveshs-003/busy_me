import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Tabs
// =============================================================================

export interface TabItem {
  id: string;
  label: string;
  /** Optional count pill rendered after the label. */
  count?: number;
  disabled?: boolean;
}

export type TabsVariant = 'underline' | 'pill';

export interface TabsProps {
  tabs: TabItem[];
  /** Id of the active tab. */
  active: string;
  onChange: (id: string) => void;
  variant?: TabsVariant;
  /** Stretch tabs to fill the available width (underline variant). */
  fullWidth?: boolean;
  className?: string;
  'aria-label'?: string;
}

function formatCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function Tabs({
  tabs,
  active,
  onChange,
  variant = 'underline',
  fullWidth = false,
  className,
  'aria-label': ariaLabel = 'Tabs',
}: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Roving focus: arrows move between enabled tabs and activate them.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    // Start just outside the range for Home/End so the first step lands on the edge.
    const step = event.key === 'ArrowLeft' || event.key === 'End' ? -1 : 1;
    let cursor =
      event.key === 'Home' ? -1 : event.key === 'End' ? tabs.length : index;

    let nextIndex = -1;
    for (let i = 0; i < tabs.length; i += 1) {
      cursor = (cursor + step + tabs.length) % tabs.length;
      if (!tabs[cursor].disabled) {
        nextIndex = cursor;
        break;
      }
    }

    const next = nextIndex === -1 ? undefined : tabs[nextIndex];
    if (!next) return;

    event.preventDefault();
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
    onChange(next.id);
  };

  const isPill = variant === 'pill';

  return (
    <div className={cn(!isPill && 'border-b border-gray-100', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'flex items-center',
          isPill
            ? 'inline-flex gap-1 rounded-lg bg-gray-100 p-1'
            : cn(
                '-mb-px gap-0 overflow-x-auto',
                '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              ),
        )}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === active;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`tabpanel-${tab.id}`}
              aria-selected={isActive}
              disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium',
                'transition-all duration-200 ease-out',
                'disabled:cursor-not-allowed disabled:opacity-40',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                isPill
                  ? cn(
                      'rounded-lg px-3.5 py-1.5',
                      isActive
                        ? 'bg-white text-gray-900 ring-1 ring-gray-900/5'
                        : 'text-gray-500 hover:text-gray-900',
                    )
                  : cn(
                      'border-b-2 px-4 py-3 focus-visible:ring-inset',
                      fullWidth && 'flex-1 justify-center',
                      isActive
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:border-gray-100 hover:text-gray-900',
                    ),
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'inline-flex h-[18px] min-w-[18px] items-center justify-center px-1',
                    'rounded-full text-[11px] font-semibold tabular-nums',
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  {formatCount(tab.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Tabs;
