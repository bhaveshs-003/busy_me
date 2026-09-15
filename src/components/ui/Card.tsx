import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Card — container with optional header / footer and padding variants
// =============================================================================

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ReactNode;
  /** Rendered above the body, separated by a hairline rule. */
  header?: ReactNode;
  /** Rendered below the body, separated by a hairline rule. */
  footer?: ReactNode;
  padding?: CardPadding;
  /** Lift + border emphasis on hover. Implied when `onClick` is set. */
  hoverable?: boolean;
  /** Makes the card an activatable element (button semantics + keyboard). */
  onClick?: () => void;
  /** Draws the brand ring for a selected card. */
  isSelected?: boolean;
  className?: string;
  /** Class applied to the body wrapper only. */
  bodyClassName?: string;
}

const bodyPadding: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

const edgePadding: Record<CardPadding, string> = {
  none: 'px-4 py-3',
  sm: 'px-3 py-2.5',
  md: 'px-5 py-3.5',
  lg: 'px-7 py-5',
};

export function Card({
  children,
  header,
  footer,
  padding = 'md',
  hoverable = false,
  onClick,
  isSelected = false,
  className,
  bodyClassName,
}: CardProps) {
  const isInteractive = Boolean(onClick);
  const showHover = hoverable || isInteractive;

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
        'overflow-hidden rounded-lg border bg-white',
        'transition-all duration-200 ease-out',
        isSelected
          ? 'border-orange-200 ring-1 ring-orange-200'
          : 'border-gray-100/80',
        showHover && 'hover:border-gray-100',
        isInteractive &&
          'cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      {header && (
        <div className={cn('border-b border-gray-100 bg-gray-50/60', edgePadding[padding])}>
          {header}
        </div>
      )}

      <div className={cn(bodyPadding[padding], bodyClassName)}>{children}</div>

      {footer && (
        <div className={cn('border-t border-gray-100 bg-gray-50/60', edgePadding[padding])}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composition helpers
// ---------------------------------------------------------------------------

export interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardSectionProps) {
  return (
    <h3 className={cn('text-sm font-semibold text-gray-900', className)}>{children}</h3>
  );
}

export function CardDescription({ children, className }: CardSectionProps) {
  return (
    <p className={cn('text-xs leading-relaxed text-gray-500', className)}>{children}</p>
  );
}

export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>{children}</div>
  );
}

export default Card;
