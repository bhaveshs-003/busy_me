import type {
  Connector,
  ConnectorSyncFrequency,
  ConnectorSyncRecord,
  ConnectorType,
} from '@/types/index';

export const mockConnectors: Record<ConnectorType, Connector> = {
  gmail: {
    id: 'connector-gmail',
    type: 'gmail',
    status: 'connected',
    accountEmail: 'sarah.chen@techcorp.com',
    accountDisplayName: 'Sarah Chen',
    scopes: ['gmail.readonly', 'gmail.send', 'gmail.modify'],
    connectedAt: '2026-07-01T09:00:00Z',
    lastSyncedAt: '2026-09-10T09:00:00Z',
    nextSyncAt: '2026-09-10T09:15:00Z',
    errorMessage: null,
    metadata: { totalEmails: 1842, unreadCount: 37, storageUsedBytes: 4_294_967_296 },
  },
  'google-calendar': {
    id: 'connector-google-calendar',
    type: 'google-calendar',
    status: 'connected',
    accountEmail: 'sarah.chen@techcorp.com',
    accountDisplayName: 'Sarah Chen',
    scopes: ['calendar.readonly', 'calendar.events'],
    connectedAt: '2026-07-01T09:05:00Z',
    lastSyncedAt: '2026-09-10T09:00:00Z',
    nextSyncAt: '2026-09-10T09:15:00Z',
    errorMessage: null,
    metadata: { calendarCount: 3, upcomingEvents: 12 },
  },
  outlook: {
    id: 'connector-outlook',
    type: 'outlook',
    status: 'disconnected',
    accountEmail: null,
    accountDisplayName: null,
    scopes: [],
    connectedAt: null,
    lastSyncedAt: null,
    nextSyncAt: null,
    errorMessage: null,
    metadata: {},
  },
  slack: {
    id: 'connector-slack',
    type: 'slack',
    status: 'expired',
    accountEmail: 'sarah.chen@techcorp.com',
    accountDisplayName: 'Sarah Chen',
    scopes: ['channels.read', 'chat.write', 'users.read'],
    connectedAt: '2026-06-18T11:20:00Z',
    lastSyncedAt: '2026-09-08T17:40:00Z',
    nextSyncAt: null,
    errorMessage: 'Your Slack session expired. Reconnect to resume syncing.',
    metadata: { workspace: 'TechCorp HQ', channelCount: 18 },
  },
};

// ---------------------------------------------------------------------------
// Provider identities used by the simulated OAuth flow
//
// When a connector is (re)connected the mock consent screen signs the demo user
// in as this account — no real provider is ever contacted.
// ---------------------------------------------------------------------------

export interface ProviderAccount {
  email: string;
  displayName: string;
  scopes: string[];
}

export const providerAccounts: Record<ConnectorType, ProviderAccount> = {
  gmail: {
    email: 'sarah.chen@techcorp.com',
    displayName: 'Sarah Chen',
    scopes: ['gmail.readonly', 'gmail.send', 'gmail.modify', 'gmail.labels'],
  },
  'google-calendar': {
    email: 'sarah.chen@techcorp.com',
    displayName: 'Sarah Chen',
    scopes: ['calendar.readonly', 'calendar.events'],
  },
  outlook: {
    email: 'sarah.chen@techcorp.com',
    displayName: 'Sarah Chen',
    scopes: ['Mail.Read', 'Mail.Send', 'Calendars.Read'],
  },
  slack: {
    email: 'sarah.chen@techcorp.com',
    displayName: 'Sarah Chen',
    scopes: ['channels.read', 'chat.write', 'users.read'],
  },
};

// ---------------------------------------------------------------------------
// Sync settings
// ---------------------------------------------------------------------------

export const defaultSyncFrequency: Record<ConnectorType, ConnectorSyncFrequency> = {
  gmail: '15min',
  'google-calendar': '15min',
  outlook: 'hourly',
  slack: 'realtime',
};

// ---------------------------------------------------------------------------
// Seed sync history
//
// Timestamps are generated relative to load time so the demo always shows a
// plausible "12 minutes ago" rather than a date frozen in the seed file.
// ---------------------------------------------------------------------------

const MINUTE_MS = 60_000;

interface SyncSeed {
  minutesAgo: number;
  outcome: ConnectorSyncRecord['outcome'];
  itemsSynced: number;
  durationMs: number;
  message?: string;
}

const syncSeeds: Record<ConnectorType, SyncSeed[]> = {
  gmail: [
    { minutesAgo: 12, outcome: 'success', itemsSynced: 14, durationMs: 2_180 },
    { minutesAgo: 27, outcome: 'success', itemsSynced: 6, durationMs: 1_940 },
    { minutesAgo: 42, outcome: 'partial', itemsSynced: 31, durationMs: 4_610, message: '2 messages skipped — attachment too large' },
    { minutesAgo: 57, outcome: 'success', itemsSynced: 9, durationMs: 2_020 },
    { minutesAgo: 72, outcome: 'success', itemsSynced: 22, durationMs: 2_760 },
    { minutesAgo: 87, outcome: 'failed', itemsSynced: 0, durationMs: 8_400, message: 'Provider rate limit reached (429)' },
  ],
  'google-calendar': [
    { minutesAgo: 14, outcome: 'success', itemsSynced: 3, durationMs: 1_240 },
    { minutesAgo: 29, outcome: 'success', itemsSynced: 1, durationMs: 980 },
    { minutesAgo: 44, outcome: 'success', itemsSynced: 5, durationMs: 1_510 },
    { minutesAgo: 59, outcome: 'success', itemsSynced: 0, durationMs: 870 },
    { minutesAgo: 74, outcome: 'success', itemsSynced: 2, durationMs: 1_120 },
  ],
  outlook: [],
  slack: [
    { minutesAgo: 320, outcome: 'failed', itemsSynced: 0, durationMs: 1_180, message: 'Token expired — re-authorisation required' },
    { minutesAgo: 380, outcome: 'success', itemsSynced: 8, durationMs: 1_620 },
    { minutesAgo: 440, outcome: 'success', itemsSynced: 12, durationMs: 1_870 },
    { minutesAgo: 500, outcome: 'partial', itemsSynced: 4, durationMs: 2_340, message: '1 private channel skipped — missing scope' },
    { minutesAgo: 560, outcome: 'success', itemsSynced: 15, durationMs: 1_990 },
  ],
};

export function createSeedSyncHistory(
  now: number = Date.now()
): Record<ConnectorType, ConnectorSyncRecord[]> {
  const entries = Object.entries(syncSeeds) as [ConnectorType, SyncSeed[]][];

  return Object.fromEntries(
    entries.map(([type, seeds]) => [
      type,
      seeds.map((seed, index) => ({
        id: `sync-${type}-${index}`,
        connectorType: type,
        startedAt: new Date(now - seed.minutesAgo * MINUTE_MS).toISOString(),
        durationMs: seed.durationMs,
        outcome: seed.outcome,
        itemsSynced: seed.itemsSynced,
        message: seed.message,
      })),
    ])
  ) as Record<ConnectorType, ConnectorSyncRecord[]>;
}

/**
 * Clones {@link mockConnectors} and rebases the sync timestamps of already
 * connected accounts onto the current clock, so a fresh demo session opens with
 * connectors that look recently synced instead of stale.
 */
export function createInitialConnectors(
  now: number = Date.now()
): Record<ConnectorType, Connector> {
  const entries = Object.entries(mockConnectors) as [ConnectorType, Connector][];

  return Object.fromEntries(
    entries.map(([type, connector]) => {
      const history = createSeedSyncHistory(now)[type];
      const lastSyncedAt = history[0]?.startedAt;
      if (!lastSyncedAt) return [type, { ...connector }];

      return [
        type,
        {
          ...connector,
          lastSyncedAt,
          // An expired connector has no scheduled next sync — it is waiting on
          // the user to re-authorise.
          nextSyncAt:
            connector.status === 'connected'
              ? new Date(now + 15 * MINUTE_MS).toISOString()
              : null,
        },
      ];
    })
  ) as Record<ConnectorType, Connector>;
}
