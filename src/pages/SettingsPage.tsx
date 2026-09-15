import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProfileInformationSection } from '@/components/profile/ProfileInformationSection';
import { SubscriptionSection } from '@/components/profile/SubscriptionSection';
import { AIPreferencesSection } from '@/components/profile/AIPreferencesSection';
import { NotificationsSection } from '@/components/profile/NotificationsSection';
import { DiagnosticsSection } from '@/components/profile/DiagnosticsSection';
import { useSettingsStore } from '@/store/settingsStore';

// =============================================================================
// SettingsPage — host for every settings sub-screen
//
// The section is chosen with `?section=` so each row on Profile is a plain link
// and the browser back button walks the stack the way it does on a real phone.
// =============================================================================

const SECTIONS = {
  profile: { title: 'Profile Information', subtitle: 'Name, contact details and bio' },
  subscription: { title: 'Subscription', subtitle: 'Plan, billing and invoices' },
  ai: { title: 'AI Preferences', subtitle: 'Name, personality and instructions' },
  notifications: { title: 'Notifications', subtitle: 'What Busy interrupts you for' },
  diagnostics: { title: 'Diagnostics', subtitle: 'Analytics recorded on this device' },
} as const;

export type SettingsSection = keyof typeof SECTIONS;

function isSection(value: string | null): value is SettingsSection {
  return value !== null && value in SECTIONS;
}

/** Route for a given settings sub-screen — used by ProfilePage's rows. */
export function settingsPath(section: SettingsSection): string {
  return `/settings?section=${section}`;
}

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackEvent = useSettingsStore((s) => s.trackEvent);

  const requested = searchParams.get('section');
  const section = isSection(requested) ? requested : null;

  useEffect(() => {
    if (!section) return;
    trackEvent('screen_view', { screen: `settings/${section}` });
  }, [section, trackEvent]);

  if (!section) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Settings" showBack />
        <div className="flex-1 overflow-y-auto">
          <EmptyState
            icon={<SlidersHorizontal />}
            title="Pick a setting"
            description={
              requested
                ? `"${requested}" isn't a settings screen. Head back to Profile and choose one from the list.`
                : 'Settings screens open from your profile. Head back and choose the one you need.'
            }
            action={{ label: 'Back to profile', onClick: () => navigate('/profile') }}
          />
        </div>
      </div>
    );
  }

  const { title, subtitle } = SECTIONS[section];

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader title={title} subtitle={subtitle} showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
        {section === 'profile' && <ProfileInformationSection />}
        {section === 'subscription' && <SubscriptionSection />}
        {section === 'ai' && <AIPreferencesSection />}
        {section === 'notifications' && <NotificationsSection />}
        {section === 'diagnostics' && <DiagnosticsSection />}
      </div>
    </div>
  );
}
