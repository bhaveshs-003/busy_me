import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

// =============================================================================
// ErrorState
// =============================================================================

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Shows the retry button when provided. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Spins the retry icon while a retry is in flight. */
  isRetrying?: boolean;
  /** Technical detail (error message / request id) rendered in a muted box. */
  detail?: string;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  isRetrying = false,
  detail,
  compact = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-8' : 'py-16',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'mb-4 flex items-center justify-center rounded-full',
          'bg-red-50 text-red-500 ring-1 ring-inset ring-red-100',
          compact ? 'h-12 w-12 [&>svg]:h-6 [&>svg]:w-6' : 'h-16 w-16 [&>svg]:h-7 [&>svg]:w-7',
        )}
      >
        <AlertTriangle />
      </div>

      <h3 className="text-base font-semibold text-gray-900">{title}</h3>

      {description && (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      )}

      {detail && (
        <pre className="mt-3 max-w-sm overflow-x-auto rounded-lg bg-gray-50 px-3 py-2 text-left text-[11px] leading-relaxed text-gray-500 ring-1 ring-inset ring-gray-100">
          {detail}
        </pre>
      )}

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RefreshCw />}
          className="mt-5"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
