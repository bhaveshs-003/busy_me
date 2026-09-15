import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  FileText,
  Hourglass,
  Layers,
  Paperclip,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { Task, TaskChecklistItem, TaskPriority } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  effectiveTaskStatus,
  taskPriorityLabel,
} from '@/components/tasks/TaskCard';
import { useTaskStore } from '@/store/taskStore';
import { useContactStore } from '@/store/contactStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate, formatFileSize, formatRelativeTime, generateId } from '@/lib/utils';

// =============================================================================
// Helpers
// =============================================================================

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

const sectionLabel = 'text-xs font-semibold uppercase tracking-wide text-gray-400';

const selectClass = cn(
  'h-11 w-full rounded-lg border border-gray-100 bg-white px-3.5 text-sm text-gray-900',
  'transition-colors duration-150 ease-out hover:border-gray-400',
  'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
);

/** ISO timestamp → `YYYY-MM-DD` for a native date input. */
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  // Use local parts so the picker shows the date the user sees elsewhere.
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-gray-100/80 bg-white p-4', className)}>
      <h2 className={cn(sectionLabel, 'mb-3')}>{title}</h2>
      {children}
    </section>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const task = useTaskStore((s) => s.tasks.find((t) => t.id === id));
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);
  const contacts = useContactStore((s) => s.contacts);
  const packs = useResearchPackStore((s) => s.packs);
  const addToast = useUIStore((s) => s.addToast);

  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [checklistDraft, setChecklistDraft] = useState('');
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  // Adopt server values whenever a different task is loaded.
  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title);
    setDescriptionDraft(task.description ?? '');
    // Only re-sync on identity change so typing is never clobbered by a write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [contacts],
  );

  const linkedPack = useMemo(
    () => packs.find((p) => p.id === task?.linkedResearchPackId) ?? null,
    [packs, task?.linkedResearchPackId],
  );

  if (!task) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Task" showBack />
        <EmptyState
          icon={<FileText />}
          title="Task not found"
          description="This task may have been deleted or never existed."
          action={{ label: 'Back to tasks', onClick: () => navigate('/tasks') }}
        />
      </div>
    );
  }

  const status = effectiveTaskStatus(task);
  const isCompleted = task.status === 'completed';
  const attachments = task.attachments ?? [];
  const waitingOn = task.waitingOn ?? null;

  // ── Mutations ──────────────────────────────────────────────────────────
  const patch = async (changes: Partial<Task>, errorMessage = "Couldn't save changes") => {
    try {
      await updateTask(task.id, changes);
    } catch {
      addToast({ variant: 'error', title: errorMessage, message: 'Please try again.' });
    }
  };

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(task.title); // Never allow an empty title.
      return;
    }
    if (trimmed !== task.title) void patch({ title: trimmed });
  };

  const commitDescription = () => {
    const next = descriptionDraft.trim() || null;
    if (next !== task.description) void patch({ description: next });
  };

  const handleDueDateChange = (value: string) => {
    if (!value) {
      void patch({ dueDate: null, dueTime: null });
      return;
    }
    const time = task.dueTime || '17:00';
    const parsed = new Date(`${value}T${time}`);
    if (Number.isNaN(parsed.getTime())) return;
    void patch({ dueDate: parsed.toISOString(), dueTime: task.dueTime });
  };

  const handleDueTimeChange = (value: string) => {
    if (!task.dueDate) return;
    if (!value) {
      void patch({ dueTime: null });
      return;
    }
    const parsed = new Date(`${toDateInputValue(task.dueDate)}T${value}`);
    if (Number.isNaN(parsed.getTime())) return;
    void patch({ dueDate: parsed.toISOString(), dueTime: value });
  };

  const handleToggleComplete = async () => {
    try {
      if (isCompleted) await uncompleteTask(task.id);
      else await completeTask(task.id);
    } catch {
      addToast({ variant: 'error', title: "Couldn't update task" });
    }
  };

  const setChecklist = (checklist: TaskChecklistItem[]) => {
    void patch({ checklist }, "Couldn't update checklist");
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(
      task.checklist.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isCompleted: !item.isCompleted,
              completedAt: item.isCompleted ? null : new Date().toISOString(),
            }
          : item,
      ),
    );
  };

  const addChecklistItem = () => {
    const text = checklistDraft.trim();
    if (!text) return;
    setChecklist([
      ...task.checklist,
      {
        id: generateId(),
        text,
        isCompleted: false,
        completedAt: null,
        sortOrder: task.checklist.length + 1,
      },
    ]);
    setChecklistDraft('');
  };

  const removeChecklistItem = (itemId: string) => {
    setChecklist(task.checklist.filter((item) => item.id !== itemId));
  };

  const handleWaitingOnChange = (contactId: string) => {
    if (!contactId) {
      void patch({ waitingOn: null });
      return;
    }
    const contact = sortedContacts.find((c) => c.id === contactId);
    if (!contact) return;
    void patch({
      waitingOn: {
        contactId: contact.id,
        contactName: contact.displayName,
        chaseDate: waitingOn?.chaseDate ?? null,
        note: waitingOn?.note,
      },
    });
  };

  const handleChaseDateChange = (value: string) => {
    if (!waitingOn) return;
    const chaseDate = value ? new Date(`${value}T09:00`).toISOString() : null;
    void patch({ waitingOn: { ...waitingOn, chaseDate } });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      addToast({ variant: 'success', title: 'Task deleted', message: task.title });
      navigate('/tasks', { replace: true });
    } catch {
      addToast({ variant: 'error', title: "Couldn't delete task" });
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const checklistDone = task.checklist.filter((i) => i.isCompleted).length;

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Task"
        showBack
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label={task.isImportant ? 'Remove importance' : 'Mark as important'}
            onClick={() => void patch({ isImportant: !task.isImportant })}
          >
            <Star
              className={cn(task.isImportant && 'fill-amber-400 text-amber-400')}
            />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {/* ── Title + status ─────────────────────────────────────────── */}
          <section className="rounded-lg border border-gray-100/80 bg-white p-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={isCompleted}
                aria-label={isCompleted ? 'Mark as open' : 'Mark as complete'}
                onClick={handleToggleComplete}
                className={cn(
                  'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                  'transition-all duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-gray-100 bg-white text-transparent hover:border-emerald-400',
                )}
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200',
                    isCompleted ? 'scale-100' : 'scale-0',
                  )}
                  strokeWidth={3.5}
                  aria-hidden="true"
                />
              </button>

              <div className="min-w-0 flex-1">
                <input
                  value={titleDraft}
                  aria-label="Task title"
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') {
                      setTitleDraft(task.title);
                      e.currentTarget.blur();
                    }
                  }}
                  className={cn(
                    'w-full rounded-lg border border-transparent bg-transparent px-2 py-1 -ml-2',
                    'text-lg font-semibold leading-snug text-gray-900',
                    'transition-colors duration-150 hover:bg-gray-50',
                    'focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40',
                    isCompleted && 'text-gray-400 line-through',
                  )}
                />

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={status} size="sm" />
                  {task.isImportant && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200/70">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                      Important
                    </span>
                  )}
                  {task.createdByAI && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 ring-1 ring-inset ring-purple-200/70">
                      AI created
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Due date + priority ────────────────────────────────────── */}
          <Section title="Schedule">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Due date"
                type="date"
                value={toDateInputValue(task.dueDate)}
                onChange={(e) => handleDueDateChange(e.target.value)}
              />
              <Input
                label="Due time"
                type="time"
                value={task.dueTime ?? ''}
                disabled={!task.dueDate}
                helperText={task.dueDate ? undefined : 'Set a date first'}
                onChange={(e) => handleDueTimeChange(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <span className={cn(sectionLabel, 'mb-2 block')}>Priority</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Priority">
                {PRIORITIES.map((value) => {
                  const isActive = task.priority === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => void patch({ priority: value })}
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
          </Section>

          {/* ── Description ────────────────────────────────────────────── */}
          <Section title="Description">
            <textarea
              rows={4}
              aria-label="Task description"
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={commitDescription}
              placeholder="Add more detail…"
              className={cn(
                'w-full resize-y rounded-lg border border-gray-100 bg-white px-3.5 py-2.5 text-sm',
                'text-gray-900 placeholder-gray-400 transition-colors duration-150',
                'hover:border-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40',
              )}
            />
          </Section>

          {/* ── Checklist ──────────────────────────────────────────────── */}
          <Section
            title={
              task.checklist.length > 0
                ? `Checklist · ${checklistDone}/${task.checklist.length}`
                : 'Checklist'
            }
          >
            {task.checklist.length > 0 && (
              <ul className="mb-3 flex flex-col gap-1">
                {task.checklist.map((item) => (
                  <li key={item.id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-gray-50">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={item.isCompleted}
                      aria-label={item.text}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={cn(
                        'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2',
                        'h-[18px] w-[18px] transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                        item.isCompleted
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-gray-100 bg-white text-transparent hover:border-emerald-400',
                      )}
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={4} aria-hidden="true" />
                    </button>

                    <span
                      className={cn(
                        'min-w-0 flex-1 text-sm transition-colors',
                        item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700',
                      )}
                    >
                      {item.text}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      aria-label={`Remove "${item.text}"`}
                      className="shrink-0 rounded-full p-1 text-gray-300 opacity-0 transition-all hover:bg-gray-200 hover:text-gray-600 focus-visible:opacity-100 group-hover:opacity-100"
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
                aria-label="New checklist item"
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
          </Section>

          {/* ── Attachments ────────────────────────────────────────────── */}
          <Section title={`Attachments${attachments.length ? ` · ${attachments.length}` : ''}`}>
            {attachments.length === 0 ? (
              <p className="text-sm text-gray-400">No files attached to this task.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-100/80 px-3 py-2.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <Paperclip className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800">
                        {file.filename}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {formatFileSize(file.sizeBytes)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── Linked research pack ───────────────────────────────────── */}
          <Section title="Research pack">
            {linkedPack && (
              <Link
                to={`/research-packs/${linkedPack.id}`}
                className="mb-3 flex items-center gap-3 rounded-lg border border-gray-100/80 px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: linkedPack.color }}
                >
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800">
                    {linkedPack.title}
                  </span>
                  <span className="block text-xs text-gray-400">
                    updated {formatRelativeTime(linkedPack.updatedAt)}
                  </span>
                </span>
              </Link>
            )}

            <select
              aria-label="Linked research pack"
              className={selectClass}
              value={task.linkedResearchPackId ?? ''}
              onChange={(e) => void patch({ linkedResearchPackId: e.target.value || undefined })}
            >
              <option value="">No research pack</option>
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.title}
                </option>
              ))}
            </select>
          </Section>

          {/* ── Waiting on ─────────────────────────────────────────────── */}
          <Section title="Waiting on">
            {waitingOn?.note && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200/70">
                <Hourglass className="mr-1.5 inline h-3 w-3" aria-hidden="true" />
                {waitingOn.note}
              </p>
            )}

            <select
              aria-label="Waiting on contact"
              className={selectClass}
              value={waitingOn?.contactId ?? ''}
              onChange={(e) => handleWaitingOnChange(e.target.value)}
            >
              <option value="">Not blocked on anyone</option>
              {sortedContacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.displayName}
                  {contact.company ? ` — ${contact.company}` : ''}
                </option>
              ))}
            </select>

            {waitingOn && (
              <Input
                containerClassName="mt-3"
                label="Chase date"
                type="date"
                value={toDateInputValue(waitingOn.chaseDate)}
                helperText="When to follow up if you've heard nothing."
                onChange={(e) => handleChaseDateChange(e.target.value)}
              />
            )}
          </Section>

          {/* ── Timestamps ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1 px-1 text-xs text-gray-400">
            <span>
              Created {formatDate(task.createdAt, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            <span>
              Updated {formatDate(task.updatedAt, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            {task.completedAt && (
              <span className="text-emerald-600">
                Completed {formatDate(task.completedAt, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>

          {/* ── Delete ─────────────────────────────────────────────────── */}
          <Button
            variant="outline"
            fullWidth
            leftIcon={<Trash2 />}
            onClick={() => setConfirmingDelete(true)}
            className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
          >
            Delete task
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete this task?"
        description={`"${task.title}" will be removed permanently. This cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
