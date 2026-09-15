import { useEffect, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// ChangePinSheet
// =============================================================================

/** Digits in the unlock PIN. */
const PIN_LENGTH = 4;

const onlyDigits = (value: string) => value.replace(/\D/g, '').slice(0, PIN_LENGTH);

export interface ChangePinSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePinSheet({ open, onClose }: ChangePinSheetProps) {
  const currentPin = useSettingsStore((s) => s.security.pin);
  const updateSecurity = useSettingsStore((s) => s.updateSecurity);
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const addToast = useUIStore((s) => s.addToast);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) return;
    setCurrent('');
    setNext('');
    setConfirm('');
    setSubmitted(false);
  }, [open]);

  const currentError =
    submitted && current !== currentPin ? 'That is not your current PIN.' : undefined;
  const nextError =
    submitted && next.length < PIN_LENGTH ? `Choose ${PIN_LENGTH} digits.` : undefined;
  const confirmError = submitted && confirm !== next ? 'The two PINs do not match.' : undefined;

  const handleSubmit = () => {
    setSubmitted(true);
    if (current !== currentPin || next.length < PIN_LENGTH || confirm !== next) return;

    updateSecurity({ pin: next });
    trackEvent('settings_change', { setting: 'pin' });
    addToast({ variant: 'success', title: 'PIN updated' });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Change PIN">
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
        <p className={cn(t.body, 'leading-relaxed')}>
          Your PIN unlocks Busy when biometrics are unavailable. It is {PIN_LENGTH} digits.
        </p>

        <Input
          label="Current PIN"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={current}
          error={currentError}
          onChange={(e) => setCurrent(onlyDigits(e.target.value))}
        />

        <Input
          label="New PIN"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={next}
          error={nextError}
          onChange={(e) => setNext(onlyDigits(e.target.value))}
        />

        <Input
          label="Confirm new PIN"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={confirm}
          error={confirmError}
          onChange={(e) => setConfirm(onlyDigits(e.target.value))}
        />

        <p className={t.meta}>Demo tip: the current PIN is {currentPin}.</p>

        <div className="mt-2 flex flex-col gap-2">
          <Button fullWidth size="lg" onClick={handleSubmit}>
            Update PIN
          </Button>
          <Button fullWidth variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default ChangePinSheet;
