import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  Bell,
  BellRing,
  CalendarClock,
  CreditCard,
  Hourglass,
  Link2,
  LogOut,
  MessageSquareReply,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  SettingsGroup,
  SettingsRow,
  SettingsToggleRow,
} from '@/components/profile/SettingsRow';
import { RebaseSheet } from '@/components/profile/RebaseSheet';
import { AccountDeletionFlow } from '@/components/profile/AccountDeletionFlow';
import { settingsPath } from '@/pages/SettingsPage';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// ProfilePage — the fourth bottom-nav tab and the entry point to every setting
//
// Rows that open a full screen navigate to `/settings?section=…`; rows that are
// a self-contained flow (rebase, PIN, deletion) open a sheet in place.
// =============================================================================

type RebaseSource = 'gmail' | 'google';

export default function ProfilePage() {
  const navigate = useNavigate();

  const userProfile = useSettingsStore((s) => s.userProfile);
  const subscription = useSettingsStore((s) => s.subscription);
  const notifications = useSettingsStore((s) => s.appSettings.notifications);
  const updateNotifications = useSettingsStore((s) => s.updateNotifications);
  const resetAllData = useSettingsStore((s) => s.resetAllData);
  const trackEvent = useSettingsStore((s) => s.trackEvent);

  const logout = useAuthStore((s) => s.logout);
  const addToast = useUIStore((s) => s.addToast);

  const [rebaseSource, setRebaseSource] = useState<RebaseSource | null>(null);
  const [isDeleting, setDeleting] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'profile' });
  }, [trackEvent]);

  const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
  const planLabel =
    subscription.planId === 'pro'
      ? 'Pro'
      : subscription.planId === 'business'
        ? 'Business'
        : 'Free';

  function handleSignOut() {
    setConfirmSignOut(false);
    trackEvent('settings_change', { action: 'sign_out', from: 'profile' });
    logout();
    navigate('/welcome', { replace: true });
  }

  function handleReset() {
    setConfirmReset(false);
    resetAllData();
    addToast({
      variant: 'success',
      title: 'Demo data reset',
      message: 'Every store has been restored to its seeded state.',
    });
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader title="Profile" />

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
        {/* ── Identity ─────────────────────────────────────────────────── */}
        <div className={cn(t.border, t.radius, t.surface, 'mb-6 flex items-center gap-3.5 p-4')}>
          <Avatar name={fullName} src={userProfile.avatarUrl ?? undefined} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-gray-900">{fullName}</p>
            <p className={cn(t.meta, 'truncate')}>{userProfile.email}</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            {planLabel}
          </span>
        </div>

        <div className="space-y-6">
          {/* ── Account ───────────────────────────────────────────────── */}
          <SettingsGroup title="Account">
            <SettingsRow
              icon={<UserIcon />}
              label="Profile Information"
              description="Name, contact details and bio"
              to={settingsPath('profile')}
            />
            <SettingsRow
              icon={<CreditCard />}
              label="Subscription"
              value={planLabel}
              description={
                subscription.isCancelled
                  ? 'Cancelled — access ends at the renewal date'
                  : 'Plan, billing and invoices'
              }
              to={settingsPath('subscription')}
            />
          </SettingsGroup>

          {/* ── Connections ───────────────────────────────────────────── */}
          <SettingsGroup
            title="Connections"
            description="Rebase re-indexes a connected account so the assistant can reason over it."
          >
            <SettingsRow
              icon={<Link2 />}
              label="Integrations"
              description="Gmail, Calendar, Outlook and Slack"
              to="/integrations"
            />
            <SettingsRow
              icon={<RefreshCw />}
              label="Rebase Gmail"
              onClick={() => setRebaseSource('gmail')}
            />
            <SettingsRow
              icon={<RefreshCw />}
              label="Rebase Google"
              onClick={() => setRebaseSource('google')}
            />
          </SettingsGroup>

          {/* ── AI ────────────────────────────────────────────────────── */}
          <SettingsGroup title="AI">
            <SettingsRow
              icon={<Sparkles />}
              label="AI Preferences"
              description="Name, personality and instructions"
              to={settingsPath('ai')}
            />
            <SettingsRow
              icon={<AtSign />}
              label="Communication Email"
              description="Address the assistant sends on your behalf from"
              to={settingsPath('ai')}
            />
          </SettingsGroup>

          {/* ── Notifications ─────────────────────────────────────────── */}
          <SettingsGroup title="Notifications">
            <SettingsToggleRow
              icon={<BellRing />}
              label="Reminders"
              description="Tasks approaching their due date"
              checked={notifications.taskDue}
              onChange={(taskDue) => updateNotifications({ taskDue })}
            />
            <SettingsToggleRow
              icon={<Hourglass />}
              label="Waiting-on Chases"
              description="Nudges about people you are waiting on"
              checked={notifications.waitingOnChases}
              onChange={(waitingOnChases) => updateNotifications({ waitingOnChases })}
            />
            <SettingsToggleRow
              icon={<CalendarClock />}
              label="Event Alerts"
              description={`${notifications.eventStartingMinutesBefore} minutes before an event`}
              checked={notifications.eventStarting}
              onChange={(eventStarting) => updateNotifications({ eventStarting })}
            />
            <SettingsToggleRow
              icon={<MessageSquareReply />}
              label="Follow-ups"
              description="Threads that have gone quiet"
              checked={notifications.followUps}
              onChange={(followUps) => updateNotifications({ followUps })}
            />
            <SettingsRow
              icon={<Bell />}
              label="All notification settings"
              to={settingsPath('notifications')}
            />
          </SettingsGroup>

          {/* ── App ───────────────────────────────────────────────────── */}
          <SettingsGroup
            title="App"
            description="The Demo Control Panel drives latency, errors, offline mode and app lifecycle for presentations."
          >
            <SettingsRow label="App Version" value="1.0.0" hideChevron />
            <SettingsRow
              icon={<SlidersHorizontal />}
              label="Diagnostics"
              description="Analytics recorded on this device"
              to={settingsPath('diagnostics')}
            />
            <SettingsRow
              icon={<SlidersHorizontal />}
              label="Demo Control Panel"
              to="/settings/demo"
            />
            <SettingsRow
              icon={<RotateCcw />}
              label="Reset Demo Data"
              description="Restore every store to its seeded state"
              onClick={() => setConfirmReset(true)}
            />
          </SettingsGroup>

          {/* ── Danger zone ───────────────────────────────────────────── */}
          <SettingsGroup title="Danger Zone">
            <SettingsRow
              icon={<LogOut />}
              label="Sign Out"
              destructive
              onClick={() => setConfirmSignOut(true)}
            />
            <SettingsRow
              icon={<Trash2 />}
              label="Delete Account"
              description="Permanently removes this account and all of its data"
              destructive
              onClick={() => setDeleting(true)}
            />
          </SettingsGroup>
        </div>
      </div>

      {/* ── Flows ───────────────────────────────────────────────────────── */}
      <RebaseSheet
        open={rebaseSource !== null}
        source={rebaseSource ?? 'gmail'}
        onClose={() => setRebaseSource(null)}
      />

      <AccountDeletionFlow open={isDeleting} onClose={() => setDeleting(false)} />

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        description="You'll need to sign in again to get back to your workspace."
        confirmLabel="Sign out"
        variant="warning"
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        description="Every email, task, event, note, contact and research pack returns to its seeded state. Anything you created in this session is discarded."
        confirmLabel="Reset data"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
