import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Button
// =============================================================================

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'outline';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Defaults to `primary` (brand orange). */
  variant?: ButtonVariant;
  /** Control height / typography. Defaults to `md`. */
  size?: ButtonSize;
  /** Renders a spinner and blocks interaction. */
  isLoading?: boolean;
  /** Icon rendered before the label. Hidden while loading. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. Hidden while loading. */
  rightIcon?: ReactNode;
  /** Stretch to the width of the parent. */
  fullWidth?: boolean;
  /** Square icon-only button — pass an accessible `aria-label`. */
  iconOnly?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-orange-500',
  secondary:
    'border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-400',
  ghost:
    'border border-transparent bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400',
  destructive:
    'border border-transparent bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500',
  outline:
    'border border-gray-100 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 focus-visible:ring-orange-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-xs',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2.5 rounded-lg px-6 text-base',
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 w-8 rounded-md p-0',
  md: 'h-10 w-10 rounded-lg p-0',
  lg: 'h-12 w-12 rounded-lg p-0',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    iconOnly = false,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled) || isLoading;
  const iconClass = iconSizeClasses[size];

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center font-medium',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {/* Spinner overlays the content so the button never changes width. */}
      {isLoading && (
        <Loader2
          className={cn('absolute animate-spin', iconClass)}
          aria-hidden="true"
        />
      )}

      <span
        className={cn(
          'inline-flex items-center',
          iconOnly ? '' : 'gap-[inherit]',
          isLoading && 'invisible',
        )}
      >
        {leftIcon && (
          <span className={cn('shrink-0 [&>svg]:h-full [&>svg]:w-full', iconClass)}>
            {leftIcon}
          </span>
        )}
        {children != null && children !== false && (
          <span className="truncate">{children}</span>
        )}
        {rightIcon && (
          <span className={cn('shrink-0 [&>svg]:h-full [&>svg]:w-full', iconClass)}>
            {rightIcon}
          </span>
        )}
      </span>
    </button>
  );
});

export default Button;
