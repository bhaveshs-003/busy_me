import { useMemo, useRef, useState } from 'react';
import { Fingerprint, LogOut, Monitor, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import * as t from '@/lib/theme';
import { SettingsGroup, SettingsToggleRow } from './SettingsRow';

// =============================================================================
// Security
// =============================================================================

/** Length of the TOTP code the authenticator app produces. */
const CODE_LENGTH = 6;

/** The demo's "correct" code — any other 6 digits is rejected. */
const VALID_CODE = '123456';

/** Base32 secret shown under the QR, as a real authenticator setup would. */
const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

type TwoFactorStep = 'off' | 'scan' | 'verify' | 'on';

// ── Fake QR ──────────────────────────────────────────────────────────────────

/** Grid dimension of the decorative QR stand-in. */
const QR_SIZE = 21;

/**
 * Deterministic on/off grid derived from the secret. It is decorative — it does
 * not encode a scannable payload — so it is hidden from assistive tech.
 */
function useQrMatrix(seed: string): boolean[] {
  return useMemo(() => {
    const cells: boolean[] = [];
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
    }
    for (let i = 0; i < QR_SIZE * QR_SIZE; i += 1) {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      cells.push((hash >> 8) % 3 !== 0);
    }
    return cells;
  }, [seed]);
}

function isFinderCell(index: number): boolean {
  const row = Math.floor(index / QR_SIZE);
  const col = index % QR_SIZE;
  const inCorner = (r: number, c: number) => r < 7 && c < 7;
  return (
    inCorner(row, col) ||
    inCorner(row, QR_SIZE - 1 - col) ||
    inCorner(QR_SIZE - 1 - row, col)
  );
}

function FakeQrCode({ secret }: { secret: string }) {
  const matrix = useQrMatrix(secret);

  return (
    <div
      aria-hidden="true"
      className={cn(t.border, t.radius, 'mx-auto grid w-44 gap-px bg-white p-3')}
      style={{ gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))` }}
    >
      {matrix.map((filled, index) => {
        const finder = isFinderCell(index);
        const row = Math.floor(index / QR_SIZE);
        const col = index % QR_SIZE;
        // Draw crisp finder patterns in the three corners so it reads as a QR.
        const ring = finder && (row % 6 === 0 || col % 6 === 0 || (row % 6 === 3 && col % 6 === 3));
        const on = finder ? ring : filled;
        return (
          <span
            key={index}
            className={cn('aspect-square', on ? 'bg-gray-900' : 'bg-transparent')}
          />
        );
      })}
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

export function SecuritySection() {
  const security = useSettingsStore((s) => s.security);
  const updateSecurity = useSettingsStore((s) => s.updateSecurity);
  const biometricEnabled = useSettingsStore((s) => s.appSettings.biometricLockEnabled);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const sessionStartedAt = useSettingsStore((s) => s.sessionStartedAt);
  const addToast = useUIStore((s) => s.addToast);

  const [step, setStep] = useState<TwoFactorStep>(security.twoFactorEnabled ? 'on' : 'off');
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifying, setVerifying] = useState(false);
  const [isConfirmingSignOutAll, setConfirmingSignOutAll] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');

  const resetCode = () => {
    setDigits(Array(CODE_LENGTH).fill(''));
    setCodeError(null);
  };

  const handleDigitChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, '');
    if (!value) {
      setDigits((current) => current.map((d, i) => (i === index ? '' : d)));
      return;
    }

    setDigits((current) => {
      const next = [...current];
      // Pasting a whole code into one box should fill the rest.
      for (let i = 0; i < value.length && index + i < CODE_LENGTH; i += 1) {
        next[index + i] = value[i];
      }
      return next;
    });
    setCodeError(null);

    const focusAt = Math.min(index + value.length, CODE_LENGTH - 1);
    inputsRef.current[focusAt]?.focus();
  };

  const handleDigitKeyDown = (index: number, key: string) => {
    if (key !== 'Backspace' || digits[index] || index === 0) return;
    inputsRef.current[index - 1]?.focus();
  };

  const handleVerify = () => {
    if (code.length < CODE_LENGTH) return;
    setVerifying(true);

    // A beat of latency so the demo reads as a real verification round-trip.
    setTimeout(() => {
      setVerifying(false);
      if (code !== VALID_CODE) {
        setCodeError('That code is not right. Try the current one from your app.');
        return;
      }
      updateSecurity({ twoFactorEnabled: true });
      trackEvent('settings_change', { setting: 'two_factor', value: true });
      resetCode();
      setStep('on');
      addToast({ variant: 'success', title: 'Two-factor authentication on' });
    }, 700);
  };

  const handleDisable2fa = () => {
    updateSecurity({ twoFactorEnabled: false });
    trackEvent('settings_change', { setting: 'two_factor', value: false });
    resetCode();
    setStep('off');
    addToast({ variant: 'info', title: 'Two-factor authentication off' });
  };

  const handleSignOutAll = () => {
    updateSecurity({ lastSignOutAllAt: new Date().toISOString() });
    setConfirmingSignOutAll(false);
    addToast({
      variant: 'success',
      title: 'Signed out everywhere else',
      message: 'This device stays signed in.',
    });
  };

  return (
    <div className={t.sectionGap}>
      {/* ── Two-factor ──────────────────────────────────────────────────── */}
      <section>
        <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>
          Two-factor authentication
        </h2>

        <div className={cn(t.border, t.radius, 'p-4')}>
          {step === 'off' && (
            <>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                >
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <p className={cn(t.body, 'leading-relaxed')}>
                  Add a second step at sign-in using an authenticator app such as 1Password, Authy
                  or Google Authenticator.
                </p>
              </div>
              <Button fullWidth className="mt-4" onClick={() => setStep('scan')}>
                Enable two-factor
              </Button>
            </>
          )}

          {step === 'scan' && (
            <>
              <p className={cn(t.title, 'mb-1')}>Scan this code</p>
              <p className={cn(t.body, 'mb-4 leading-relaxed')}>
                Open your authenticator app and scan the code, or enter the setup key by hand.
              </p>

              <FakeQrCode secret={TOTP_SECRET} />

              <div className={cn(t.border, t.radius, 'mt-4 px-3.5 py-2.5')}>
                <p className={cn(t.label, 'uppercase tracking-wide')}>Setup key</p>
                <p className="mt-1 font-mono text-sm tracking-widest text-gray-900">
                  {TOTP_SECRET}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button fullWidth onClick={() => setStep('verify')}>
                  Next
                </Button>
                <Button fullWidth variant="ghost" onClick={() => setStep('off')}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              <p className={cn(t.title, 'mb-1')}>Enter the 6-digit code</p>
              <p className={cn(t.body, 'mb-4 leading-relaxed')}>
                Type the code your authenticator app is showing right now.
              </p>

              <div className="flex justify-between gap-1.5">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el;
                    }}
                    value={digit}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    aria-label={`Digit ${index + 1}`}
                    aria-invalid={Boolean(codeError) || undefined}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e.key)}
                    className={cn(
                      'h-12 w-full min-w-0 rounded-lg border bg-white text-center text-lg font-semibold',
                      'text-gray-900 transition-colors duration-150',
                      'focus:outline-none focus:ring-2',
                      codeError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-400/40'
                        : 'border-gray-100 focus:border-brand-500 focus:ring-brand-500/40',
                    )}
                  />
                ))}
              </div>

              {codeError && (
                <p role="alert" className="mt-2 text-xs leading-relaxed text-red-600">
                  {codeError}
                </p>
              )}

              <p className={cn(t.meta, 'mt-2')}>Demo tip: the accepted code is {VALID_CODE}.</p>

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  fullWidth
                  disabled={code.length < CODE_LENGTH}
                  isLoading={isVerifying}
                  onClick={handleVerify}
                >
                  Verify and turn on
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => {
                    resetCode();
                    setStep('scan');
                  }}
                >
                  Back
                </Button>
              </div>
            </>
          )}

          {step === 'on' && (
            <>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                >
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <span
                      aria-hidden="true"
                      className={cn('h-1.5 w-1.5 rounded-full', t.statusDot.success)}
                    />
                    On
                  </p>
                  <p className={cn(t.meta, 'mt-0.5 leading-relaxed')}>
                    You will be asked for a code from your authenticator app at every new sign-in.
                  </p>
                </div>
              </div>

              <Button fullWidth variant="outline" className="mt-4" onClick={handleDisable2fa}>
                Turn off two-factor
              </Button>
            </>
          )}
        </div>
      </section>

      {/* ── Device unlock ───────────────────────────────────────────────── */}
      <SettingsGroup
        title="Device unlock"
        description="Locks Busy after five minutes in the background. Your PIN is the fallback if biometrics fail."
      >
        <SettingsToggleRow
          icon={<Fingerprint />}
          label="Biometric unlock"
          description="Face ID or fingerprint to reopen the app"
          checked={biometricEnabled}
          onChange={(next) => {
            updateSettings({ biometricLockEnabled: next });
            trackEvent('settings_change', { setting: 'biometric_lock', value: next });
          }}
        />
      </SettingsGroup>

      {/* ── Devices ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className={cn(t.label, 'mb-2 px-1 uppercase tracking-wide')}>Devices</h2>

        <div className={cn(t.border, t.radius, 'overflow-hidden')}>
          <div className={cn('flex items-center gap-3 px-3.5 py-3', t.divider)}>
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
            >
              <Monitor className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-900">
                Current device
              </span>
              <span className={cn(t.meta, 'mt-0.5 flex items-center gap-1.5')}>
                <span
                  aria-hidden="true"
                  className={cn('h-1.5 w-1.5 rounded-full', t.statusDot.success)}
                />
                Active now · session started {formatRelativeTime(sessionStartedAt)}
              </span>
            </span>
          </div>
        </div>

        {security.lastSignOutAllAt && (
          <p className={cn(t.meta, 'mt-2 px-1')}>
            Other devices last signed out {formatRelativeTime(security.lastSignOutAllAt)}.
          </p>
        )}

        <Button
          fullWidth
          variant="outline"
          leftIcon={<LogOut />}
          className="mt-3"
          onClick={() => setConfirmingSignOutAll(true)}
        >
          Sign out all devices
        </Button>
      </section>

      <ConfirmDialog
        open={isConfirmingSignOutAll}
        title="Sign out all devices?"
        description="Every other phone, tablet and browser will be signed out immediately. This device stays signed in."
        confirmLabel="Sign out others"
        variant="warning"
        onConfirm={handleSignOutAll}
        onCancel={() => setConfirmingSignOutAll(false)}
      />
    </div>
  );
}

export default SecuritySection;
