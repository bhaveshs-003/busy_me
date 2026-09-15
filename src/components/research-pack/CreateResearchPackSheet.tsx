import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type {
  ResearchPack,
  TaskPriority,
} from '@/types/index';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';
import { packPriority, packPriorityLabel } from './packLinks';

// =============================================================================
// CreateResearchPackSheet — create, or edit when `pack` is supplied
// =============================================================================

export interface CreateResearchPackSheetProps {
  open: boolean;
  onClose: () => void;
  /** Present → the sheet edits this pack instead of creating a new one. */
  pack?: ResearchPack | null;
  /** Called with the saved pack after a successful write. */
  onSaved?: (pack: ResearchPack) => void;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

const fieldLabel = 'text-sm font-medium text-gray-700';

const selectClass = cn(
  'h-11 w-full appearance-none bg-white px-3.5 text-sm text-gray-900',
  t.border,
  t.radius,
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
);

export function CreateResearchPackSheet({
  open,
  onClose,
  pack = null,
  onSaved,
}: CreateResearchPackSheetProps) {
  const createPack = useResearchPackStore((s) => s.createPack);
  const updatePack = useResearchPackStore((s) => s.updatePack);
  const addToast = useUIStore((s) => s.addToast);

  const isEditing = Boolean(pack);

  const [name, setName] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [nameError, setNameError] = useState<string | undefined>();
  const [isSaving, setSaving] = useState(false);

  // Re-seed the form every time the sheet opens so a cancelled edit never
  // leaks into the next one.
  useEffect(() => {
    if (!open) return;
    setName(pack?.title ?? '');
    setPriority(pack ? packPriority(pack) : 'medium');
    setNameError(undefined);
    setSaving(false);
  }, [open, pack]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Give the pack a name.');
      return;
    }

    // Anything still sitting in the tag field counts as entered.

    setSaving(true);
    try {
      if (pack) {
        const patch = {
          title: trimmedName,
          priority,
        };
        await updatePack(pack.id, patch);
        addToast({ variant: 'success', title: 'Pack updated', message: trimmedName });
        onSaved?.({ ...pack, ...patch });
      } else {
        const created = await createPack({
          title: trimmedName,
          priority,
        });
        addToast({ variant: 'success', title: 'Pack created', message: created.title });
        onSaved?.(created);
      }
      onClose();
    } catch {
      addToast({
        variant: 'error',
        title: isEditing ? "Couldn't save changes" : "Couldn't create pack",
        message: 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit research pack' : 'New research pack'}
    >
      <div className="flex flex-col gap-5 px-5 pb-6 pt-4">
        {/* ── Name ──────────────────────────────────────────────────────── */}
        <Input
          label="Name"
          required
          autoFocus
          value={name}
          error={nameError}
          placeholder="What are you tracking?"
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(undefined);
          }}
        />


        {/* ── Priority ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>Priority</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((value) => {
              const isActive = priority === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setPriority(value)}
                  className={cn(
                    'h-11 border text-sm',
                    t.radius,
                    t.pressable,
                    t.focusRing,
                    isActive
                      ? 'border-gray-400 bg-gray-100 font-semibold text-gray-900'
                      : 'border-gray-100 bg-white font-medium text-gray-500',
                  )}
                >
                  {packPriorityLabel[value]}
                </button>
              );
            })}
          </div>
        </div>


        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} isLoading={isSaving}>
            {isEditing ? 'Save changes' : 'Create pack'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default CreateResearchPackSheet;
