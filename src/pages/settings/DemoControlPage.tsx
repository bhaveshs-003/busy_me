import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  CloudOff,
  Gauge,
  KeyRound,
  Mail,
  PlugZap,
  RotateCcw,
  Timer,
} from 'lucide-react';
import type { AppLifecycleState } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SettingsGroup, SettingsToggleRow } from '@/components/profile/SettingsRow';
import { useSettingsStore } from '@/store/settingsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useConnectorStore } from '@/store/connectorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/uiStore';
import { resetDemoData } from '@/lib/persistence';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Demo Control Panel
//
// The presenter's cockpit: everything here writes through to settingsStore, and
// the latency / error / offline switches reach the mock API on the next call.
// =============================================================================

/** Bounds and granularity of the latency slider, in milliseconds. */
const LATENCY_MIN = 0;
const LATENCY_MAX = 2000;
const LATENCY_STEP = 100;

const ERROR_RATES = [5, 10, 25, 50, 100];

const LIFECYCLE_OPTIONS: { id: AppLifecycleState; label: string; description: string }[] = [
  { id: 'normal', label: 'Normal', description: 'No banner. The app behaves as shipped.' },
  {
    id: 'maintenance',
    label: 'Maintenance',
    description: 'Amber banner explaining scheduled downtime.',
  },
  {
    id: 'update-available',
    label: 'Update Available',
    description: 'Blue banner offering an optional update.',
  },
  {
    id: 'force-update',
    label: 'Force Update',
    description: 'Red blocking banner — the demo cannot proceed without updating.',
  },
];

/** Delay before the fake session expiry kicks the user out. */
const SESSION_EXPIRY_MS = 900;

function latencyLabel(ms: number): string {
  if (ms === 0) return 'Instant';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export default function DemoControlPage() {
  const navigate = useNavigate();

  const demoConfig = useSettingsStore((s) => s.demoConfig);
  const updateDemoConfig = useSettingsStore((s) => s.updateDemoConfig);
  const appLifecycle = useSettingsStore((s) => s.appLifecycle);
  const setAppLifecycle = useSettingsStore((s) => s.setAppLifecycle);
  const sessionId = useSettingsStore((s) => s.sessionId);
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const resetAllData = useSettingsStore((s) => s.resetAllData);

  const addNotification = useNotificationStore((s) => s.addNotification);
  const logout = useAuthStore((s) => s.logout);
  const addToast = useUIStore((s) => s.addToast);

  const [isConfirmingReset, setConfirmingReset] = useState(false);
  const [isResetting, setResetting] = useState(false);
  const [isExpiringSession, setExpiringSession] = useState(false);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'settings/demo' });
  }, [trackEvent]);

  // ── Triggers ───────────────────────────────────────────────────────────

  const triggerTaskReminder = () => {
    addNotification({
      type: 'task-due',
      title: 'Task due in 30 minutes',
      body: 'Send the Meridian partnership redlines back to Priya Nair.',
      deepLinkPath: '/tasks',
      expiresAt: null,
      priority: 'high',
      actionLabel: 'Open task',
    });
    addToast({ variant: 'info', title: 'Task reminder fired' });
  };

  const triggerEmailNotification = () => {
    addNotification({
      type: 'email-received',
      title: 'Marcus Rivera replied',
      body: 'Re: Project Atlas roadmap — "Happy with the Q4 dates, one question on staffing."',
      deepLinkPath: '/emails',
      expiresAt: null,
      priority: 'normal',
      actionLabel: 'Read email',
    });
    addToast({ variant: 'info', title: 'Email notification fired' });
  };

  const triggerConnectorFailure = () => {
    const message = 'Authorisation expired — reconnect Gmail to resume syncing.';

    useConnectorStore.setState((s) => ({
      connectors: {
        ...s.connectors,
        gmail: { ...s.connectors.gmail, status: 'error', errorMessage: message },
      },
      error: message,
    }));

    addNotification({
      type: 'connector-error',
      title: 'Gmail disconnected',
      body: message,
      deepLinkPath: '/integrations',
      expiresAt: null,
      priority: 'urgent',
      actionLabel: 'Reconnect',
    });

    trackEvent('connector_connect_failure', { connector: 'gmail', source: 'demo_panel' });
    addToast({ variant: 'error', title: 'Gmail pushed into an error state' });
  };

  const simulateSessionExpiry = () => {
    setExpiringSession(true);
    addToast({
      variant: 'warning',
      title: 'Session expired',
      message: 'Signing you out…',
    });
    setTimeout(() => {
      logout();
      navigate('/welcome', { replace: true });
    }, SESSION_EXPIRY_MS);
  };

  const handleReset = () => {
    setResetting(true);
    resetAllData();
    // Clears every busyme_ key and reloads so all stores re-seed.
    resetDemoData();
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader title="Demo Control Panel" subtitle="Presenter tools · not shipped" showBack />

      <div className={cn('flex-1 overflow-y-auto px-4 pb-10 pt-4', t.sectionGap)}>
        {/* ── Network ───────────────────────────────────────────────────── */}
        <SettingsGroup
          title="Network"
          description="Applies to the next request. Use latency to show skeletons, errors to show retry states."
        >
          <SettingsToggleRow
            icon={<Timer />}
            label="Simulate latency"
            description="Delay every mock request"
            checked={demoConfig.simulateLatency}
            onChange={(next) => updateDemoConfig({ simulateLatency: next })}
          />

          <div className={cn('px-3.5 py-3', t.divider)}>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="demo-latency" className="text-sm font-medium text-gray-900">
                Latency
              </label>
              <span className="text-sm font-medium tabular-nums text-gray-500">
                {latencyLabel(demoConfig.mockLatencyMs)}
              </span>
            </div>

            <input
              id="demo-latency"
              type="range"
              min={LATENCY_MIN}
              max={LATENCY_MAX}
              step={LATENCY_STEP}
              value={demoConfig.mockLatencyMs}
              disabled={!demoConfig.simulateLatency}
              onChange={(e) => updateDemoConfig({ mockLatencyMs: Number(e.target.value) })}
              className={cn(
                'mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-100',
                'accent-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
                t.focusRing,
              )}
            />

            <div className={cn(t.meta, 'mt-1.5 flex justify-between tabular-nums')}>
              <span>0 ms</span>
              <span>2000 ms</span>
            </div>
          </div>

          <SettingsToggleRow
            icon={<AlertTriangle />}
            label="Simulate errors"
            description="Fail a share of requests at random"
            checked={demoConfig.simulateErrors}
            onChange={(next) => updateDemoConfig({ simulateErrors: next })}
          />

          <div className={cn('px-3.5 py-3', t.divider)}>
            <p className="mb-2 text-sm font-medium text-gray-900">Error rate</p>
            <div role="radiogroup" aria-label="Error rate" className="grid grid-cols-5 gap-1.5">
              {ERROR_RATES.map((rate) => {
                const isActive = demoConfig.errorRatePercent === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    disabled={!demoConfig.simulateErrors}
                    onClick={() => updateDemoConfig({ errorRatePercent: rate })}
                    className={cn(
                      'h-10 rounded-lg border border-gray-100 text-xs font-medium tabular-nums',
                      t.pressable,
                      t.focusRing,
                      'disabled:opacity-50',
                      isActive ? 'bg-gray-900 text-white' : 'bg-white text-gray-600',
                    )}
                  >
                    {rate}%
                  </button>
                );
              })}
            </div>
          </div>

          <SettingsToggleRow
            icon={<CloudOff />}
            label="Offline mode"
            description="Shows the global offline banner and serves empty data"
            checked={demoConfig.offlineMode}
            onChange={(next) => updateDemoConfig({ offlineMode: next })}
          />
        </SettingsGroup>

        {/* ── App lifecycle ─────────────────────────────────────────────── */}
        <section>
          <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>App lifecycle</h2>

          <div
            role="radiogroup"
            aria-label="App lifecycle"
            className={cn(t.border, t.radius, 'overflow-hidden')}
          >
            {LIFECYCLE_OPTIONS.map((option) => {
              const isActive = appLifecycle === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setAppLifecycle(option.id)}
                  className={cn(
                    'flex w-full items-start gap-3 px-3.5 py-3 text-left',
                    t.touchTarget,
                    t.divider,
                    t.pressable,
                    t.focusRing,
                    isActive && 'bg-gray-50',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                      isActive ? 'border-gray-900' : 'border-gray-100',
                    )}
                  >
                    {isActive && <span className="h-2 w-2 rounded-full bg-gray-900" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                    <span className={cn(t.meta, 'mt-0.5 block leading-relaxed')}>
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Triggers ──────────────────────────────────────────────────── */}
        <section>
          <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>Triggers</h2>

          <div className={t.listGap}>
            <Button fullWidth variant="outline" leftIcon={<BellRing />} onClick={triggerTaskReminder}>
              Trigger task reminder
            </Button>

            <Button
              fullWidth
              variant="outline"
              leftIcon={<Mail />}
              onClick={triggerEmailNotification}
            >
              Trigger email notification
            </Button>

            <Button
              fullWidth
              variant="outline"
              leftIcon={<PlugZap />}
              onClick={triggerConnectorFailure}
            >
              Trigger connector failure
            </Button>

            <Button
              fullWidth
              variant="outline"
              leftIcon={<KeyRound />}
              isLoading={isExpiringSession}
              onClick={simulateSessionExpiry}
            >
              Simulate session expiry
            </Button>

            <Button
              fullWidth
              variant="outline"
              leftIcon={<RotateCcw />}
              className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
              onClick={() => setConfirmingReset(true)}
            >
              Reset all demo data
            </Button>
          </div>
        </section>

        {/* ── App info ──────────────────────────────────────────────────── */}
        <section>
          <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>App info</h2>

          <dl className={cn(t.border, t.radius, 'overflow-hidden')}>
            {[
              { label: 'Version', value: '1.0.0' },
              { label: 'Environment', value: 'Demo' },
              { label: 'Seed data', value: demoConfig.seedDataVersion ?? '—' },
              { label: 'Session id', value: sessionId },
              { label: 'Features', value: `${demoConfig.featuresEnabled.length} enabled` },
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

          <p className={cn(t.meta, 'mt-3 flex items-center gap-1.5 px-1')}>
            <Gauge className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            This panel is demo tooling and is not part of the shipped product.
          </p>
        </section>
      </div>

      <ConfirmDialog
        open={isConfirmingReset}
        title="Reset all demo data?"
        description="Every task, email, note, connector and setting returns to its seeded state, then the app reloads. You stay signed in."
        confirmLabel="Reset everything"
        isConfirming={isResetting}
        onConfirm={handleReset}
        onCancel={() => setConfirmingReset(false)}
      />
    </div>
  );
}
