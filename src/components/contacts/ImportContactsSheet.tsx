import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Smartphone, UserPlus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useContactStore } from '@/store/contactStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// ImportContactsSheet — simulated device address-book import
//
// Nothing here touches a real address book. The permission prompt, the scan and
// the counts are all scripted so the flow can be demoed end to end.
// =============================================================================

export interface ImportContactsSheetProps {
  open: boolean;
  onClose: () => void;
}

type Stage = 'idle' | 'permission' | 'importing' | 'done';

/** Scripted outcome of the simulated scan. */
const TOTAL_FOUND = 247;
const ADDED = 244;
const ALREADY_EXISTED = TOTAL_FOUND - ADDED;

/** Shown as the "first five imported" preview once the scan finishes. */
const PREVIEW_NAMES = [
  'Aaron Delgado',
  'Beatrice Okonkwo',
  'Callum Wright',
  'Dahlia Osman',
  'Eduardo Reyes',
];

/** Progress tick cadence — ~1.4s for the full scan. */
const TICK_MS = 40;
const TICK_STEP = 7;

export function ImportContactsSheet({ open, onClose }: ImportContactsSheetProps) {
  const importContacts = useContactStore((s) => s.importContacts);
  const addToast = useUIStore((s) => s.addToast);

  const [stage, setStage] = useState<Stage>('idle');
  const [scanned, setScanned] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset to a clean flow each time the sheet is opened.
  useEffect(() => {
    if (!open) return;
    clearTimer();
    setStage('idle');
    setScanned(0);
  }, [open, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const handleAllow = () => {
    setStage('importing');
    setScanned(0);

    // Keep the store in the loop so the rest of the app sees an import happen.
    void importContacts('device').catch(() => {
      /* The simulation owns the UI state; a store failure is non-fatal here. */
    });

    // Counted outside of React state so the tick stays a pure `setScanned(n)` —
    // side effects inside an updater would fire twice under StrictMode.
    let counted = 0;

    clearTimer();
    timerRef.current = setInterval(() => {
      counted = Math.min(TOTAL_FOUND, counted + TICK_STEP);
      setScanned(counted);

      if (counted >= TOTAL_FOUND) {
        clearTimer();
        setStage('done');
        addToast({
          variant: 'success',
          title: 'Contacts imported',
          message: `${ADDED} added from this device`,
        });
      }
    }, TICK_MS);
  };

  const percent = Math.round((scanned / TOTAL_FOUND) * 100);

  return (
    <BottomSheet open={open} onClose={onClose} title="Import contacts">
      <div className="flex flex-col gap-5 px-5 pb-6 pt-4">
        {/* ── Step 1: offer the import ──────────────────────────────────── */}
        {stage === 'idle' && (
          <>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={t.title}>Import from device</p>
                <p className={cn('mt-1 leading-relaxed', t.body)}>
                  Busy.me will read the contacts stored on this phone and add the
                  ones you don't already have. Nothing is uploaded anywhere else.
                </p>
              </div>
            </div>

            <Button fullWidth onClick={() => setStage('permission')}>
              Import from device
            </Button>
          </>
        )}

        {/* ── Step 2: simulated permission prompt ───────────────────────── */}
        {stage === 'permission' && (
          <>
            <div className={cn('px-4 py-5 text-center', t.border, t.radius)}>
              <p className="text-[15px] font-semibold text-gray-900">
                Allow Busy.me to access your contacts?
              </p>
              <p className={cn('mt-1.5 leading-relaxed', t.body)}>
                Used to match people to your email and calendar. You can revoke
                access at any time in Settings.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Don't allow
              </Button>
              <Button className="flex-1" onClick={handleAllow}>
                Allow
              </Button>
            </div>
          </>
        )}

        {/* ── Step 3: scan progress ─────────────────────────────────────── */}
        {stage === 'importing' && (
          <div className="py-2">
            <div className="flex items-baseline justify-between">
              <p className={t.title}>Reading contacts…</p>
              <p className="text-sm font-semibold tabular-nums text-gray-900">
                {scanned}
                <span className="text-gray-400"> / {TOTAL_FOUND}</span>
              </p>
            </div>

            <div
              role="progressbar"
              aria-label="Import progress"
              aria-valuemin={0}
              aria-valuemax={TOTAL_FOUND}
              aria-valuenow={scanned}
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
            >
              <div
                className="h-full rounded-full bg-gray-900 transition-[width] duration-100 ease-linear"
                style={{ width: `${percent}%` }}
              />
            </div>

            <p className={cn('mt-3', t.meta)}>
              Keep this sheet open until the scan finishes.
            </p>
          </div>
        )}

        {/* ── Step 4: result + preview ──────────────────────────────────── */}
        {stage === 'done' && (
          <>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={t.title}>Import complete</p>
                <p className={cn('mt-1', t.body)}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', t.statusDot.success)}
                      aria-hidden="true"
                    />
                    {ADDED} added
                  </span>
                  <span className="text-gray-300"> · </span>
                  {ALREADY_EXISTED} already existed
                </p>
              </div>
            </div>

            <div>
              <p className={cn('mb-2', t.label)}>First {PREVIEW_NAMES.length} imported</p>
              <ul className={cn('overflow-hidden', t.border, t.radius)}>
                {PREVIEW_NAMES.map((name) => (
                  <li
                    key={name}
                    className={cn('flex items-center gap-3 px-3 py-2.5', t.divider)}
                  >
                    <Avatar name={name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                      {name}
                    </span>
                    <UserPlus className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </div>

            <Button fullWidth onClick={onClose}>
              Done
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

export default ImportContactsSheet;
