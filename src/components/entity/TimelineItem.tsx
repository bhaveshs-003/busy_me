import type { ComponentType, ReactNode } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileText,
  Globe,
  Mail,
  Paperclip,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import type { TimelineEntry, TimelineEntryType } from '@/types';
import { cn, formatRelativeTime } from '@/lib/utils';

// =============================================================================
// TimelineItem — one entry in a research pack timeline
// =============================================================================

export interface TimelineItemProps {
  entry: TimelineEntry;
  /** Hides the connector line below the node for the final entry. */
  isLast?: boolean;
  /** Trailing slot (menu, link-out button). */
  action?: ReactNode;
  onClick?: (entry: TimelineEntry) => void;
  className?: string;
}

interface TypeConfig {
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Tailwind classes for the node circle. */
  node: string;
}

const typeConfig: Record<TimelineEntryType, TypeConfig> = {
  email: { label: 'Email', icon: Mail, node: 'bg-gray-100 text-gray-500 ring-blue-100' },
  event: {
    label: 'Event',
    icon: CalendarDays,
    node: 'bg-gray-100 text-gray-500 ring-purple-100',
  },
  note: { label: 'Note', icon: FileText, node: 'bg-gray-100 text-gray-500 ring-amber-100' },
  task: {
    label: 'Task',
    icon: CheckCircle2,
    node: 'bg-gray-100 text-gray-500 ring-emerald-100',
  },
  'web-search': {
    label: 'Web search',
    icon: Globe,
    node: 'bg-gray-100 text-gray-600 ring-gray-100',
  },
  'ai-summary': {
    label: 'AI summary',
    icon: Sparkles,
    node: 'bg-gray-100 text-gray-500 ring-orange-100',
  },
  file: {
    label: 'File',
    icon: Paperclip,
    node: 'bg-gray-100 text-gray-500 ring-indigo-100',
  },
  'status-change': {
    label: 'Status change',
    icon: Activity,
    node: 'bg-gray-100 text-gray-500 ring-teal-100',
  },
  'contact-added': {
    label: 'Contact',
    icon: UserPlus,
    node: 'bg-gray-100 text-gray-500 ring-pink-100',
  },
};

const fallbackConfig: TypeConfig = {
  label: 'Update',
  icon: Circle,
  node: 'bg-gray-100 text-gray-500 ring-gray-100',
};

export function TimelineItem({
  entry,
  isLast = false,
  action,
  onClick,
  className,
}: TimelineItemProps) {
  const config = typeConfig[entry.type] ?? fallbackConfig;
  const Icon = config.icon;
  const isInteractive = Boolean(onClick);

  return (
    <div className={cn('flex gap-3', className)}>
      {/* Node + connector */}
      <div className="flex shrink-0 flex-col items-center">
        <span
          aria-hidden="true"
          className={cn(
            'z-10 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white',
            config.node,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>

        {!isLast && (
          <span
            aria-hidden="true"
            className="-mt-1 w-px flex-1 bg-gradient-to-b from-gray-200 to-gray-200/40"
          />
        )}
      </div>

      {/* Content */}
      <div
        onClick={onClick ? () => onClick(entry) : undefined}
        onKeyDown={
          onClick
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onClick(entry);
                }
              }
            : undefined
        }
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        className={cn(
          'min-w-0 flex-1 rounded-lg',
          isLast ? 'pb-1' : 'pb-6',
          isInteractive &&
            'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">
            {entry.title}
          </p>

          <div className="flex shrink-0 items-center gap-1.5">
            <time
              dateTime={entry.occurredAt}
              title={new Date(entry.occurredAt).toLocaleString()}
              className="text-xs text-gray-400"
            >
              {formatRelativeTime(entry.occurredAt)}
            </time>
            {action}
          </div>
        </div>

        {entry.summary && (
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-gray-500">
            {entry.summary}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none',
              'ring-1 ring-inset',
              config.node,
            )}
          >
            {config.label}
          </span>

          {entry.isAIGenerated && entry.type !== 'ai-summary' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium leading-none text-orange-700 ring-1 ring-inset ring-orange-100">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI
            </span>
          )}

          {entry.sourceUrl && (
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(event) => event.stopPropagation()}
              className="text-[11px] font-medium text-orange-600 underline-offset-2 hover:underline"
            >
              View source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimelineItem;
