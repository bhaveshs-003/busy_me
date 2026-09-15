import type {
  DemoConfig,
  AppSettings,
  PermissionsState,
  AppLifecycleState,
} from '@/types/index';
import type {
  AIPreferences,
  SecurityState,
  SubscriptionState,
  UserProfileDraft,
} from '@/store/settingsStore';
import { mockCurrentUser } from '@/data/mockUsers';

export const defaultDemoConfig: DemoConfig = {
  isDemoMode: true,
  demoUserId: 'user-001',
  seedDataVersion: '1.0.0',
  featuresEnabled: ['ai-assist', 'web-search', 'research-packs', 'workboard', 'connectors'],
  featureFlagsOverrides: {
    enableBiometricLock: true,
    enableAppleSignIn: true,
    enableGoogleSignIn: true,
  },
  simulateLatency: true,
  mockLatencyMs: 400,
  simulateErrors: false,
  errorRatePercent: 10,
  offlineMode: false,
};

export const defaultAppSettings: AppSettings = {
  userId: 'user-001',
  theme: 'system',
  accentColor: '#6366f1',
  language: 'en-US',
  timezone: 'America/Los_Angeles',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  weekStartsOn: 1,
  defaultEmailCategory: 'primary',
  aiAssistEnabled: true,
  aiAutoSummarize: true,
  aiAutoTagging: true,
  biometricLockEnabled: false,
  lockAfterSeconds: 300,
  compactMode: false,
  notifications: {
    emailReceived: true,
    taskDue: true,
    eventStarting: true,
    eventStartingMinutesBefore: 15,
    connectorIssues: true,
    aiInsights: true,
    waitingOnChases: true,
    followUps: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  },
  updatedAt: '2026-09-10T00:00:00Z',
};

export const defaultPermissions: PermissionsState = {
  notifications: {
    type: 'notifications',
    status: 'allowed',
    requestedAt: '2026-07-01T09:00:00Z',
    grantedAt: '2026-07-01T09:00:05Z',
    deniedAt: null,
    canOpenSettings: true,
  },
  microphone: {
    type: 'microphone',
    status: 'not-requested',
    requestedAt: null,
    grantedAt: null,
    deniedAt: null,
    canOpenSettings: true,
  },
  camera: {
    type: 'camera',
    status: 'not-requested',
    requestedAt: null,
    grantedAt: null,
    deniedAt: null,
    canOpenSettings: true,
  },
  photos: {
    type: 'photos',
    status: 'not-requested',
    requestedAt: null,
    grantedAt: null,
    deniedAt: null,
    canOpenSettings: true,
  },
  contacts: {
    type: 'contacts',
    status: 'allowed',
    requestedAt: '2026-07-01T09:01:00Z',
    grantedAt: '2026-07-01T09:01:05Z',
    deniedAt: null,
    canOpenSettings: true,
  },
  files: {
    type: 'files',
    status: 'allowed',
    requestedAt: '2026-07-01T09:02:00Z',
    grantedAt: '2026-07-01T09:02:10Z',
    deniedAt: null,
    canOpenSettings: true,
  },
};

export const defaultAppLifecycle: AppLifecycleState = 'normal';

// ─── Profile / account defaults ───────────────────────────────────────────────

export const defaultUserProfile: UserProfileDraft = {
  firstName: mockCurrentUser.firstName,
  lastName: mockCurrentUser.lastName,
  email: mockCurrentUser.email,
  phone: mockCurrentUser.phoneNumber ?? '',
  timezone: mockCurrentUser.timezone,
  bio: 'Head of Partnerships at TechCorp. Runs the Meridian and Acme accounts, and lives out of her inbox between Series B conversations.',
  avatarUrl: null,
};

export const defaultSubscription: SubscriptionState = {
  planId: 'pro',
  billingCycle: 'annual',
  renewsAt: mockCurrentUser.planExpiresAt ?? '2027-03-15T00:00:00Z',
  isCancelled: false,
};

export const defaultSecurity: SecurityState = {
  twoFactorEnabled: false,
  pin: '1234',
  lastSignOutAllAt: null,
};

export const defaultAIPreferences: AIPreferences = {
  assistantName: 'Busy',
  personality: 'professional',
  communicationEmail: mockCurrentUser.email,
  instructions:
    'Keep replies to three sentences unless I ask for detail. Always surface the Meridian and Acme threads first, and flag anything a contact is waiting on me for.',
};

/** Timezones offered on the Profile Information screen. */
export const TIMEZONE_OPTIONS = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
] as const;
