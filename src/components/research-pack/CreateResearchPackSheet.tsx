import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type {
  ResearchPack,
  ResearchPackStatus,
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

const STATUSES: ResearchPackStatus[] = ['active', 'paused', 'completed', 'archived'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

const STATUS_LABEL: Record<ResearchPackStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

const fieldLabel = 'text-sm font-medium text-gray-700';

const selectClass = cn(
  'h-11 w-full appearance-none bg-white px-3.5 text-sm text-gray-900',
  t.border,
  t.radius,
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
);

/** Trailing commas let people paste a comma-separated list in one go. */
function splitTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

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
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ResearchPackStatus>('active');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [isSaving, setSaving] = useState(false);

  // Re-seed the form every time the sheet opens so a cancelled edit never
  // leaks into the next one.
  useEffect(() => {
    if (!open) return;
    setName(pack?.title ?? '');
    setDescription(pack?.description ?? '');
    setStatus(pack?.status ?? 'active');
    setPriority(pack ? packPriority(pack) : 'medium');
    setTags(pack?.tags ?? []);
    setTagDraft('');
    setNameError(undefined);
    setSaving(false);
  }, [open, pack]);

  const addTags = () => {
    const parsed = splitTags(tagDraft);
    if (parsed.length === 0) return;
    setTags((prev) => [...prev, ...parsed.filter((tag) => !prev.includes(tag))]);
    setTagDraft('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((value) => value !== tag));
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Give the pack a name.');
      return;
    }

    // Anything still sitting in the tag field counts as entered.
    const allTags = [...tags, ...splitTags(tagDraft).filter((tag) => !tags.includes(tag))];

    setSaving(true);
    try {
      if (pack) {
        const patch = {
          title: trimmedName,
          description: description.trim() || null,
          status,
          priority,
          tags: allTags,
        };
        await updatePack(pack.id, patch);
        addToast({ variant: 'success', title: 'Pack updated', message: trimmedName });
        onSaved?.({ ...pack, ...patch });
      } else {
        const created = await createPack({
          title: trimmedName,
          description: description.trim() || null,
          status,
          priority,
          tags: allTags,
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

        {/* ── Description ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="pack-description">
            Description
          </label>
          <textarea
            id="pack-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A sentence on what this pack is for…"
            className={cn(
              'w-full resize-y bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400',
              t.border,
              t.radius,
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            )}
          />
        </div>

        {/* ── Status ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="pack-status">
            Status
          </label>
          <select
            id="pack-status"
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as ResearchPackStatus)}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </div>

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

        {/* ── Tags ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className={fieldLabel}>Tags</span>

          {tags.length > 0 && (
            <ul className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-2.5 pr-1 text-xs font-medium text-gray-600"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400',
                      t.pressable,
                      t.focusRing,
                    )}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <Input
              value={tagDraft}
              placeholder="Add a tag…"
              aria-label="Add a tag"
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTags();
                }
              }}
            />
            <Button
              variant="outline"
              iconOnly
              aria-label="Add tag"
              disabled={!tagDraft.trim()}
              onClick={addTags}
              className="h-11 w-11 shrink-0"
            >
              <Plus />
            </Button>
          </div>
          <p className={t.meta}>Separate several tags with commas.</p>
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
