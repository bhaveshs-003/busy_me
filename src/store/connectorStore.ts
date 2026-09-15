import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Connector,
  ConnectorStatus,
  ConnectorSyncFrequency,
  ConnectorSyncRecord,
  ConnectorType,
} from '@/types/index';
import { mockApi } from '@/services/mockApi';
import {
  createInitialConnectors,
  createSeedSyncHistory,
  defaultSyncFrequency,
  providerAccounts,
} from '@/data/connectors';
import { getDemoDelay, shouldSimulateError } from '@/lib/demoConfig';
import { sleep } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConnectorsMap = Record<ConnectorType, Connector>;
type SyncHistoryMap = Record<ConnectorType, ConnectorSyncRecord[]>;
type SyncFrequencyMap = Record<ConnectorType, ConnectorSyncFrequency>;

interface ConnectorStore {
  // State
  connectors: ConnectorsMap;
  syncHistory: SyncHistoryMap;
  syncFrequency: SyncFrequencyMap;
  isLoading: boolean;
  isConnecting: boolean;
  currentConnecting: ConnectorType | null;
  /** Connector whose provider consent screen is currently on screen. */
  pendingConsent: ConnectorType | null;
  error: string | null;

  // Actions
  fetchConnectors: () => Promise<void>;
  /** Step 1 of the OAuth flow: hand off to the provider, then await consent. */
  connectConnector: (type: ConnectorType) => Promise<void>;
  /** Step 2: the user pressed Allow — exchange the code, then run a first sync. */
  approveConsent: (type: ConnectorType) => Promise<void>;
  /** The user pressed Cancel on the consent screen. */
  cancelConsent: () => void;
  disconnectConnector: (type: ConnectorType) => Promise<void>;
  reconnectConnector: (type: ConnectorType) => Promise<void>;
  syncConnector: (type: ConnectorType) => Promise<void>;
  syncAllConnectors: () => Promise<void>;
  setSyncFrequency: (type: ConnectorType, frequency: ConnectorSyncFrequency) => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Timings — tuned so the simulated flow feels like a real provider hand-off
// without making the demo tedious.
// ---------------------------------------------------------------------------

/** Preparing the hand-off, before the consent screen appears. */
const HANDOFF_MS = 900;
/** Exchanging the authorisation code for tokens, after consent. */
const AUTHORISE_MS = 1_500;
/** Extra dwell time on "Syncing…" so the progress bar is readable. */
const FIRST_SYNC_MS = 900;

/** Longest sync history retained per connector. */
const MAX_SYNC_RECORDS = 20;

const SYNC_INTERVAL_MINUTES: Record<ConnectorSyncFrequency, number | null> = {
  realtime: 1,
  '15min': 15,
  hourly: 60,
  daily: 1_440,
  manual: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextSyncFrom(frequency: ConnectorSyncFrequency, from: number): string | null {
  const minutes = SYNC_INTERVAL_MINUTES[frequency];
  return minutes === null ? null : new Date(from + minutes * 60_000).toISOString();
}

function makeSyncRecord(
  type: ConnectorType,
  outcome: ConnectorSyncRecord['outcome'],
  itemsSynced: number,
  durationMs: number,
  message?: string,
): ConnectorSyncRecord {
  return {
    id: `sync-${type}-${Date.now()}`,
    connectorType: type,
    startedAt: new Date(Date.now() - durationMs).toISOString(),
    durationMs,
    outcome,
    itemsSynced,
    message,
  };
}

/**
 * Transient statuses describe an operation that only exists in memory, so they
 * can never survive a reload — settle them back onto a resting status.
 */
function settleStatus(connector: Connector): ConnectorStatus {
  switch (connector.status) {
    case 'connecting':
    case 'oauth_consent':
    case 'authorising':
      return connector.accountEmail ? 'connected' : 'disconnected';
    case 'syncing':
      return 'connected';
    default:
      return connector.status;
  }
}

function errorMessageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useConnectorStore = create<ConnectorStore>()(
  persist(
    (set, get) => {
      /** Merge a partial connector patch without clobbering the rest of the map. */
      const patch = (type: ConnectorType, changes: Partial<Connector>) =>
        set((s) => ({
          connectors: { ...s.connectors, [type]: { ...s.connectors[type], ...changes } },
        }));

      const pushRecord = (type: ConnectorType, record: ConnectorSyncRecord) =>
        set((s) => ({
          syncHistory: {
            ...s.syncHistory,
            [type]: [record, ...(s.syncHistory[type] ?? [])].slice(0, MAX_SYNC_RECORDS),
          },
        }));

      /**
       * Shared sync body: records the outcome and settles the connector back to
       * `connected` (or `error`). Callers own the move into `syncing`.
       */
      const runSync = async (type: ConnectorType, extraDwellMs = 0) => {
        const startedAt = Date.now();
        try {
          const [result] = await Promise.all([
            mockApi.connectors.sync(type),
            sleep(extraDwellMs),
          ]);
          const finishedAt = Date.now();
          pushRecord(
            type,
            makeSyncRecord(type, 'success', result.itemsSynced, finishedAt - startedAt),
          );
          patch(type, {
            status: 'connected',
            lastSyncedAt: new Date(finishedAt).toISOString(),
            nextSyncAt: nextSyncFrom(get().syncFrequency[type], finishedAt),
            errorMessage: null,
          });
        } catch (err) {
          const message = errorMessageOf(err);
          pushRecord(type, makeSyncRecord(type, 'failed', 0, Date.now() - startedAt, message));
          patch(type, { status: 'error', errorMessage: message });
          throw err;
        }
      };

      return {
        // ── Initial state ────────────────────────────────────────────────
        connectors: createInitialConnectors(),
        syncHistory: createSeedSyncHistory(),
        syncFrequency: { ...defaultSyncFrequency },
        isLoading: false,
        isConnecting: false,
        currentConnecting: null,
        pendingConsent: null,
        error: null,

        // ── Loading ──────────────────────────────────────────────────────

        fetchConnectors: async () => {
          set({ isLoading: true, error: null });
          try {
            await sleep(getDemoDelay());
            if (shouldSimulateError()) {
              throw new Error('Could not reach the connector service.');
            }
            set({ isLoading: false });
          } catch (err) {
            set({ isLoading: false, error: errorMessageOf(err) });
          }
        },

        // ── OAuth flow ───────────────────────────────────────────────────

        connectConnector: async (type) => {
          // Never start a second hand-off on top of an in-flight one.
          if (get().isConnecting) return;

          set({ isConnecting: true, currentConnecting: type, error: null });
          patch(type, { status: 'connecting', errorMessage: null });

          await sleep(HANDOFF_MS);

          // The user may have disconnected/cancelled while we were waiting.
          if (get().currentConnecting !== type) return;

          patch(type, { status: 'oauth_consent' });
          set({ pendingConsent: type });
        },

        approveConsent: async (type) => {
          set({ pendingConsent: null });
          patch(type, { status: 'authorising' });

          try {
            // Simulated token exchange. Nothing leaves the browser.
            await Promise.all([mockApi.connectors.connect(type), sleep(AUTHORISE_MS)]);

            const account = providerAccounts[type];
            const connectedAt = new Date().toISOString();
            patch(type, {
              status: 'connected',
              accountEmail: account.email,
              accountDisplayName: account.displayName,
              scopes: account.scopes,
              connectedAt,
              errorMessage: null,
            });
            set({ isConnecting: false, currentConnecting: null });

            // First sync runs straight after authorisation.
            patch(type, { status: 'syncing' });
            await runSync(type, FIRST_SYNC_MS);
          } catch (err) {
            const message = errorMessageOf(err);
            patch(type, { status: 'error', errorMessage: message });
            set({ isConnecting: false, currentConnecting: null, error: message });
          }
        },

        cancelConsent: () => {
          const type = get().pendingConsent;
          set({ pendingConsent: null, isConnecting: false, currentConnecting: null });
          if (!type) return;

          const connector = get().connectors[type];
          patch(type, {
            // A previously connected account that expired stays expired; a
            // brand new connection falls back to disconnected.
            status: connector.accountEmail ? 'expired' : 'disconnected',
            errorMessage: connector.accountEmail
              ? 'Re-authorisation was cancelled. Reconnect to resume syncing.'
              : null,
          });
        },

        // ── Lifecycle ────────────────────────────────────────────────────

        disconnectConnector: async (type) => {
          const previous = get().connectors[type];
          patch(type, {
            status: 'disconnected',
            accountEmail: null,
            accountDisplayName: null,
            connectedAt: null,
            lastSyncedAt: null,
            nextSyncAt: null,
            errorMessage: null,
            scopes: [],
          });

          try {
            await mockApi.connectors.disconnect(type);
            set((s) => ({ syncHistory: { ...s.syncHistory, [type]: [] } }));
          } catch {
            // Restore on failure so the UI never lies about the account state.
            patch(type, previous);
            throw new Error('Failed to disconnect connector');
          }
        },

        reconnectConnector: async (type) => {
          await get().connectConnector(type);
        },

        syncConnector: async (type) => {
          const connector = get().connectors[type];
          if (connector.status !== 'connected' && connector.status !== 'error') return;

          patch(type, { status: 'syncing' });
          await runSync(type);
        },

        syncAllConnectors: async () => {
          const { connectors, syncConnector } = get();
          const syncable = (Object.keys(connectors) as ConnectorType[]).filter(
            (type) => connectors[type].status === 'connected',
          );
          // Settled, not all — one failing connector must not abort the rest.
          await Promise.allSettled(syncable.map((type) => syncConnector(type)));
        },

        setSyncFrequency: (type, frequency) => {
          set((s) => ({ syncFrequency: { ...s.syncFrequency, [type]: frequency } }));
          const connector = get().connectors[type];
          if (connector.status !== 'connected') return;
          patch(type, { nextSyncAt: nextSyncFrom(frequency, Date.now()) });
        },

        clearError: () => set({ error: null }),
      };
    },
    {
      name: 'busyme_connectors',
      // v2 introduced sync history + frequency and the consent-gated flow.
      version: 2,
      partialize: (s) => ({
        connectors: s.connectors,
        syncHistory: s.syncHistory,
        syncFrequency: s.syncFrequency,
      }),
      migrate: () =>
        ({
          connectors: createInitialConnectors(),
          syncHistory: createSeedSyncHistory(),
          syncFrequency: { ...defaultSyncFrequency },
        }) as unknown as ConnectorStore,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const entries = Object.entries(state.connectors) as [ConnectorType, Connector][];
        state.connectors = Object.fromEntries(
          entries.map(([type, connector]) => [
            type,
            { ...connector, status: settleStatus(connector) },
          ]),
        ) as ConnectorsMap;
      },
    },
  ),
);
