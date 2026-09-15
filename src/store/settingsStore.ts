import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DemoConfig,
  AppSettings,
  PermissionsState,
  PermissionType,
  PermissionEntry,
  AppLifecycleState,
  AnalyticsEvent,
  AnalyticsEventName,
} from '@/types/index';
import {
  defaultDemoConfig,
  defaultAppSettings,
  defaultPermissions,
  defaultAppLifecycle,
  defaultUserProfile,
  defaultSubscription,
  defaultSecurity,
  defaultAIPreferences,
} from '@/data/settings';
import { DEMO_CONFIG } from '@/lib/demoConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Editable copy of the signed-in user, owned by the Profile Information screen. */
export interface UserProfileDraft {
  firstName: string;
  lastName: string;
  /** Read-only in the UI — the account identity. */
  email: string;
  phone: string;
  timezone: string;
  bio: string;
  avatarUrl: string | null;
}

export type PlanId = 'free' | 'pro' | 'business';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionState {
  planId: PlanId;
  billingCycle: BillingCycle;
  /** ISO 8601 — next renewal, or the date access ends once cancelled. */
  renewsAt: string;
  isCancelled: boolean;
}

export interface SecurityState {
  twoFactorEnabled: boolean;
  /** 4-digit unlock PIN. Demo-only — never a real credential. */
  pin: string;
  /** ISO 8601 of the last "sign out all devices", or null. */
  lastSignOutAllAt: string | null;
}

export type AIPersonality = 'professional' | 'friendly' | 'concise';

export interface AIPreferences {
  assistantName: string;
  personality: AIPersonality;
  /** Address the assistant sends on the user's behalf from. */
  communicationEmail: string;
  instructions: string;
}

interface SettingsStore {
  // State
  demoConfig: DemoConfig;
  appSettings: AppSettings;
  permissions: PermissionsState;
  appLifecycle: AppLifecycleState;
  analyticsEvents: AnalyticsEvent[];
  userProfile: UserProfileDraft;
  subscription: SubscriptionState;
  security: SecurityState;
  aiPreferences: AIPreferences;
  /** Regenerated on every page load — never persisted. */
  sessionId: string;
  sessionStartedAt: string;
  error: string | null;

  // Actions
  updateDemoConfig: (patch: Partial<DemoConfig>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateNotifications: (patch: Partial<AppSettings['notifications']>) => void;
  updatePermission: (type: PermissionType, patch: Partial<PermissionEntry>) => void;
  setAppLifecycle: (lifecycle: AppLifecycleState) => void;
  updateUserProfile: (patch: Partial<UserProfileDraft>) => void;
  updateSubscription: (patch: Partial<SubscriptionState>) => void;
  updateSecurity: (patch: Partial<SecurityState>) => void;
  updateAIPreferences: (patch: Partial<AIPreferences>) => void;
  trackEvent: (name: AnalyticsEventName, properties?: Record<string, string | number | boolean | null>) => void;
  resetAllData: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newSessionId(): string {
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Pushes the demo config onto the mutable runtime object the mock API reads.
 * Keeping the two in sync means the Demo Control Panel's latency / error /
 * offline switches take effect on the very next request.
 */
function applyDemoRuntime(config: DemoConfig): void {
  DEMO_CONFIG.simulateLatency = config.simulateLatency;
  DEMO_CONFIG.latencyMs = config.mockLatencyMs;
  DEMO_CONFIG.simulateErrors = config.simulateErrors;
  DEMO_CONFIG.errorRate = config.errorRatePercent / 100;
  DEMO_CONFIG.offlineMode = config.offlineMode;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      demoConfig: defaultDemoConfig,
      appSettings: defaultAppSettings,
      permissions: defaultPermissions,
      appLifecycle: defaultAppLifecycle,
      analyticsEvents: [],
      userProfile: defaultUserProfile,
      subscription: defaultSubscription,
      security: defaultSecurity,
      aiPreferences: defaultAIPreferences,
      sessionId: newSessionId(),
      sessionStartedAt: new Date().toISOString(),
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      updateDemoConfig: (patch) => {
        const next = { ...get().demoConfig, ...patch };
        applyDemoRuntime(next);
        set({ demoConfig: next });
      },

      updateSettings: (patch) => {
        set((s) => ({
          appSettings: { ...s.appSettings, ...patch, updatedAt: new Date().toISOString() },
        }));
      },

      updateNotifications: (patch) => {
        set((s) => ({
          appSettings: {
            ...s.appSettings,
            notifications: { ...s.appSettings.notifications, ...patch },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      updatePermission: (type, patch) => {
        set((s) => ({
          permissions: {
            ...s.permissions,
            [type]: { ...s.permissions[type], ...patch },
          },
        }));
      },

      setAppLifecycle: (lifecycle) => {
        set({ appLifecycle: lifecycle });
      },

      updateUserProfile: (patch) => {
        set((s) => ({ userProfile: { ...s.userProfile, ...patch } }));
      },

      updateSubscription: (patch) => {
        set((s) => ({ subscription: { ...s.subscription, ...patch } }));
      },

      updateSecurity: (patch) => {
        set((s) => ({ security: { ...s.security, ...patch } }));
      },

      updateAIPreferences: (patch) => {
        set((s) => ({ aiPreferences: { ...s.aiPreferences, ...patch } }));
      },

      trackEvent: (name, properties = {}) => {
        const event: AnalyticsEvent = {
          eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          userId: 'user-001',
          sessionId: get().sessionId,
          deviceId: 'web-demo',
          platform: 'web',
          appVersion: '1.0.0',
          occurredAt: new Date().toISOString(),
          properties,
          isAnonymous: false,
        };
        set((s) => ({
          // Keep only last 500 events in memory.
          analyticsEvents: [event, ...s.analyticsEvents].slice(0, 500),
        }));
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[analytics]', name, properties);
        }
      },

      resetAllData: () => {
        applyDemoRuntime(defaultDemoConfig);
        set({
          demoConfig: defaultDemoConfig,
          appSettings: defaultAppSettings,
          permissions: defaultPermissions,
          appLifecycle: defaultAppLifecycle,
          analyticsEvents: [],
          userProfile: defaultUserProfile,
          subscription: defaultSubscription,
          security: defaultSecurity,
          aiPreferences: defaultAIPreferences,
        });
        // Clear all busyme_ keys from localStorage.
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage).filter((k) => k.startsWith('busyme_'));
          keys.forEach((k) => localStorage.removeItem(k));
        }
      },
    }),
    {
      name: 'busyme_settings',
      // Older persisted payloads predate the profile/subscription slices, so
      // every slice is merged over its default rather than replacing it.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsStore>;
        return {
          ...current,
          ...saved,
          demoConfig: { ...current.demoConfig, ...saved.demoConfig },
          appSettings: {
            ...current.appSettings,
            ...saved.appSettings,
            notifications: {
              ...current.appSettings.notifications,
              ...saved.appSettings?.notifications,
            },
          },
          permissions: { ...current.permissions, ...saved.permissions },
          userProfile: { ...current.userProfile, ...saved.userProfile },
          subscription: { ...current.subscription, ...saved.subscription },
          security: { ...current.security, ...saved.security },
          aiPreferences: { ...current.aiPreferences, ...saved.aiPreferences },
          // Session identity always belongs to the live page load.
          sessionId: current.sessionId,
          sessionStartedAt: current.sessionStartedAt,
        };
      },
      partialize: (s) => ({
        demoConfig: s.demoConfig,
        appSettings: s.appSettings,
        permissions: s.permissions,
        appLifecycle: s.appLifecycle,
        userProfile: s.userProfile,
        subscription: s.subscription,
        security: s.security,
        aiPreferences: s.aiPreferences,
      }),
    }
  )
);

// Adopt whatever was rehydrated from storage before the first request goes out.
applyDemoRuntime(useSettingsStore.getState().demoConfig);
