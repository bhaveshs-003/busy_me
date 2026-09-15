import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Check, FileText, Layers, Loader2, MoreHorizontal, Star, Trash2, X } from 'lucide-react';
import type { Note } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useNoteStore } from '@/store/noteStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// NoteDetailPage — editor for a single note
//
// Autosaves on a debounce while typing and immediately on blur, so the note is
// never left dirty if the user navigates away with the back gesture.
// =============================================================================

const AUTOSAVE_DELAY_MS = 1000;

type SaveState = 'idle' | 'saving' | 'saved';

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const notes = useNoteStore((s) => s.notes);
  const fetchNotes = useNoteStore((s) => s.fetchNotes);
  const updateNote = useNoteStore((s) => s.updateNote);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const togglePin = useNoteStore((s) => s.togglePin);

  const packs = useResearchPackStore((s) => s.packs);
  const addToast = useUIStore((s) => s.addToast);

  const note: Note | undefined = useMemo(
    () => notes.find((n) => n.id === id),
    [notes, id],
  );

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards the seeding effect so remote updates don't clobber in-progress edits.
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (notes.length === 0) void fetchNotes();
  }, [notes.length, fetchNotes]);

  // Seed the form once per note id.
  useEffect(() => {
    if (!note || seededFor.current === note.id) return;
    seededFor.current = note.id;
    setTitle(note.title);
    setBody(note.bodyText || note.bodyMarkdown);
  }, [note]);

  // Grow the title box to fit whatever it holds, so nothing is clipped.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const persist = useCallback(
    async (patch: Partial<Note>) => {
      if (!note) return;
      setSaveState('saving');
      await updateNote(note.id, patch);
      setSaveState('saved');
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveState('idle'), 1600);
    },
    [note, updateNote],
  );

  const queueSave = useCallback(
    (patch: Partial<Note>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void persist(patch), AUTOSAVE_DELAY_MS);
    },
    [persist],
  );

  const flushSave = useCallback(() => {
    if (!saveTimer.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    void persist({ title, bodyText: body, bodyMarkdown: body, wordCount: countWords(body) });
  }, [persist, title, body]);

  // ── Not found ──────────────────────────────────────────────────────────
  if (!note) {
    return (
      <div className="flex h-full flex-col bg-white">
        <PageHeader title="Note" showBack />
        <div className="flex-1 overflow-y-auto">
          <EmptyState
            icon={<FileText />}
            title="Note not found"
            description="This note may have been deleted, or the link is out of date."
            action={{ label: 'Back to notes', onClick: () => navigate('/notes') }}
          />
        </div>
      </div>
    );
  }

  const linkedPack = packs.find((p) => p.linkedNoteIds.includes(note.id));
  const wordCount = countWords(body);

  function handleTitleChange(next: string) {
    setTitle(next);
    queueSave({ title: next });
  }

  function handleBodyChange(next: string) {
    setBody(next);
    queueSave({ bodyText: next, bodyMarkdown: next, wordCount: countWords(next) });
  }

  function addTag() {
    const tag = tagDraft.trim().replace(/^#/, '');
    if (!tag || note!.tags.includes(tag)) {
      setTagDraft('');
      return;
    }
    void persist({ tags: [...note!.tags, tag] });
    setTagDraft('');
  }

  function removeTag(tag: string) {
    void persist({ tags: note!.tags.filter((x) => x !== tag) });
  }

  async function handleDelete() {
    setConfirmDelete(false);
    await deleteNote(note!.id);
    addToast({ variant: 'success', title: 'Note deleted' });
    navigate('/notes', { replace: true });
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title="Note"
        showBack
        rightActions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => togglePin(note.id)}
              aria-label={note.isPinned ? 'Unstar note' : 'Star note'}
              aria-pressed={note.isPinned}
              className={cn('rounded-lg p-2', t.pressable, t.focusRing)}
            >
              <Star
                className={cn(
                  'h-5 w-5',
                  note.isPinned ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
                )}
              />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Note options"
              aria-expanded={isMenuOpen}
              className={cn('rounded-lg p-2 text-gray-500', t.pressable, t.focusRing)}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        }
      />

      {/* Overflow menu */}
      {isMenuOpen && (
        <div className={cn(t.hairline, 'border-b bg-gray-50 px-4 py-2')}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setConfirmDelete(true);
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-600',
              t.pressable,
            )}
          >
            <Trash2 className="h-4 w-4" />
            Delete note
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4" onBlur={flushSave}>
        {/* Title — a textarea rather than an input so long titles wrap instead
            of clipping at the edge of the 420px frame. */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            // Keep it a single logical line; Enter moves focus to the body.
            if (e.key === 'Enter') {
              e.preventDefault();
              bodyRef.current?.focus();
            }
          }}
          rows={1}
          placeholder="Untitled note"
          aria-label="Note title"
          className="w-full resize-none overflow-hidden bg-transparent text-lg font-semibold leading-snug text-gray-900 placeholder-gray-300 focus:outline-none"
        />

        {/* Save indicator */}
        <div className="mt-1 flex h-4 items-center gap-1.5">
          {saveState === 'saving' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              <span className={t.meta}>Saving…</span>
            </>
          )}
          {saveState === 'saved' && (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span className={t.meta}>Saved</span>
            </>
          )}
        </div>

        {/* Body */}
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Start writing…"
          aria-label="Note body"
          rows={14}
          className="mt-3 w-full resize-none bg-transparent text-sm leading-relaxed text-gray-700 placeholder-gray-300 focus:outline-none"
        />

        {/* Tags */}
        <div className="mt-6">
          <h2 className={cn(t.label, 'mb-2')}>Tags</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-2.5 pr-1 text-xs font-medium text-gray-600"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="rounded-full p-0.5 text-gray-400 active:opacity-60"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="Add tag"
              aria-label="Add tag"
              className="h-7 w-24 rounded-full border border-gray-100 px-2.5 text-xs text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Linked research pack */}
        {linkedPack && (
          <div className="mt-6">
            <h2 className={cn(t.label, 'mb-2')}>Research pack</h2>
            <Link
              to={`/research-packs/${linkedPack.id}`}
              className={cn(
                t.border,
                t.radius,
                'flex items-center gap-3 px-3.5 py-3',
                t.pressable,
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <Layers className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {linkedPack.title}
                </span>
                <span className={cn(t.meta, 'block')}>{linkedPack.status}</span>
              </span>
            </Link>
          </div>
        )}

        {/* Metadata */}
        <dl className={cn(t.border, t.radius, 'mt-6 divide-y divide-gray-100')}>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <dt className={t.meta}>Created</dt>
            <dd className="text-xs text-gray-600">{formatDate(note.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <dt className={t.meta}>Last updated</dt>
            <dd className="text-xs text-gray-600">{formatDate(note.updatedAt)}</dd>
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <dt className={t.meta}>Words</dt>
            <dd className="text-xs text-gray-600">{wordCount}</dd>
          </div>
        </dl>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this note?"
        description="This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
