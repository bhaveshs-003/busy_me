import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import type { ResearchPack } from '@/types/index';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import * as t from '@/lib/theme';
import { PackSection } from './PackSection';
import type { PackLinks } from './packLinks';

// =============================================================================
// PackBriefing — the simulated AI briefing
//
// Nothing here calls a model. The briefing is derived deterministically from the
// pack's own linked entities, so it stays true to the data on screen and changes
// as the pack changes.
// =============================================================================

/** How long the fake "regenerating" pass runs for. */
const REFRESH_MS = 2000;

function isOverdue(dueDate: string | null | undefined, now: number): boolean {
  return Boolean(dueDate) && Date.parse(dueDate as string) < now;
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className={cn(t.body, 'text-gray-400')}>{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden="true"
            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300"
          />
          <span className="text-sm leading-relaxed text-gray-700">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export interface PackBriefingProps {
  pack: ResearchPack;
  links: PackLinks;
}

export function PackBriefing({ pack, links }: PackBriefingProps) {
  const [isRefreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const now = Date.now();

  const briefing = useMemo(() => {
    const openTasks = links.tasks.filter((task) => task.status !== 'completed');
    const doneTasks = links.tasks.filter((task) => task.status === 'completed');
    const overdueTasks = openTasks.filter((task) => isOverdue(task.dueDate, now));
    const unreadEmails = links.emails.filter((email) => email.status === 'unread');

    const upcoming = links.events
      .filter((event) => Date.parse(event.startAt) >= now)
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
      .slice(0, 3);

    // Key developments: prefer the seeded AI insights, otherwise synthesise
    // from the most recent timeline activity.
    const developments =
      pack.aiKeyInsights.length > 0
        ? pack.aiKeyInsights
        : [...pack.timeline]
            .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
            .slice(0, 4)
            .map((entry) =>
              entry.summary ? `${entry.title} — ${entry.summary}` : entry.title,
            );

    const openItems: string[] = [];
    if (openTasks.length > 0) {
      openItems.push(
        `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}, including "${openTasks[0].title}".`,
      );
    }
    if (unreadEmails.length > 0) {
      openItems.push(
        `${unreadEmails.length} unread email${unreadEmails.length === 1 ? '' : 's'} on this pack.`,
      );
    }
    if (doneTasks.length > 0) {
      openItems.push(
        `${doneTasks.length} task${doneTasks.length === 1 ? '' : 's'} already closed out.`,
      );
    }

    const risks: string[] = [];
    for (const task of overdueTasks.slice(0, 3)) {
      risks.push(`"${task.title}" is past its due date (${formatDate(task.dueDate!)}).`);
    }
    if (pack.dueDate && isOverdue(pack.dueDate, now)) {
      risks.push(`The pack itself passed its target date of ${formatDate(pack.dueDate)}.`);
    }
    const waiting = openTasks.filter((task) => Boolean(task.waitingOn));
    if (waiting.length > 0) {
      risks.push(
        `Waiting on someone else for ${waiting.length} item${waiting.length === 1 ? '' : 's'}.`,
      );
    }

    return { developments, openItems, upcoming, risks, nextSteps: pack.aiNextSteps };
  }, [pack, links, now]);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setRefreshedAt(new Date().toISOString());
    }, REFRESH_MS);
  }

  const lastUpdated = refreshedAt ?? pack.updatedAt;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
          <p className={cn(t.meta, 'truncate')}>
            {isRefreshing ? 'Regenerating briefing…' : `Updated ${formatRelativeTime(lastUpdated)}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          isLoading={isRefreshing}
          className="shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {isRefreshing ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn(t.border, t.radius, 'space-y-2.5 bg-white p-4')}>
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {pack.aiSummary && (
            <PackSection title="Summary">
              <p className="text-sm leading-relaxed text-gray-700">{pack.aiSummary}</p>
            </PackSection>
          )}

          <PackSection title="Key developments">
            <BulletList
              items={briefing.developments}
              empty="No activity has been recorded on this pack yet."
            />
          </PackSection>

          <PackSection title="Open items">
            <BulletList items={briefing.openItems} empty="Nothing outstanding." />
          </PackSection>

          <PackSection title="Upcoming events">
            {briefing.upcoming.length === 0 ? (
              <p className={cn(t.body, 'text-gray-400')}>Nothing scheduled.</p>
            ) : (
              <ul className="space-y-2.5">
                {briefing.upcoming.map((event) => (
                  <li key={event.id} className="flex gap-2.5">
                    <CalendarDays
                      className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {event.title}
                      </span>
                      <span className={cn(t.meta, 'block')}>
                        {formatDate(event.startAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PackSection>

          <PackSection title="Important contacts">
            {links.contacts.length === 0 ? (
              <p className={cn(t.body, 'text-gray-400')}>No one is linked to this pack yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {links.contacts.slice(0, 4).map((contact) => {
                  const name = `${contact.firstName} ${contact.lastName}`.trim();
                  return (
                    <li key={contact.id} className="flex items-center gap-2.5">
                      <Avatar name={name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {name}
                        </span>
                        <span className={cn(t.meta, 'block truncate')}>
                          {[contact.jobTitle, contact.company].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </PackSection>

          <PackSection title="Attention required">
            {briefing.risks.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                Nothing needs attention right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {briefing.risks.map((risk, i) => (
                  <li key={i} className="flex gap-2.5">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-relaxed text-gray-700">{risk}</span>
                  </li>
                ))}
              </ul>
            )}
          </PackSection>

          {briefing.nextSteps.length > 0 && (
            <PackSection title="Suggested next steps">
              <BulletList items={briefing.nextSteps} empty="" />
            </PackSection>
          )}
        </>
      )}
    </div>
  );
}

export default PackBriefing;
