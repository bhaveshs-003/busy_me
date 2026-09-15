import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import type { AnalyticsEvent } from '@/types/index';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Diagnostics — a readable view of the in-memory analytics buffer
// =============================================================================

/** Rows shown in the "by type" and "top features" breakdowns. */
const BREAKDOWN_LIMIT = 8;

/** Event names treated as feature usage rather than navigation or lifecycle. */
const NON_FEATURE_EVENTS = new Set(['screen_view', 'app_open', 'app_background']);

/** `task_complete` → `Task complete` */
function humanise(name: string): string {
  const spaced = name.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function tally(events: AnalyticsEvent[], keyOf: (e: AnalyticsEvent) => string | null) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = keyOf(event);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={cn(t.border, t.radius, 'px-3.5 py-3')}>
      <p className="text-xl font-semibold tabular-nums text-gray-900">{value}</p>
      <p className={cn(t.meta, 'mt-0.5')}>{label}</p>
    </div>
  );
}

function BreakdownList({
  title,
  rows,
  total,
  emptyCopy,
}: {
  title: string;
  rows: [string, number][];
  total: number;
  emptyCopy: string;
}) {
  return (
    <section>
      <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>{title}</h2>

      {rows.length === 0 ? (
        <p className={cn(t.border, t.radius, t.meta, 'px-3.5 py-3 leading-relaxed')}>{emptyCopy}</p>
      ) : (
        <div className={cn(t.border, t.radius, 'overflow-hidden')}>
          {rows.slice(0, BREAKDOWN_LIMIT).map(([name, count]) => {
            const share = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={name} className={cn('px-3.5 py-2.5', t.divider)}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-gray-900">{humanise(name)}</span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-gray-900">
                    {count}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-gray-900" style={{ width: `${share}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function DiagnosticsSection() {
  const events = useSettingsStore((s) => s.analyticsEvents);
  const sessionId = useSettingsStore((s) => s.sessionId);
  const sessionStartedAt = useSettingsStore((s) => s.sessionStartedAt);
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const addToast = useUIStore((s) => s.addToast);

  const byType = useMemo(() => tally(events, (e) => e.name), [events]);

  const screenViews = useMemo(
    () =>
      tally(events, (e) =>
        e.name === 'screen_view'
          ? e.screenName ?? (typeof e.properties.screen === 'string' ? e.properties.screen : null)
          : null,
      ),
    [events],
  );

  const topFeatures = useMemo(
    () => tally(events, (e) => (NON_FEATURE_EVENTS.has(e.name) ? null : e.name)),
    [events],
  );

  const screenViewTotal = useMemo(
    () => events.filter((e) => e.name === 'screen_view').length,
    [events],
  );

  const featureTotal = events.length - screenViewTotal;
  const latest = events[0] ?? null;

  const handleCopy = () => {
    const payload = JSON.stringify(
      { sessionId, sessionStartedAt, totalEvents: events.length, byType },
      null,
      2,
    );
    void navigator.clipboard?.writeText(payload);
    addToast({ variant: 'success', title: 'Diagnostics copied' });
  };

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Activity />}
        title="No events recorded yet"
        description="Diagnostics fill in as you move around the app. Fire a test event to see the breakdowns populate."
        action={{
          label: 'Record a test event',
          onClick: () => trackEvent('screen_view', { screen: 'diagnostics' }),
        }}
      />
    );
  }

  return (
    <div className={t.sectionGap}>
      {/* ── Totals ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-2">
        <StatTile label="Total events" value={events.length} />
        <StatTile label="Event types" value={byType.length} />
        <StatTile label="Screen views" value={screenViewTotal} />
        <StatTile label="Feature actions" value={featureTotal} />
      </section>

      <BreakdownList
        title="Events by type"
        rows={byType}
        total={events.length}
        emptyCopy="Nothing recorded yet."
      />

      <BreakdownList
        title="Screen views"
        rows={screenViews}
        total={screenViewTotal}
        emptyCopy="No screen views have been tracked in this session."
      />

      <BreakdownList
        title="Top features"
        rows={topFeatures}
        total={featureTotal}
        emptyCopy="No feature actions yet — open an email or complete a task."
      />

      {/* ── Session ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>Session</h2>
        <dl className={cn(t.border, t.radius, 'overflow-hidden')}>
          {[
            { label: 'Session id', value: sessionId },
            { label: 'Started', value: formatRelativeTime(sessionStartedAt) },
            { label: 'Platform', value: 'web' },
            { label: 'Device id', value: 'web-demo' },
            { label: 'App version', value: '1.0.0' },
            {
              label: 'Last event',
              value: latest ? `${humanise(latest.name)} · ${formatRelativeTime(latest.occurredAt)}` : '—',
            },
            { label: 'Buffer', value: `${events.length} / 500 retained` },
          ].map((row) => (
            <div
              key={row.label}
              className={cn('flex items-baseline justify-between gap-3 px-3.5 py-2.5', t.divider)}
            >
              <dt className={cn(t.body, 'shrink-0')}>{row.label}</dt>
              <dd className="min-w-0 truncate text-right font-mono text-xs text-gray-900">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Button fullWidth variant="outline" onClick={handleCopy}>
        Copy diagnostics
      </Button>
    </div>
  );
}

export default DiagnosticsSection;
