import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Connector, ConnectorType } from '@/types/index';
import { Button } from '@/components/ui/Button';
import {
  ConnectorGlyph,
  connectorMeta,
  connectorOrder,
  formatAge,
  isConnectorBusy,
} from './ConnectorCard';
import { useConnectorStore } from '@/store/connectorStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// ConnectorHealthPanel — one-glance summary of every connector
// =============================================================================

type HealthTone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

interface Issue {
  type: ConnectorType;
  headline: string;
  detail: string;
  actionLabel: string;
  tone: Extract<HealthTone, 'warning' | 'error'>;
}

/** Status → the dot colour used in the per-connector rows. */
const STATUS_TONE: Record<Connector['status'], HealthTone> = {
  connected: 'success',
  syncing: 'info',
  connecting: 'info',
  oauth_consent: 'info',
  authorising: 'info',
  disconnected: 'neutral',
  expired: 'warning',
  error: 'error',
};

function rowStatusLabel(connector: Connector): string {
  switch (connector.status) {
    case 'connected':
      return connector.lastSyncedAt ? `Synced ${formatAge(connector.lastSyncedAt)}` : 'Not synced yet';
    case 'syncing':
      return 'Syncing now';
    case 'connecting':
      return 'Connecting';
    case 'oauth_consent':
      return 'Awaiting consent';
    case 'authorising':
      return 'Authorising';
    case 'expired':
      return 'Session expired';
    case 'error':
      return 'Last sync failed';
    case 'disconnected':
    default:
      return 'Not connected';
  }
}

export interface ConnectorHealthPanelProps {
  className?: string;
}

export function ConnectorHealthPanel({ className }: ConnectorHealthPanelProps) {
  const connectors = useConnectorStore((s) => s.connectors);
  const syncAllConnectors = useConnectorStore((s) => s.syncAllConnectors);
  const connectConnector = useConnectorStore((s) => s.connectConnector);
  const syncConnector = useConnectorStore((s) => s.syncConnector);
  const addToast = useUIStore((s) => s.addToast);

  const [isSyncingAll, setSyncingAll] = useState(false);

  const list = useMemo(
    () => connectorOrder.map((type) => connectors[type]),
    [connectors],
  );

  const connectedCount = list.filter((c) => c.status === 'connected' || c.status === 'syncing').length;
  const isAnyBusy = list.some((c) =>
    ['syncing', 'connecting', 'oauth_consent', 'authorising'].includes(c.status),
  );

  const issues = useMemo<Issue[]>(
    () =>
      list.flatMap<Issue>((connector) => {
        if (connector.status === 'expired') {
          return [
            {
              type: connector.type,
              headline: `${connectorMeta[connector.type].label} needs re-authorisation`,
              detail:
                connector.errorMessage ??
                'The provider session expired, so syncing is paused.',
              actionLabel: 'Reconnect',
              tone: 'warning',
            },
          ];
        }
        if (connector.status === 'error') {
          return [
            {
              type: connector.type,
              headline: `${connectorMeta[connector.type].label} sync failed`,
              detail: connector.errorMessage ?? 'The last sync did not complete.',
              actionLabel: 'Retry',
              tone: 'error',
            },
          ];
        }
        return [];
      }),
    [list],
  );

  const summaryTone: HealthTone = issues.some((i) => i.tone === 'error')
    ? 'error'
    : issues.length > 0
      ? 'warning'
      : connectedCount > 0
        ? 'success'
        : 'neutral';

  const summaryLine =
    issues.length > 0
      ? `${issues.length} connector${issues.length === 1 ? '' : 's'} need${issues.length === 1 ? 's' : ''} attention`
      : connectedCount > 0
        ? 'All connectors healthy'
        : 'No connectors are set up yet';

  const lastSyncedAcross = list
    .map((c) => (c.lastSyncedAt ? Date.parse(c.lastSyncedAt) : Number.NaN))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0];

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await syncAllConnectors();
      addToast({ variant: 'success', title: 'All connectors synced' });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleIssueAction = async (issue: Issue) => {
    if (issue.tone === 'warning') {
      await connectConnector(issue.type);
      return;
    }
    try {
      await syncConnector(issue.type);
      addToast({ variant: 'success', title: `${connectorMeta[issue.type].label} synced` });
    } catch {
      addToast({
        variant: 'error',
        title: `${connectorMeta[issue.type].label} sync failed`,
        message: 'Try again in a moment.',
      });
    }
  };

  return (
    <div className={cn('bg-white', t.border, t.radius, className)}>
      {/* Summary */}
      <div className={cn('flex items-start gap-3 border-b p-4', t.hairline)}>
        <span
          aria-hidden="true"
          className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', t.statusDot[summaryTone])}
        />
        <div className="min-w-0 flex-1">
          <p className={t.title}>{summaryLine}</p>
          <p className={cn('mt-0.5', t.meta)}>
            {connectedCount} of {list.length} connected
            {lastSyncedAcross ? ` · last activity ${formatAge(new Date(lastSyncedAcross).toISOString())}` : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw />}
          isLoading={isSyncingAll}
          disabled={connectedCount === 0 || (isAnyBusy && !isSyncingAll)}
          onClick={() => void handleSyncAll()}
          className="flex-shrink-0"
        >
          Sync all
        </Button>
      </div>

      {/* Per-connector last sync */}
      <ul>
        {list.map((connector) => (
          <li
            key={connector.id}
            className={cn('flex items-center gap-3 px-4 py-3', t.divider, t.touchTarget)}
          >
            <ConnectorGlyph type={connector.type} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
              {connectorMeta[connector.type].label}
            </span>
            <span className="flex flex-shrink-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  t.statusDot[STATUS_TONE[connector.status]],
                )}
              />
              <span className={t.meta}>{rowStatusLabel(connector)}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Open issues */}
      {issues.length > 0 && (
        <div className={cn('border-t p-4', t.hairline)}>
          <p className={t.label}>Current issues</p>
          <ul className="mt-3 space-y-3">
            {issues.map((issue) => (
              <li key={issue.type} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full',
                    t.statusDot[issue.tone],
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{issue.headline}</p>
                  <p className={cn('mt-0.5 leading-relaxed', t.meta)}>{issue.detail}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => void handleIssueAction(issue)}
                >
                  {issue.actionLabel}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ConnectorHealthPanel;
