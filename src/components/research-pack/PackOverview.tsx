import { CalendarDays, CheckCircle2, FileText, Mail, Plus, PenLine, Send } from 'lucide-react';
import type { ResearchPack } from '@/types/index';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { mockCurrentUser } from '@/data/mockUsers';
import { useAuthStore } from '@/store/authStore';
import { cn, formatDate } from '@/lib/utils';
import * as t from '@/lib/theme';
import { PackSection, PackTagList } from './PackSection';
import { packPriority, packPriorityLabel } from './packLinks';
import type { PackLinks } from './packLinks';

// =============================================================================
// PackOverview — the pack at a glance
// =============================================================================

export interface PackOverviewProps {
  pack: ResearchPack;
  links: PackLinks;
  /** Jumps the detail page to another tab when a stat tile is tapped. */
  onOpenTab: (tabId: string) => void;
  onAddTask: () => void;
  onAddNote: () => void;
  onAddEmail: () => void;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-2.5', t.divider)}>
      <span className={t.label}>{label}</span>
      <span className="min-w-0 text-right text-sm text-gray-900">{value}</span>
    </div>
  );
}

export function PackOverview({
  pack,
  links,
  onOpenTab,
  onAddTask,
  onAddNote,
  onAddEmail,
}: PackOverviewProps) {
  const authUser = useAuthStore((s) => s.user);
  const owner =
    authUser && authUser.id === pack.createdById
      ? { name: authUser.displayName, email: authUser.email, avatarUrl: authUser.avatarUrl }
      : {
          name: mockCurrentUser.displayName,
          email: mockCurrentUser.email,
          avatarUrl: mockCurrentUser.avatarUrl ?? null,
        };

  const stats = [
    { id: 'emails', label: 'Emails', count: links.emails.length, icon: Mail },
    { id: 'tasks', label: 'Tasks', count: links.tasks.length, icon: CheckCircle2 },
    { id: 'events', label: 'Events', count: links.events.length, icon: CalendarDays },
    { id: 'notes', label: 'Notes', count: links.notes.length, icon: FileText },
  ];

  const openTaskCount = links.tasks.filter((task) => task.status !== 'completed').length;

  return (
    <div className={t.sectionGap}>
      {/* ── Stat row ──────────────────────────────────────────────────── */}
      <PackSection title="Linked items">
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.id}
                type="button"
                onClick={() => onOpenTab(stat.id)}
                aria-label={`${stat.count} ${stat.label.toLowerCase()}`}
                className={cn(
                  'flex flex-col items-center gap-1 bg-gray-50 px-1 py-3',
                  t.radius,
                  t.pressable,
                  t.focusRing,
                )}
              >
                <Icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                <span className="text-base font-semibold tabular-nums text-gray-900">
                  {stat.count}
                </span>
                <span className="text-[11px] leading-none text-gray-500">{stat.label}</span>
              </button>
            );
          })}
        </div>

        <p className={cn('mt-3', t.meta)}>
          {openTaskCount > 0
            ? `${openTaskCount} task${openTaskCount === 1 ? '' : 's'} still open · ${links.files.length} file${links.files.length === 1 ? '' : 's'} attached`
            : `All tasks done · ${links.files.length} file${links.files.length === 1 ? '' : 's'} attached`}
        </p>
      </PackSection>

      {/* ── Details ───────────────────────────────────────────────────── */}
      <PackSection title="Details">
        <div className="flex items-center gap-3 pb-3">
          <Avatar src={owner.avatarUrl} name={owner.name} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-gray-900">
              {owner.name}
            </span>
            <span className={cn('block truncate', t.meta)}>Owner · {owner.email}</span>
          </span>
        </div>

        <div className={cn('border-t pt-1', t.hairline)}>
          <DetailRow label="Priority" value={packPriorityLabel[packPriority(pack)]} />
          <DetailRow label="Created" value={formatDate(pack.createdAt, DATE_FORMAT)} />
          <DetailRow
            label="Last activity"
            value={formatDate(pack.lastActivityAt ?? pack.updatedAt, DATE_FORMAT)}
          />
          <DetailRow
            label="Due"
            value={pack.dueDate ? formatDate(pack.dueDate, DATE_FORMAT) : 'No due date'}
          />
          <DetailRow
            label="People"
            value={`${links.contacts.length} contact${links.contacts.length === 1 ? '' : 's'}`}
          />
          {pack.isShared && (
            <DetailRow
              label="Shared with"
              value={pack.sharedWithEmails.join(', ') || 'Nobody yet'}
            />
          )}
        </div>

        {pack.watchKeywords.length > 0 && (
          <div className={cn('mt-3 border-t pt-3', t.hairline)}>
            <p className={cn('mb-2', t.label)}>
              Watching {pack.autoAddFromConnectors ? '· auto-adds from connectors' : ''}
            </p>
            <PackTagList tags={pack.watchKeywords} />
          </div>
        )}
      </PackSection>

      {/* ── Quick actions ─────────────────────────────────────────────── */}
      <PackSection title="Quick actions">
        <div className="flex flex-col gap-2">
          <Button fullWidth leftIcon={<Plus />} onClick={onAddTask}>
            Add task
          </Button>
          <Button fullWidth variant="outline" leftIcon={<PenLine />} onClick={onAddNote}>
            Add note
          </Button>
          <Button fullWidth variant="outline" leftIcon={<Send />} onClick={onAddEmail}>
            Add email
          </Button>
        </div>
      </PackSection>
    </div>
  );
}

export default PackOverview;
