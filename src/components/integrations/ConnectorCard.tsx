import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ChevronRight,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import type { Connector, ConnectorStatus, ConnectorType } from '@/types/index';
import { CONNECTOR_TRANSIENT_STATUSES } from '@/types/index';
import { ConnectorStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OAuthConsentModal } from './OAuthConsentModal';
import { useConnectorStore } from '@/store/connectorStore';
import { useUIStore } from '@/store/uiStore';
import { providerAccounts } from '@/data/connectors';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Provider metadata — shared by every integrations surface
// =============================================================================

export interface ConnectorMeta {
  /** Name shown on the card. */
  label: string;
  /** Owning provider, used for secondary copy. */
  provider: string;
  /** Sales line shown while the connector is disconnected. */
  description: string;
  /** Glyph rendered in the neutral square. */
  icon: LucideIcon;
}

export const connectorMeta: Record<ConnectorType, ConnectorMeta> = {
  gmail: {
    label: 'Gmail',
    provider: 'Google',
    description: 'Sync your inbox so Busy.me can triage mail, draft replies and pull out tasks.',
    icon: Mail,
  },
  'google-calendar': {
    label: 'Google Calendar',
    provider: 'Google',
    description: 'Read your calendar to schedule around meetings and spot conflicts early.',
    icon: CalendarDays,
  },
  outlook: {
    label: 'Outlook',
    provider: 'Microsoft',
    description: 'Connect a Microsoft mailbox to keep work email and calendar in one place.',
    icon: Inbox,
  },
  slack: {
    label: 'Slack',
    provider: 'Slack',
    description: 'Follow channel activity and turn messages into tasks without leaving Busy.me.',
    icon: MessageSquare,
  },
};

/** Every connector type, in the order the product introduces them. */
export const connectorOrder: ConnectorType[] = [
  'gmail',
  'google-calendar',
  'outlook',
  'slack',
];

/** True while an operation is in flight, so new actions must be blocked. */
export function isConnectorBusy(connector: Connector): boolean {
  return (CONNECTOR_TRANSIENT_STATUSES as readonly ConnectorStatus[]).includes(
    connector.status,
  );
}

/**
 * Compact age string — "just now", "5m ago", "3h ago", "2d ago".
 * Deliberately terser than `formatRelativeTime` so it fits a dense row.
 */
export function formatAge(iso: string | null): string {
  if (!iso) return 'never';
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return 'never';

  const seconds = Math.max(0, Math.round((Date.now() - parsed) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 3_600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3_600)}h ago`;
  return `${Math.round(seconds / 86_400)}d ago`;
}

/** "Last synced 5m ago" / "Never synced". */
export function formatLastSynced(iso: string | null): string {
  return iso ? `Last synced ${formatAge(iso)}` : 'Never synced';
}

// =============================================================================
// Pieces
// =============================================================================

export interface ConnectorGlyphProps {
  type: ConnectorType;
  size?: 'sm' | 'md';
  className?: string;
}

/** Neutral provider square. Deliberately greyscale — no brand-coloured tiles. */
export function ConnectorGlyph({ type, size = 'md', className }: ConnectorGlyphProps) {
  const Icon = connectorMeta[type].icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex flex-shrink-0 items-center justify-center bg-gray-100 text-gray-500',
        t.radius,
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
    </span>
  );
}

/**
 * Progress bar for work whose real duration is unknown: it ramps towards — but
 * never reaches — the end, so it reads as "still going" without ever claiming a
 * completion percentage it cannot know.
 */
function ActivityBar({ label }: { label: string }) {
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((value) => value + (94 - value) * 0.12);
    }, 140);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" aria-hidden="true" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        className="h-1 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-gray-400 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/** Spinner + label, for phases with no measurable progress. */
function PendingLine({ label }: { label: string }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" aria-hidden="true" />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function NoticeLine({ tone, children }: { tone: 'warning' | 'error'; children: string }) {
  return (
    <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-600">
      <span
        aria-hidden="true"
        className={cn(
          'mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full',
          tone === 'error' ? t.statusDot.error : t.statusDot.warning,
        )}
      />
      {children}
    </p>
  );
}

// =============================================================================
// ConnectorCard
// =============================================================================

export interface ConnectorCardProps {
  connector: Connector;
  /** Opens the detail sheet. Omit to hide the Details affordance. */
  onOpenDetails?: (type: ConnectorType) => void;
  className?: string;
}

export function ConnectorCard({ connector, onOpenDetails, className }: ConnectorCardProps) {
  const { type, status } = connector;
  const meta = connectorMeta[type];

  const connectConnector = useConnectorStore((s) => s.connectConnector);
  const approveConsent = useConnectorStore((s) => s.approveConsent);
  const cancelConsent = useConnectorStore((s) => s.cancelConsent);
  const disconnectConnector = useConnectorStore((s) => s.disconnectConnector);
  const syncConnector = useConnectorStore((s) => s.syncConnector);
  const pendingConsent = useConnectorStore((s) => s.pendingConsent);
  const addToast = useUIStore((s) => s.addToast);

  const [isConfirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [isDisconnecting, setDisconnecting] = useState(false);

  const isConsenting = pendingConsent === type && status === 'oauth_consent';

  const handleConnect = () => {
    void connectConnector(type);
  };

  const handleAllow = async () => {
    await approveConsent(type);
    const next = useConnectorStore.getState().connectors[type];
    addToast(
      next.status === 'connected'
        ? {
            variant: 'success',
            title: `${meta.label} connected`,
            message: next.accountEmail ?? undefined,
          }
        : {
            variant: 'error',
            title: `Could not connect ${meta.label}`,
            message: next.errorMessage ?? undefined,
          },
    );
  };

  const handleCancelConsent = () => {
    cancelConsent();
    addToast({ variant: 'info', title: `${meta.label} connection cancelled` });
  };

  const handleSync = async () => {
    try {
      await syncConnector(type);
      addToast({ variant: 'success', title: `${meta.label} synced` });
    } catch {
      addToast({
        variant: 'error',
        title: `${meta.label} sync failed`,
        message: 'Try again in a moment.',
      });
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectConnector(type);
      addToast({ variant: 'success', title: `${meta.label} disconnected` });
      setConfirmingDisconnect(false);
    } catch {
      addToast({ variant: 'error', title: `Could not disconnect ${meta.label}` });
    } finally {
      setDisconnecting(false);
    }
  };

  const detailsButton = onOpenDetails && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onOpenDetails(type)}
      rightIcon={<ChevronRight />}
    >
      Details
    </Button>
  );

  return (
    <div className={cn('bg-white p-4', t.border, t.radius, className)}>
      <div className="flex items-start gap-3">
        <ConnectorGlyph type={type} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={cn('truncate', t.title)}>{meta.label}</h3>
              <p className={cn('truncate', t.meta)}>{meta.provider}</p>
            </div>
            <ConnectorStatusBadge status={status} size="sm" className="flex-shrink-0" />
          </div>

          {status === 'connected' || status === 'syncing' ? (
            <div className="mt-2 space-y-0.5">
              <p className={cn('truncate', t.body)}>{connector.accountEmail}</p>
              <p className={t.meta}>{formatLastSynced(connector.lastSyncedAt)}</p>
            </div>
          ) : (
            <p className={cn('mt-2 leading-relaxed', t.body)}>{meta.description}</p>
          )}
        </div>
      </div>

      {/* ── Transient + problem states ───────────────────────────────── */}

      {status === 'connecting' && <PendingLine label="Connecting…" />}

      {status === 'oauth_consent' && (
        <PendingLine label={`Waiting for ${meta.provider} consent…`} />
      )}

      {status === 'authorising' && <ActivityBar label="Authorising…" />}

      {status === 'syncing' && <ActivityBar label="Syncing…" />}

      {status === 'expired' && (
        <NoticeLine tone="warning">
          {connector.errorMessage ??
            'Session expired. Reconnect to resume syncing this account.'}
        </NoticeLine>
      )}

      {status === 'error' && (
        <NoticeLine tone="error">
          {connector.errorMessage ?? 'Something went wrong with this connector.'}
        </NoticeLine>
      )}

      {/* ── Actions ──────────────────────────────────────────────────── */}

      {status === 'disconnected' && (
        <div className="mt-4">
          <Button variant="primary" fullWidth onClick={handleConnect}>
            Connect
          </Button>
        </div>
      )}

      {status === 'connected' && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw />}
            onClick={() => void handleSync()}
          >
            Sync now
          </Button>
          {detailsButton}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-600"
            onClick={() => setConfirmingDisconnect(true)}
          >
            Disconnect
          </Button>
        </div>
      )}

      {status === 'expired' && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleConnect}>
            Reconnect
          </Button>
          {detailsButton}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw />}
            onClick={() => void handleSync()}
          >
            Retry
          </Button>
          {detailsButton}
        </div>
      )}

      {/* ── Overlays ─────────────────────────────────────────────────── */}

      <OAuthConsentModal
        open={isConsenting}
        type={type}
        accountEmail={connector.accountEmail ?? providerAccounts[type].email}
        accountName={connector.accountDisplayName ?? providerAccounts[type].displayName}
        onAllow={() => void handleAllow()}
        onCancel={handleCancelConsent}
      />

      <ConfirmDialog
        open={isConfirmingDisconnect}
        title={`Disconnect ${meta.label}?`}
        description={`Busy.me will stop syncing ${connector.accountEmail ?? 'this account'}. Nothing already imported is deleted, and you can reconnect at any time.`}
        confirmLabel="Disconnect"
        isConfirming={isDisconnecting}
        onConfirm={() => void handleDisconnect()}
        onCancel={() => setConfirmingDisconnect(false)}
      />
    </div>
  );
}

export default ConnectorCard;
