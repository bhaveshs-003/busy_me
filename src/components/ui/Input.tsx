import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Input
// =============================================================================

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  /** Label rendered above the field. */
  label?: string;
  /** Muted hint shown below the field. Hidden while an error is present. */
  helperText?: string;
  /** Error message. Presence switches the field into its error state. */
  error?: string;
  /** Leading adornment (usually an icon). */
  prefix?: ReactNode;
  /** Trailing adornment (icon, unit, or a small button). */
  suffix?: ReactNode;
  /** Allow clicks on the suffix — use for toggles / clear buttons. */
  suffixInteractive?: boolean;
  /** Marks the field required and renders an orange asterisk. */
  required?: boolean;
  /** Control height / typography. Defaults to `md`. */
  inputSize?: InputSize;
  fullWidth?: boolean;
  /** Class applied to the outer wrapper (the input keeps `className`). */
  containerClassName?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-9 text-xs',
  md: 'h-11 text-sm',
  lg: 'h-12 text-base',
};

const paddingClasses: Record<InputSize, { base: string; prefix: string; suffix: string }> = {
  sm: { base: 'px-3', prefix: 'pl-9', suffix: 'pr-9' },
  md: { base: 'px-3.5', prefix: 'pl-10', suffix: 'pr-10' },
  lg: { base: 'px-4', prefix: 'pl-11', suffix: 'pr-11' },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    prefix,
    suffix,
    suffixInteractive = false,
    inputSize = 'md',
    fullWidth = true,
    containerClassName,
    disabled,
    required,
    id,
    className,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(error);
  const padding = paddingClasses[inputSize];

  return (
    <div
      className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}
    >
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium text-gray-700',
            disabled && 'text-gray-400',
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-orange-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <span
            className={cn(
              'pointer-events-none absolute left-3 flex items-center text-gray-400',
              '[&>svg]:h-4 [&>svg]:w-4',
              hasError && 'text-red-400',
            )}
          >
            {prefix}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full rounded-lg border bg-white text-gray-900 placeholder-gray-400',
            'transition-colors duration-150 ease-out',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
            sizeClasses[inputSize],
            padding.base,
            prefix && padding.prefix,
            suffix && padding.suffix,
            hasError
              ? 'border-red-300 focus:border-red-400 focus:ring-red-400/40'
              : 'border-gray-100 hover:border-gray-400 focus:border-orange-500 focus:ring-orange-500/40',
            className,
          )}
          {...rest}
        />

        {suffix && (
          <span
            className={cn(
              'absolute right-3 flex items-center text-gray-400',
              '[&>svg]:h-4 [&>svg]:w-4',
              suffixInteractive
                ? 'cursor-pointer hover:text-gray-600'
                : 'pointer-events-none',
              hasError && !suffixInteractive && 'text-red-400',
            )}
          >
            {suffix}
          </span>
        )}
      </div>

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1 text-xs leading-relaxed text-red-600"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        helperText && (
          <p id={helperId} className="text-xs leading-relaxed text-gray-500">
            {helperText}
          </p>
        )
      )}
    </div>
  );
});

export default Input;
