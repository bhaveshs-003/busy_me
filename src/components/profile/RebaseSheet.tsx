import { useEffect, useState } from 'react';
import { Check, Mail, RotateCcw, Users } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// RebaseSheet — re-indexes a connected source from scratch
//
// Purely a simulation: each stage animates its own progress bar, then the sheet
// settles on a completion summary the presenter can talk over.
// =============================================================================

export type RebaseSource = 'gmail' | 'google';

interface StageConfig {
  id: string;
  label: string;
  /** How long this stage takes, in ms. */
  durationMs: number;
}

const STAGES: StageConfig[] = [
  { id: 'scan', label: 'Scanning emails…', durationMs: 2200 },
  { id: 'index', label: 'Indexing contacts…', durationMs: 1800 },
  { id: 'graph', label: 'Building knowledge graph…', durationMs: 2600 },
];

const SOURCE_COPY: Record<RebaseSource, { title: string; blurb: string; summary: string[] }> = {
  gmail: {
    title: 'Rebase Gmail',
    blurb:
      'Re-reads every message in sarah.chen@techcorp.com and rebuilds the index Busy uses to answer questions about your inbox. Nothing is deleted.',
    summary: ['12,480 messages scanned', '318 contacts indexed', '1,204 relationships mapped'],
  },
  google: {
    title: 'Rebase Google',
    blurb:
      'Re-reads your Google Calendar and Drive, then rebuilds the knowledge graph linking meetings, files and the people in them.',
    summary: ['1,942 events scanned', '286 files indexed', '874 relationships mapped'],
  },
};

/** Progress ticks per second while a stage is running. */
const TICK_MS = 60;

type Phase = 'idle' | 'running' | 'complete';

export interface RebaseSheetProps {
  open: boolean;
  source: RebaseSource;
  onClose: () => void;
}

export function RebaseSheet({ open, source, onClose }: RebaseSheetProps) {
  const trackEvent = useSettingsStore((s) => s.trackEvent);
  const addToast = useUIStore((s) => s.addToast);

  const [phase, setPhase] = useState<Phase>('idle');
  const [stageIndex, setStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);

  const copy = SOURCE_COPY[source];

  // Reset whenever the sheet is dismissed so a re-open starts clean.
  useEffect(() => {
    if (open) return;
    setPhase('idle');
    setStageIndex(0);
    setStageProgress(0);
  }, [open]);

  // Drive the active stage's bar off wall-clock time, then hand off to the next
  // stage. Elapsed time (rather than an accumulator) keeps the bar honest if the
  // tab is throttled in the background mid-demo.
  useEffect(() => {
    if (phase !== 'running') return;

    const stage = STAGES[stageIndex];
    const startedAt = Date.now();

    const timer = setInterval(() => {
      const percent = Math.min(100, ((Date.now() - startedAt) / stage.durationMs) * 100);
      setStageProgress(percent);

      if (percent < 100) return;
      clearInterval(timer);

      if (stageIndex < STAGES.length - 1) {
        setStageIndex(stageIndex + 1);
        setStageProgress(0);
      } else {
        setPhase('complete');
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [phase, stageIndex]);

  useEffect(() => {
    if (phase !== 'complete') return;
    addToast({
      variant: 'success',
      title: 'Rebase complete',
      message: `${copy.title.replace('Rebase ', '')} is fully re-indexed.`,
    });
  }, [phase, addToast, copy.title]);

  const handleStart = () => {
    trackEvent('settings_change', { setting: 'rebase', source });
    setStageIndex(0);
    setStageProgress(0);
    setPhase('running');
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={copy.title}>
      <div className="px-4 pb-6 pt-4">
        {/* ── Source summary ──────────────────────────────────────────────── */}
        <div className={cn('flex items-start gap-3', t.border, t.radius, 'p-3.5')}>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
          >
            {source === 'gmail' ? (
              <Mail className="h-4 w-4" />
            ) : (
              <Users className="h-4 w-4" />
            )}
          </span>
          <p className={cn(t.body, 'leading-relaxed')}>{copy.blurb}</p>
        </div>

        {/* ── Stages ──────────────────────────────────────────────────────── */}
        {phase !== 'idle' && (
          <ul className="mt-5 flex flex-col gap-4" aria-live="polite">
            {STAGES.map((stage, index) => {
              const isDone = phase === 'complete' || index < stageIndex;
              const isActive = phase === 'running' && index === stageIndex;
              const percent = isDone ? 100 : isActive ? stageProgress : 0;

              return (
                <li key={stage.id}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        isDone
                          ? 'bg-gray-900 text-white'
                          : isActive
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-100',
                      )}
                    >
                      {isDone && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                    </span>

                    <span
                      className={cn(
                        'flex-1 text-sm',
                        isDone || isActive ? 'font-medium text-gray-900' : 'text-gray-400',
                      )}
                    >
                      {isDone ? stage.label.replace('…', '') : stage.label}
                    </span>

                    <span className={cn(t.meta, 'tabular-nums')}>{Math.round(percent)}%</span>
                  </div>

                  <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-100 ease-linear',
                        isDone ? 'bg-gray-900' : 'bg-brand-500',
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* ── Completion summary ──────────────────────────────────────────── */}
        {phase === 'complete' && (
          <div className={cn('mt-5', t.border, t.radius, 'divide-y divide-gray-100')}>
            <p className="px-3.5 py-2.5 text-sm font-medium text-gray-900">Complete</p>
            {copy.summary.map((line) => (
              <p key={line} className={cn(t.body, 'px-3.5 py-2.5')}>
                {line}
              </p>
            ))}
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-col gap-2">
          {phase === 'idle' && (
            <Button fullWidth size="lg" leftIcon={<RotateCcw />} onClick={handleStart}>
              Start rebase
            </Button>
          )}

          {phase === 'running' && (
            <Button fullWidth size="lg" isLoading disabled>
              Rebasing…
            </Button>
          )}

          {phase === 'complete' && (
            <Button fullWidth size="lg" onClick={onClose}>
              Done
            </Button>
          )}

          <Button
            fullWidth
            variant="ghost"
            onClick={onClose}
            disabled={phase === 'running'}
            className={phase === 'complete' ? 'hidden' : undefined}
          >
            Cancel
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default RebaseSheet;
