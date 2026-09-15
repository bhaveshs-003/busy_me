import { useEffect, useMemo, useState } from 'react';
import { Hourglass, Plus, Star, X } from 'lucide-react';
import type { Task, TaskChecklistItem, TaskPriority } from '@/types/index';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTaskStore } from '@/store/taskStore';
import { useContactStore } from '@/store/contactStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useUIStore } from '@/store/uiStore';
import { cn, generateId } from '@/lib/utils';
import { taskPriorityLabel } from './TaskCard';

// =============================================================================
// CreateTaskSheet
// =============================================================================

export interface CreateTaskSheetProps {
  open: boolean;
  onClose: () => void;
  /** Called with the persisted task after a successful create. */
  onCreated?: (task: Task) => void;
  /** Pre-fills the due date (YYYY-MM-DD) — used when creating from a date view. */
  defaultDueDate?: string;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

/** Fallback clock time for a task given a date but no explicit time. */
const DEFAULT_DUE_TIME = '17:00';

interface DraftChecklistItem {
  id: string;
  text: string;
}

const fieldLabel = 'text-sm font-medium text-gray-700';
const selectClass = cn(
  'h-11 w-full rounded-lg border border-gray-100 bg-white px-3.5 text-sm text-gray-900',
  'transition-colors duration-150 ease-out hover:border-gray-400',
  'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
);

/** Combines a `YYYY-MM-DD` date and an `HH:MM` time into an ISO timestamp. */
function toIsoDueDate(date: string, time: string): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T${time || DEFAULT_DUE_TIME}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function CreateTaskSheet({
  open,
  onClose,
  onCreated,
  defaultDueDate,
}: CreateTaskSheetProps) {
  const createTask = useTaskStore((s) => s.createTask);
  const contacts = useContactStore((s) => s.contacts);
  const packs = useResearchPackStore((s) => s.packs);
  const addToast = useUIStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate ?? '');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [packId, setPackId] = useState('');
  const [waitingOnContactId, setWaitingOnContactId] = useState('');
  const [chaseDate, setChaseDate] = useState('');
  const [checklist, setChecklist] = useState<DraftChecklistItem[]>([]);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [titleError, setTitleError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Reset to a clean draft each time the sheet is opened.
  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDueDate(defaultDueDate ?? '');
    setDueTime('');
    setPriority('medium');
    setDescription('');
    setIsImportant(false);
    setPackId('');
    setWaitingOnContactId('');
    setChaseDate('');
    setChecklist([]);
    setChecklistDraft('');
    setTitleError(undefined);
    setIsSaving(false);
  }, [open, defaultDueDate]);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [contacts],
  );

  const addChecklistItem = () => {
    const text = checklistDraft.trim();
    if (!text) return;
    setChecklist((prev) => [...prev, { id: generateId(), text }]);
    setChecklistDraft('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Give the task a title.');
      return;
    }

    setIsSaving(true);
    setTitleError(undefined);

    const waitingOnContact = sortedContacts.find((c) => c.id === waitingOnContactId);

    const checklistItems: TaskChecklistItem[] = checklist.map((item, index) => ({
      id: item.id,
      text: item.text,
      isCompleted: false,
      completedAt: null,
      sortOrder: index + 1,
    }));

    try {
      const task = await createTask({
        title: trimmedTitle,
        description: description.trim() || null,
        priority,
        dueDate: toIsoDueDate(dueDate, dueTime),
        dueTime: dueDate && dueTime ? dueTime : null,
        isImportant,
        checklist: checklistItems,
        linkedResearchPackId: packId || undefined,
        waitingOn: waitingOnContact
          ? {
              contactId: waitingOnContact.id,
              contactName: waitingOnContact.displayName,
              chaseDate: chaseDate ? new Date(`${chaseDate}T09:00`).toISOString() : null,
            }
          : null,
      });

      addToast({ variant: 'success', title: 'Task created', message: task.title });
      onCreated?.(task);
      onClose();
    } catch {
      addToast({
        variant: 'error',
        title: "Couldn't create task",
        message: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="New task">
      <div className="flex flex-col gap-5 px-5 pb-6 pt-4">
        {/* ── Title ─────────────────────────────────────────────────────── */}
        <Input
          label="Title"
          required
          autoFocus
          value={title}
          error={titleError}
          placeholder="What needs doing?"
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(undefined);
          }}
        />

        {/* ── Due date + time ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Input
            label="Due time"
            type="time"
            value={dueTime}
            disabled={!dueDate}
            helperText={dueDate ? undefined : 'Pick a date first'}
            onChange={(e) => setDueTime(e.target.value)}
          />
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
                    'h-10 rounded-lg border text-sm font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                    isActive
                      ? 'border-orange-500 bg-gray-100 text-gray-500'
                      : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {taskPriorityLabel[value]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Description ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="create-task-description">
            Description
          </label>
          <textarea
            id="create-task-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any detail you'll want later…"
            className={cn(
              'w-full resize-y rounded-lg border border-gray-100 bg-white px-3.5 py-2.5 text-sm',
              'text-gray-900 placeholder-gray-400 transition-colors duration-150',
              'hover:border-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
            )}
          />
        </div>

        {/* ── Important toggle ──────────────────────────────────────────── */}
        <button
          type="button"
          role="switch"
          aria-checked={isImportant}
          onClick={() => setIsImportant((v) => !v)}
          className={cn(
            'flex items-center justify-between rounded-lg border px-3.5 py-3 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            isImportant
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-100 bg-white hover:bg-gray-50',
          )}
        >
          <span className="flex items-center gap-2.5 text-sm font-medium text-gray-800">
            <Star
              className={cn(
                'h-4 w-4 transition-colors',
                isImportant ? 'fill-amber-400 text-amber-400' : 'text-gray-400',
              )}
              aria-hidden="true"
            />
            Mark as important
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
              isImportant ? 'bg-amber-400' : 'bg-gray-200',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                isImportant ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </span>
        </button>

        {/* ── Research pack ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="create-task-pack">
            Research pack
          </label>
          <select
            id="create-task-pack"
            className={selectClass}
            value={packId}
            onChange={(e) => setPackId(e.target.value)}
          >
            <option value="">No research pack</option>
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.title}
              </option>
            ))}
          </select>
        </div>

        {/* ── Waiting on ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel} htmlFor="create-task-waiting">
            <span className="inline-flex items-center gap-1.5">
              <Hourglass className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              Waiting on
            </span>
          </label>
          <select
            id="create-task-waiting"
            className={selectClass}
            value={waitingOnContactId}
            onChange={(e) => {
              setWaitingOnContactId(e.target.value);
              if (!e.target.value) setChaseDate('');
            }}
          >
            <option value="">Not blocked on anyone</option>
            {sortedContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.displayName}
                {contact.company ? ` — ${contact.company}` : ''}
              </option>
            ))}
          </select>

          {waitingOnContactId && (
            <Input
              containerClassName="mt-1.5"
              label="Chase date"
              type="date"
              value={chaseDate}
              helperText="When to follow up if you've heard nothing."
              onChange={(e) => setChaseDate(e.target.value)}
            />
          )}
        </div>

        {/* ── Checklist ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className={fieldLabel}>Checklist</span>

          {checklist.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-100" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    aria-label={`Remove "${item.text}"`}
                    className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <Input
              value={checklistDraft}
              placeholder="Add a step…"
              onChange={(e) => setChecklistDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addChecklistItem();
                }
              }}
            />
            <Button
              variant="outline"
              iconOnly
              aria-label="Add checklist item"
              disabled={!checklistDraft.trim()}
              onClick={addChecklistItem}
              className="h-11 w-11 shrink-0"
            >
              <Plus />
            </Button>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} isLoading={isSaving}>
            Create task
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default CreateTaskSheet;
