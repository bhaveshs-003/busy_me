import { BellRing, CalendarClock, Hourglass, Repeat } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NotificationPreferences } from '@/types/index';
import { useSettingsStore } from '@/store/settingsStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';
import { SettingsGroup, SettingsToggleRow } from './SettingsRow';

// =============================================================================
// Notifications
// =============================================================================

/** The four switches surfaced on Profile and here. */
export const NOTIFICATION_TOGGLES: {
  key: keyof Pick<
    NotificationPreferences,
    'taskDue' | 'waitingOnChases' | 'eventStarting' | 'followUps'
  >;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    key: 'taskDue',
    label: 'Reminders',
    description: 'A nudge when a task is due or slips overdue',
    icon: <BellRing />,
  },
  {
    key: 'waitingOnChases',
    label: 'Waiting-on chases',
    description: 'When someone you are blocked on has gone quiet',
    icon: <Hourglass />,
  },
  {
    key: 'eventStarting',
    label: 'Event alerts',
    description: 'Fifteen minutes before a meeting starts',
    icon: <CalendarClock />,
  },
  {
    key: 'followUps',
    label: 'Follow-ups',
    description: 'Threads worth returning to before they go cold',
    icon: <Repeat />,
  },
];

export function NotificationsSection() {
  const notifications = useSettingsStore((s) => s.appSettings.notifications);
  const updateNotifications = useSettingsStore((s) => s.updateNotifications);
  const trackEvent = useSettingsStore((s) => s.trackEvent);

  const enabledCount = NOTIFICATION_TOGGLES.filter(({ key }) => notifications[key]).length;

  return (
    <div className={t.sectionGap}>
      <SettingsGroup
        title="What Busy tells you"
        description={`${enabledCount} of ${NOTIFICATION_TOGGLES.length} notification types are on. Changes save immediately.`}
      >
        {NOTIFICATION_TOGGLES.map(({ key, label, description, icon }) => (
          <SettingsToggleRow
            key={key}
            icon={icon}
            label={label}
            description={description}
            checked={notifications[key]}
            onChange={(next) => {
              // Computed keys widen to `string`, so the shape is re-asserted.
              updateNotifications({ [key]: next } as Partial<NotificationPreferences>);
              trackEvent('settings_change', { setting: key, value: next });
            }}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup
        title="Quiet hours"
        description="Nothing is delivered during quiet hours — anything that fires is held until the window ends."
      >
        <SettingsToggleRow
          label="Enable quiet hours"
          description={`${notifications.quietHoursStart} – ${notifications.quietHoursEnd}`}
          checked={notifications.quietHoursEnabled}
          onChange={(next) => {
            updateNotifications({ quietHoursEnabled: next });
            trackEvent('settings_change', { setting: 'quiet_hours', value: next });
          }}
        />
      </SettingsGroup>

      <p className={cn(t.meta, 'px-1 leading-relaxed')}>
        System-level permission is granted, so turning a type on here is enough for it to appear on
        your lock screen.
      </p>
    </div>
  );
}

export default NotificationsSection;
