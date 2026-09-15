import { useState } from 'react';
import { History, KeyRound } from 'lucide-react';
import type {
  ConnectorSyncFrequency,
  ConnectorSyncOutcome,
  ConnectorSyncRecord,
  ConnectorType,
} from '@/types/index';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ConnectorStatusBadge } from '@/components/ui/StatusBadge';
import { ConnectorGlyph, connectorMeta, formatAge } from './ConnectorCard';
import { useConnectorStore } from '@/store/connectorStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// ConnectorDetailSheet — account, sync history and settings for one connector
// =============================================================================

/** Sync records shown in the sheet. */
const HISTORY_LIMIT = 5;

const FREQUENCY_OPTIONS: { id: ConnectorSyncFrequency; label: string; hint: string }[] = [
  { id: 'realtime', label: 'Real time', hint: 'Sync as changes arrive' },
  { id: '15min', label: 'Every 15 min', hint: 'A good balance for most inboxes' },
  { id: 'hourly', label: 'Hourly', hint: 'Lighter on battery and data' },
  { id: 'daily', label: 'Daily', hint: 'One catch-up sync each morning' },
  { id: 'manual', label: 'Manual only', hint: 'Sync only when you ask' },
];

const OUTCOME_COPY: Record<ConnectorSyncOutcome, { label: string; dot: string }> = {
  success: { label: 'Synced', dot: 'success' },
  partial: { label: 'Partial', dot: 'warning' },
  failed: { label: 'Failed', dot: 'error' },
};

function formatDuration(ms: number): string {
  return ms < 1_000 ? `${ms}ms` : `${(ms / 1_000).toFixed(1)}s`;
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('border-t px-4 py-4', t.hairline)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className={t.label}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export interface ConnectorDetailSheetProps {
  /** Connector to show. `null` closes the sheet. */
  type: ConnectorType | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Stable empty array for the "no history yet" case.
 *
 * Returning a fresh `[]` from the selector gives `useSyncExternalStore` a new
 * snapshot on every render, which React treats as a perpetual store change and
 * turns into an infinite render loop.
 */
const NO_HISTORY: ConnectorSyncRecord[] = [];

export function ConnectorDetailSheet({ type, open, onClose }: ConnectorDetailSheetProps) {
  const connector = useConnectorStore((s) => (type ? s.connectors[type] : null));
  const history = useConnectorStore((s) => (type ? (s.syncHistory[type] ?? NO_HISTORY) : NO_HISTORY));
  const frequency = useConnectorStore((s) => (type ? s.syncFrequency[type] : '15min'));
  const setSyncFrequency = useConnectorStore((s) => s.setSyncFrequency);
  const connectConnector = useConnectorStore((s) => s.connectConnector);
  const disconnectConnector = useConnectorStore((s) => s.disconnectConnector);
  const addToast = useUIStore((s) => s.addToast);

  const [isConfirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [isDisconnecting, setDisconnecting] = useState(false);

  if (!type || !connector) return null;

  const meta = connectorMeta[type];
  const recent = history.slice(0, HISTORY_LIMIT);
  const isBusy = ['connecting', 'oauth_consent', 'authorising', 'syncing'].includes(
    connector.status,
  );

  const handleReauthorise = () => {
    // Close first: the consent screen belongs to the card behind this sheet.
    onClose();
    void connectConnector(type);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectConnector(type);
      addToast({ variant: 'success', title: `${meta.label} disconnected` });
      setConfirmingDisconnect(false);
      onClose();
    } catch {
      addToast({ variant: 'error', title: `Could not disconnect ${meta.label}` });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={meta.label}>
        {/* Account */}
        <div className="flex items-center gap-3 px-4 py-4">
          <ConnectorGlyph type={type} />
          <div className="min-w-0 flex-1">
            {connector.accountEmail ? (
              <>
                <p className={cn('truncate', t.title)}>{connector.accountDisplayName}</p>
                <p className={cn('truncate', t.body)}>{connector.accountEmail}</p>
              </>
            ) : (
              <>
                <p className={t.title}>Not connected</p>
                <p className={t.body}>Connect {meta.label} to start syncing.</p>
              </>
            )}
          </div>
          <ConnectorStatusBadge status={connector.status} size="sm" className="flex-shrink-0" />
        </div>

        {connector.accountEmail && (
          <div className="flex items-center gap-3 px-4 pb-4">
            <Avatar name={connector.accountDisplayName ?? connector.accountEmail} size="xs" />
            <p className={t.meta}>
              Connected {connector.connectedAt ? formatDate(connector.connectedAt) : '—'} ·{' '}
              {connector.scopes.length} scope{connector.scopes.length === 1 ? '' : 's'} granted
            </p>
          </div>
        )}

        {/* Sync history */}
        <Section
          title="Sync history"
          action={
            <span className={t.meta}>
              {connector.nextSyncAt
                ? `Next sync ${formatDate(connector.nextSyncAt, { hour: 'numeric', minute: '2-digit' })}`
                : 'No sync scheduled'}
            </span>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              compact
              icon={<History />}
              title="No syncs yet"
              description={`${meta.label} has not run a sync on this account.`}
            />
          ) : (
            <ul className={cn('bg-white', t.border, t.radius)}>
              {recent.map((record) => {
                const outcome = OUTCOME_COPY[record.outcome];
                return (
                  <li key={record.id} className={cn('px-3 py-2.5', t.divider)}>
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-1.5 w-1.5 flex-shrink-0 rounded-full',
                          t.statusDot[outcome.dot],
                        )}
                      />
                      <span className="flex-1 truncate text-sm text-gray-900">
                        {outcome.label} · {record.itemsSynced} item
                        {record.itemsSynced === 1 ? '' : 's'}
                      </span>
                      <span className={cn('flex-shrink-0', t.meta)}>
                        {formatAge(record.startedAt)}
                      </span>
                    </div>
                    <p className={cn('mt-0.5 pl-4 leading-relaxed', t.meta)}>
                      {record.message ?? `Completed in ${formatDuration(record.durationMs)}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Sync frequency */}
        <Section title="Sync frequency">
          <div className={cn('overflow-hidden bg-white', t.border, t.radius)}>
            {FREQUENCY_OPTIONS.map((option) => {
              const isActive = option.id === frequency;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setSyncFrequency(type, option.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 text-left',
                    t.divider,
                    t.touchTarget,
                    t.pressable,
                    t.focusRing,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-4 w-4 flex-shrink-0 rounded-full',
                      isActive ? 'border-[5px] border-gray-900 bg-white' : 'bg-gray-100',
                    )}
                  />
                  <span className="min-w-0 flex-1 py-2.5">
                    <span className="block text-sm font-medium text-gray-900">
                      {option.label}
                    </span>
                    <span className={cn('block', t.meta)}>{option.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Actions */}
        <Section title="Account">
          <div className="space-y-2 pb-2">
            <Button
              variant="outline"
              fullWidth
              leftIcon={<KeyRound />}
              disabled={isBusy}
              onClick={handleReauthorise}
            >
              Re-authorise
            </Button>
            <Button
              variant="ghost"
              fullWidth
              className="text-red-600"
              disabled={isBusy || connector.status === 'disconnected'}
              onClick={() => setConfirmingDisconnect(true)}
            >
              Disconnect
            </Button>
          </div>
        </Section>
      </BottomSheet>

      <ConfirmDialog
        open={isConfirmingDisconnect}
        title={`Disconnect ${meta.label}?`}
        description={`Busy.me will stop syncing ${connector.accountEmail ?? 'this account'} and its sync history will be cleared. You can reconnect at any time.`}
        confirmLabel="Disconnect"
        isConfirming={isDisconnecting}
        onConfirm={() => void handleDisconnect()}
        onCancel={() => setConfirmingDisconnect(false)}
      />
    </>
  );
}

export default ConnectorDetailSheet;
