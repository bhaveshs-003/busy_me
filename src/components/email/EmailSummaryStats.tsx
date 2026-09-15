import { Hourglass, Mail, Paperclip, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmailViewFilter } from '@/types/index';
import type { EmailStats } from '@/store/emailStore';

// =============================================================================
// EmailSummaryStats — clickable counters above the inbox list
// =============================================================================

/** The quick filters the stat cards and the FilterBar share. */
export type EmailQuickFilter = Exclude<EmailViewFilter, 'all'>;

export interface EmailSummaryStatsProps {
  stats: EmailStats;
  /** Currently applied quick filter, or `'all'` when none is active. */
  active: EmailViewFilter;
  /** Selecting the active card again should clear the filter. */
  onSelect: (filter: EmailViewFilter) => void;
  className?: string;
}

interface StatConfig {
  id: EmailQuickFilter;
  label: string;
  Icon: LucideIcon;
  value: (stats: EmailStats) => number;
  /** Caption shown under the number. */
  caption: (value: number) => string;
  idleTone: string;
  activeTone: string;
  iconTone: string;
}

const STAT_CONFIG: StatConfig[] = [
  {
    id: 'unread',
    label: 'Unread',
    Icon: Mail,
    value: (s) => s.unread,
    caption: (v) => (v === 0 ? 'Inbox zero' : v === 1 ? 'message to read' : 'messages to read'),
    idleTone: 'border-gray-100 hover:border-orange-300 hover:bg-orange-50/50',
    activeTone: 'border-orange-500 bg-orange-50 ring-1 ring-orange-500/30',
    iconTone: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'important',
    label: 'Important',
    Icon: Star,
    value: (s) => s.important,
    caption: (v) => (v === 1 ? 'flagged thread' : 'flagged threads'),
    idleTone: 'border-gray-100 hover:border-amber-300 hover:bg-amber-50/50',
    activeTone: 'border-amber-500 bg-amber-50 ring-1 ring-amber-500/30',
    iconTone: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'waiting',
    label: 'Waiting on',
    Icon: Hourglass,
    value: (s) => s.waitingOn,
    caption: (v) => (v === 1 ? 'reply outstanding' : 'replies outstanding'),
    idleTone: 'border-gray-100 hover:border-blue-300 hover:bg-blue-50/50',
    activeTone: 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/30',
    iconTone: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'attachments',
    label: 'Attachments',
    Icon: Paperclip,
    value: (s) => s.recentAttachments,
    caption: (v) => (v === 1 ? 'file in 14 days' : 'files in 14 days'),
    idleTone: 'border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50',
    activeTone: 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30',
    iconTone: 'bg-emerald-100 text-emerald-600',
  },
];

export function EmailSummaryStats({
  stats,
  active,
  onSelect,
  className,
}: EmailSummaryStatsProps) {
  return (
    <div
      className={cn('grid grid-cols-2 gap-2', className)}
      role="group"
      aria-label="Inbox summary"
    >
      {STAT_CONFIG.map(({ id, label, Icon, value, caption, idleTone, activeTone, iconTone }) => {
        const count = value(stats);
        const isActive = active === id;

        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? 'all' : id)}
            className={cn(
              'group flex items-center gap-3 rounded-lg border bg-white p-3 text-left',
              'transition-all duration-150 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1',
              isActive ? activeTone : idleTone,
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                iconTone,
              )}
              aria-hidden="true"
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold tabular-nums text-gray-900">
                  {count}
                </span>
                <span className="truncate text-xs font-medium text-gray-600">{label}</span>
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-gray-400">
                {caption(count)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default EmailSummaryStats;
