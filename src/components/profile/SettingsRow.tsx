import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Grouped settings rows
//
// A group is a hairline-bordered card; rows inside it are separated by hairline
// dividers only. Icons sit in a neutral grey square — never a coloured tile.
// =============================================================================

export function SettingsGroup({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>{title}</h2>
      <div className={cn(t.border, t.radius, t.surface, 'overflow-hidden')}>{children}</div>
      {description && <p className={cn(t.meta, 'mt-2 px-1 leading-relaxed')}>{description}</p>}
    </section>
  );
}

/** Neutral icon square shared by every row type. */
function RowIcon({ icon, destructive }: { icon?: ReactNode; destructive?: boolean }) {
  if (!icon) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        '[&>svg]:h-4 [&>svg]:w-4',
        destructive ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500',
      )}
    >
      {icon}
    </span>
  );
}

function RowBody({
  label,
  description,
  value,
  destructive,
}: {
  label: string;
  description?: string;
  value?: ReactNode;
  destructive?: boolean;
}) {
  return (
    <>
      <span className="min-w-0 flex-1 text-left">
        <span
          className={cn(
            'block truncate text-sm font-medium',
            destructive ? 'text-red-600' : 'text-gray-900',
          )}
        >
          {label}
        </span>
        {description && (
          <span className={cn(t.meta, 'mt-0.5 block leading-relaxed')}>{description}</span>
        )}
      </span>

      {value !== undefined && value !== null && (
        <span className="shrink-0 truncate text-sm text-gray-400">{value}</span>
      )}
    </>
  );
}

const rowBase = cn(
  'flex w-full items-center gap-3 px-3.5 py-2.5',
  t.touchTarget,
  t.divider,
  t.pressable,
  t.focusRing,
);

export interface SettingsRowProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  /** Trailing value text, e.g. "1.0.0" or "Pro". */
  value?: ReactNode;
  /** Renders the row as a link. Takes precedence over `onClick`. */
  to?: string;
  onClick?: () => void;
  /** Red label + red icon tile, for destructive actions. */
  destructive?: boolean;
  /** Hides the trailing chevron on rows that do not navigate. */
  hideChevron?: boolean;
  disabled?: boolean;
}

export function SettingsRow({
  icon,
  label,
  description,
  value,
  to,
  onClick,
  destructive = false,
  hideChevron = false,
  disabled = false,
}: SettingsRowProps) {
  const chevron = !hideChevron && (to || onClick) && (
    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
  );

  const content = (
    <>
      <RowIcon icon={icon} destructive={destructive} />
      <RowBody label={label} description={description} value={value} destructive={destructive} />
      {chevron}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={rowBase}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={cn(rowBase, 'disabled:opacity-50')}>
        {content}
      </button>
    );
  }

  return <div className={cn(rowBase, 'cursor-default')}>{content}</div>;
}

// =============================================================================
// Toggle
// =============================================================================

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name — the visible label lives in the parent row. */
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        'disabled:opacity-50',
        t.focusRing,
        checked ? 'bg-brand-500' : 'bg-gray-200',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/** A settings row whose trailing control is a switch rather than a chevron. */
export function SettingsToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  icon?: ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn('flex w-full items-center gap-3 px-3.5 py-2.5', t.touchTarget, t.divider)}>
      <RowIcon icon={icon} />
      <RowBody label={label} description={description} />
      <Toggle checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}

// =============================================================================
// Shared field styles
// =============================================================================

export const fieldLabel = 'text-sm font-medium text-gray-700';

export const selectClass = cn(
  'h-11 w-full rounded-lg border border-gray-100 bg-white px-3.5 text-sm text-gray-900',
  'transition-colors duration-150 ease-out',
  'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
);

export const textareaClass = cn(
  'w-full resize-y rounded-lg border border-gray-100 bg-white px-3.5 py-2.5 text-sm',
  'text-gray-900 placeholder-gray-400 transition-colors duration-150',
  'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
);
