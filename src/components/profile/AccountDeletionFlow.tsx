import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  Layers,
  ListTodo,
  Loader2,
  Mail,
  MessageSquare,
  Users,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTaskStore } from '@/store/taskStore';
import { useEmailStore } from '@/store/emailStore';
import { useContactStore } from '@/store/contactStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useEventStore } from '@/store/eventStore';
import { clearStorage } from '@/lib/persistence';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// AccountDeletionFlow
//
// Four steps, each gated harder than the last:
//   1. What gets deleted   2. Type DELETE   3. 10s cooling-off   4. Deleting…
// =============================================================================

/** Exact word the user must type at step 2. */
const CONFIRM_WORD = 'DELETE';

/** Seconds the final warning stays locked before the button arms. */
const COUNTDOWN_SECONDS = 10;

/** How long the fake deletion takes before logout. */
const DELETE_DURATION_MS = 2400;

type Step = 1 | 2 | 3 | 4;

export interface AccountDeletionFlowProps {
  open: boolean;
  onClose: () => void;
}

export function AccountDeletionFlow({ open, onClose }: AccountDeletionFlowProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const email = useSettingsStore((s) => s.userProfile.email);
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const resetAllData = useSettingsStore((s) => s.resetAllData);

  const tasks = useTaskStore((s) => s.tasks);
  const emails = useEmailStore((s) => s.emails);
  const events = useEventStore((s) => s.events);
  const contacts = useContactStore((s) => s.contacts);
  const packs = useResearchPackStore((s) => s.packs);

  const [step, setStep] = useState<Step>(1);
  const [typed, setTyped] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  // Reset the whole flow whenever the sheet closes.
  useEffect(() => {
    if (open) return;
    setStep(1);
    setTyped('');
    setSecondsLeft(COUNTDOWN_SECONDS);
  }, [open]);

  // Step 3 — cooling-off countdown.
  useEffect(() => {
    if (step !== 3 || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, secondsLeft]);

  // Step 4 — run the deletion, then drop the user back at /welcome.
  useEffect(() => {
    if (step !== 4) return;

    const timer = setTimeout(() => {
      resetAllData();
      clearStorage();
      logout();
      navigate('/welcome', { replace: true });
    }, DELETE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [step, resetAllData, logout, navigate]);

  const deletionItems = [
    { icon: <Mail />, label: 'Emails indexed by Busy', count: emails.length },
    { icon: <ListTodo />, label: 'Tasks and checklists', count: tasks.length },
    { icon: <CalendarDays />, label: 'Calendar events', count: events.length },
    { icon: <Users />, label: 'Contacts and relationships', count: contacts.length },
    { icon: <Layers />, label: 'Research packs', count: packs.length },
    { icon: <MessageSquare />, label: 'Chat history with Busy', count: null },
  ];

  const isWordCorrect = typed.trim().toUpperCase() === CONFIRM_WORD;
  const isArmed = secondsLeft <= 0;

  return (
    <BottomSheet
      open={open}
      onClose={step === 4 ? () => undefined : onClose}
      title={step === 4 ? 'Deleting account' : 'Delete account'}
    >
      <div className="px-4 pb-6 pt-4">
        {/* Step indicator — hidden once deletion is irreversible. */}
        {step < 4 && (
          <div className="mb-4 flex items-center gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn(
                  'h-1 flex-1 rounded-full',
                  n <= step ? 'bg-gray-900' : 'bg-gray-100',
                )}
              />
            ))}
          </div>
        )}

        {/* ── Step 1 — what will be deleted ───────────────────────────────── */}
        {step === 1 && (
          <>
            <h3 className={cn(t.title, 'mb-1')}>This deletes everything</h3>
            <p className={cn(t.body, 'mb-4 leading-relaxed')}>
              Deleting {email} removes your account and every piece of data Busy has built from it.
              This cannot be undone and support cannot restore it.
            </p>

            <ul className={cn(t.border, t.radius, 'overflow-hidden')}>
              {deletionItems.map((item) => (
                <li
                  key={item.label}
                  className={cn('flex items-center gap-3 px-3.5 py-2.5', t.divider)}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 [&>svg]:h-4 [&>svg]:w-4"
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                    {item.label}
                  </span>
                  {item.count !== null && (
                    <span className={cn(t.meta, 'tabular-nums')}>{item.count}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-2">
              <Button fullWidth size="lg" variant="destructive" onClick={() => setStep(2)}>
                Continue
              </Button>
              <Button fullWidth variant="ghost" onClick={onClose}>
                Keep my account
              </Button>
            </div>
          </>
        )}

        {/* ── Step 2 — type DELETE ────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <h3 className={cn(t.title, 'mb-1')}>Type {CONFIRM_WORD} to confirm</h3>
            <p className={cn(t.body, 'mb-4 leading-relaxed')}>
              To be sure this is deliberate, type <span className="font-semibold text-gray-900">{CONFIRM_WORD}</span> in
              the field below.
            </p>

            <Input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRM_WORD}
              aria-label={`Type ${CONFIRM_WORD} to confirm`}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              error={typed.length > 0 && !isWordCorrect ? `Type ${CONFIRM_WORD} exactly.` : undefined}
            />

            <div className="mt-6 flex flex-col gap-2">
              <Button
                fullWidth
                size="lg"
                variant="destructive"
                disabled={!isWordCorrect}
                onClick={() => {
                  setSecondsLeft(COUNTDOWN_SECONDS);
                  setStep(3);
                }}
              >
                Continue
              </Button>
              <Button fullWidth variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </>
        )}

        {/* ── Step 3 — final warning + countdown ──────────────────────────── */}
        {step === 3 && (
          <>
            <div
              aria-hidden="true"
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500"
            >
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className={cn(t.title, 'mb-1 text-center')}>Last chance</h3>
            <p className={cn(t.body, 'mb-5 text-center leading-relaxed')}>
              The moment you confirm, {email} and all of its data are gone permanently. There is no
              recovery window and no export afterwards.
            </p>

            <div className={cn(t.border, t.radius, 'px-3.5 py-3 text-center')}>
              <p className={cn(t.meta, 'uppercase tracking-wide')} aria-live="polite">
                {isArmed ? 'You can now confirm' : 'Confirm unlocks in'}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                {isArmed ? '0s' : `${secondsLeft}s`}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                fullWidth
                size="lg"
                variant="destructive"
                disabled={!isArmed}
                onClick={() => {
                  trackEvent('settings_change', { setting: 'account_delete' });
                  setStep(4);
                }}
              >
                {isArmed ? 'Delete my account' : `Delete my account (${secondsLeft}s)`}
              </Button>
              <Button fullWidth variant="ghost" onClick={onClose}>
                Cancel — keep my account
              </Button>
            </div>
          </>
        )}

        {/* ── Step 4 — deleting ───────────────────────────────────────────── */}
        {step === 4 && (
          <div className="flex flex-col items-center py-10 text-center" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-hidden="true" />
            <p className={cn(t.title, 'mt-4')}>Deleting…</p>
            <p className={cn(t.body, 'mt-1 max-w-xs leading-relaxed')}>
              Removing your data and signing you out. Do not close the app.
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

export default AccountDeletionFlow;
