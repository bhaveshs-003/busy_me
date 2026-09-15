import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

// =============================================================================
// ConfirmDialog — blocking confirmation for destructive / risky actions
// =============================================================================

export type ConfirmDialogVariant = 'danger' | 'warning';

export interface ConfirmDialogProps {
  /** Controls visibility. Nothing renders while false. */
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` = red confirm button, `warning` = amber. Defaults to `danger`. */
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
  /** Disables both buttons and spins the confirm button. */
  isConfirming?: boolean;
}

const variantStyles: Record<
  ConfirmDialogVariant,
  { iconWrap: string; confirmVariant: 'destructive' | 'primary'; confirmClass?: string }
> = {
  danger: {
    iconWrap: 'bg-red-50 text-red-500 ring-red-100',
    confirmVariant: 'destructive',
  },
  warning: {
    iconWrap: 'bg-amber-50 text-amber-500 ring-amber-100',
    confirmVariant: 'primary',
    confirmClass:
      'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 focus-visible:ring-amber-500',
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Keep the latest cancel handler without re-binding listeners each render.
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  // Escape to dismiss, Tab trapped inside the panel, body scroll locked.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancelRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const styles = variantStyles[variant];

  // Portal into the phone frame's overlay root so the dialog stays inside the
  // frame on wide screens. Falls back to <body> if the frame isn't mounted
  // (e.g. a dialog shown on an unauthenticated route).
  const overlayRoot =
    document.getElementById('overlay-root') ?? document.body;

  return createPortal(
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={isConfirming ? undefined : onCancel}
        className="absolute inset-0 animate-fade-in bg-gray-900/40"
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative z-10 w-full max-w-sm animate-slide-up overflow-hidden',
          'rounded-lg bg-white border border-gray-100',
        )}
      >
        <div className="p-6">
          <div
            aria-hidden="true"
            className={cn(
              'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full',
              '[&>svg]:h-6 [&>svg]:w-6',
              styles.iconWrap,
            )}
          >
            {variant === 'danger' ? <AlertTriangle /> : <AlertCircle />}
          </div>

          <h2
            id={titleId}
            className="text-center text-base font-semibold text-gray-900"
          >
            {title}
          </h2>

          {description && (
            <p
              id={descriptionId}
              className="mt-1.5 text-center text-sm leading-relaxed text-gray-500"
            >
              {description}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button
            ref={cancelRef}
            variant="outline"
            onClick={onCancel}
            disabled={isConfirming}
            className="flex-1"
          >
            {cancelLabel}
          </Button>

          <Button
            variant={styles.confirmVariant}
            onClick={onConfirm}
            isLoading={isConfirming}
            className={cn('flex-1', styles.confirmClass)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    overlayRoot,
  );
}

export default ConfirmDialog;
