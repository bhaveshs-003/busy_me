import { useEffect, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { TIMEZONE_OPTIONS } from '@/data/settings';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';
import { fieldLabel, selectClass, textareaClass } from './SettingsRow';

// =============================================================================
// Profile Information
// =============================================================================

/** How long the fake "uploading a new photo" spinner runs. */
const AVATAR_UPLOAD_MS = 1200;

/** Deterministic stand-in photos, so "change photo" visibly does something. */
const SAMPLE_AVATARS = [
  'https://i.pravatar.cc/160?img=47',
  'https://i.pravatar.cc/160?img=32',
  'https://i.pravatar.cc/160?img=5',
];

export function ProfileInformationSection() {
  const profile = useSettingsStore((s) => s.userProfile);
  const updateUserProfile = useSettingsStore((s) => s.updateUserProfile);
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const addToast = useUIStore((s) => s.addToast);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [bio, setBio] = useState(profile.bio);
  const [isUploading, setUploading] = useState(false);
  const [isSaving, setSaving] = useState(false);

  // Adopt stored values if the profile is replaced under us (e.g. demo reset).
  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setPhone(profile.phone);
    setTimezone(profile.timezone);
    setBio(profile.bio);
  }, [profile]);

  const isDirty =
    firstName !== profile.firstName ||
    lastName !== profile.lastName ||
    phone !== profile.phone ||
    timezone !== profile.timezone ||
    bio !== profile.bio;

  const nameError = firstName.trim() ? undefined : 'First name is required.';

  const handleChangePhoto = () => {
    setUploading(true);
    const currentIndex = SAMPLE_AVATARS.indexOf(profile.avatarUrl ?? '');
    const next = SAMPLE_AVATARS[(currentIndex + 1) % SAMPLE_AVATARS.length];

    setTimeout(() => {
      updateUserProfile({ avatarUrl: next });
      setUploading(false);
      addToast({ variant: 'success', title: 'Photo updated' });
    }, AVATAR_UPLOAD_MS);
  };

  const handleSave = () => {
    if (nameError) return;
    setSaving(true);
    updateUserProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      timezone,
      bio: bio.trim(),
    });
    trackEvent('settings_change', { setting: 'profile_information' });
    setSaving(false);
    addToast({ variant: 'success', title: 'Profile saved' });
  };

  const displayName = `${firstName} ${lastName}`.trim();

  return (
    <div className={t.sectionGap}>
      {/* ── Photo ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center">
        <div className="relative">
          <Avatar src={profile.avatarUrl} name={displayName} size="lg" className="h-20 w-20" />
          {isUploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" aria-hidden="true" />
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          leftIcon={<Camera />}
          isLoading={isUploading}
          onClick={handleChangePhoto}
        >
          Change photo
        </Button>
      </section>

      {/* ── Fields ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <Input
          label="First name"
          value={firstName}
          required
          onChange={(e) => setFirstName(e.target.value)}
          error={firstName.length === 0 ? nameError : undefined}
        />

        <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />

        <Input
          label="Email"
          type="email"
          value={profile.email}
          disabled
          readOnly
          helperText="Your account email cannot be changed here. Contact support to move accounts."
        />

        <Input
          label="Phone"
          type="tel"
          value={phone}
          placeholder="+1 (415) 555-0192"
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-timezone" className={fieldLabel}>
            Timezone
          </label>
          <select
            id="profile-timezone"
            className={selectClass}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONE_OPTIONS.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <p className={cn(t.meta, 'leading-relaxed')}>
            Used for due dates, meeting times and when Busy chases people on your behalf.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-bio" className={fieldLabel}>
            Bio
          </label>
          <textarea
            id="profile-bio"
            rows={4}
            value={bio}
            maxLength={280}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A line or two about what you do — Busy uses this for tone."
            className={textareaClass}
          />
          <p className={cn(t.meta, 'text-right tabular-nums')}>{bio.length}/280</p>
        </div>
      </section>

      <Button
        fullWidth
        size="lg"
        disabled={!isDirty || Boolean(nameError)}
        isLoading={isSaving}
        onClick={handleSave}
      >
        Save changes
      </Button>
    </div>
  );
}

export default ProfileInformationSection;
