import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Badge — small colored label
// =============================================================================

export type BadgeColor = 'orange' | 'green' | 'red' | 'blue' | 'gray' | 'yellow';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  color?: BadgeColor;
  size?: BadgeSize;
  /** Leading status dot in the badge's accent color. */
  dot?: boolean;
  /** Softer, borderless treatment for dense lists. */
  subtle?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Flat treatment: no fill, no ring. Meaning is carried by the leading dot
 * (see `badgeDotClasses`) plus neutral text, so dense lists stay calm and the
 * only saturated colour on screen remains the primary action.
 */
const colorClasses: Record<BadgeColor, string> = {
  orange: 'text-gray-600',
  green: 'text-gray-600',
  red: 'text-gray-600',
  blue: 'text-gray-600',
  gray: 'text-gray-500',
  yellow: 'text-gray-600',
};

export const badgeDotClasses: Record<BadgeColor, string> = {
  orange: 'bg-orange-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
  yellow: 'bg-amber-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'h-5 gap-1.5 text-[11px]',
  md: 'h-6 gap-1.5 text-xs',
};

export function Badge({
  color = 'gray',
  size = 'md',
  // A badge always reads as a dot + label now; the prop is kept so existing
  // call sites continue to compile, but the dot is shown regardless.
  dot = true,
  subtle = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center font-medium leading-none',
        'whitespace-nowrap',
        colorClasses[color],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 rounded-full',
            size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
            badgeDotClasses[color],
          )}
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}

export default Badge;
