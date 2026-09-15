import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Star } from 'lucide-react';
import type { Note } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterItem } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useNoteStore } from '@/store/noteStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate } from '@/lib/utils';

// =============================================================================
// Filtering
// =============================================================================

type NoteFilter = 'all' | 'important' | 'recent';

const FILTERS: { id: NoteFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'important', label: 'Important' },
  { id: 'recent', label: 'Recent' },
];

/** A note counts as "recent" when it was touched inside this window. */
const RECENT_WINDOW_DAYS = 7;
const RECENT_WINDOW_MS = RECENT_WINDOW_DAYS * 86_400_000;

function matchesFilter(note: Note, filter: NoteFilter, now: number): boolean {
  switch (filter) {
    case 'important':
      return note.isPinned;
    case 'recent':
      return now - Date.parse(note.updatedAt) <= RECENT_WINDOW_MS;
    case 'all':
    default:
      return true;
  }
}

function matchesQuery(note: Note, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    note.title.toLowerCase().includes(needle) ||
    note.bodyText.toLowerCase().includes(needle) ||
    note.bodyMarkdown.toLowerCase().includes(needle) ||
    note.tags.some((tag) => tag.toLowerCase().includes(needle))
  );
}

/** Strips the markdown syntax that would otherwise show up in a card preview. */
function previewText(note: Note): string {
  const source = note.bodyText.trim() || note.bodyMarkdown;
  return source
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^[-*+]\s+\[[ x]\]\s*/gm, '') // task list markers
    .replace(/^[-*+]\s+/gm, '') // bullets
    .replace(/^\d+\.\s+/gm, '') // ordered list markers
    .replace(/[*_~`>]/g, '') // inline emphasis
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → label
    .replace(/\s+/g, ' ')
    .trim();
}

const EMPTY_COPY: Record<NoteFilter, { title: string; description: string }> = {
  all: {
    title: 'No notes yet',
    description: 'Capture a thought, a meeting recap, or a half-formed idea.',
  },
  important: {
    title: 'No important notes',
    description: 'Star a note to keep it at the top of this list.',
  },
  recent: {
    title: 'Nothing recent',
    description: `No notes have been edited in the last ${RECENT_WINDOW_DAYS} days.`,
  },
};

// =============================================================================
// Note card
// =============================================================================

function NoteCard({
  note,
  onOpen,
  onToggleImportant,
}: {
  note: Note;
  onOpen: (note: Note) => void;
  onToggleImportant: (note: Note) => void;
}) {
  const preview = previewText(note);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(note)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(note);
        }
      }}
      className={cn(
        // `break-inside-avoid` keeps a card whole inside the CSS column flow.
        'mb-3 block w-full break-inside-avoid rounded-lg border border-gray-100/80 bg-white p-3.5 text-left',
        'transition-all duration-200 ease-out hover:border-gray-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
      )}
    >
      {/* Colour accent from the note, when it has one */}
      {note.color && (
        <span
          aria-hidden="true"
          className="mb-2.5 block h-1 w-8 rounded-full"
          style={{ backgroundColor: note.color }}
        />
      )}

      <div className="flex items-start gap-1.5">
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-900 line-clamp-2">
          {note.title}
        </h3>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleImportant(note);
          }}
          aria-label={note.isPinned ? `Unstar "${note.title}"` : `Star "${note.title}"`}
          aria-pressed={note.isPinned}
          className="-mr-1 -mt-1 shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100"
        >
          <Star
            className={cn(
              'h-4 w-4 transition-colors',
              note.isPinned ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {preview && (
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500 line-clamp-3">
          {preview}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400">
          {formatDate(note.updatedAt, { month: 'short', day: 'numeric' })}
        </span>
        {note.createdByAI && (
          <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
            AI
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function NoteListPage() {
  const navigate = useNavigate();

  const notes = useNoteStore((s) => s.notes);
  const fetchNotes = useNoteStore((s) => s.fetchNotes);
  const createNote = useNoteStore((s) => s.createNote);
  const togglePin = useNoteStore((s) => s.togglePin);
  const searchQuery = useNoteStore((s) => s.searchQuery);
  const setSearchQuery = useNoteStore((s) => s.setSearchQuery);
  const addToast = useUIStore((s) => s.addToast);

  const [filter, setFilter] = useState<NoteFilter>('all');
  const [isCreating, setCreating] = useState(false);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  // One instant per render pass so "recent" is evaluated consistently.
  const now = useMemo(() => Date.now(), []);

  const searchable = useMemo(
    () => notes.filter((note) => !note.isArchived && matchesQuery(note, searchQuery.trim())),
    [notes, searchQuery],
  );

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<string, number>>((acc, { id }) => {
        acc[id] = searchable.filter((note) => matchesFilter(note, id, now)).length;
        return acc;
      }, {}),
    [searchable, now],
  );

  const filterItems: FilterItem[] = useMemo(
    () => FILTERS.map(({ id, label }) => ({ id, label, count: counts[id] ?? 0 })),
    [counts],
  );

  const visibleNotes = useMemo(
    () =>
      searchable
        .filter((note) => matchesFilter(note, filter, now))
        // Starred notes float to the top, then most recently edited.
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
        }),
    [searchable, filter, now],
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const note = await createNote({ title: 'Untitled note', bodyMarkdown: '' });
      navigate(`/notes/${note.id}`);
    } catch {
      addToast({
        variant: 'error',
        title: "Couldn't create note",
        message: 'Please try again.',
      });
    } finally {
      setCreating(false);
    }
  };

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className="relative flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Notes"
        subtitle={`${counts.all ?? 0} note${counts.all === 1 ? '' : 's'}`}
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label="New note"
            isLoading={isCreating}
            onClick={handleCreate}
          >
            <Plus />
          </Button>
        }
      />

      {/* ── Search + filters ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 pb-3 pt-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search notes…"
          aria-label="Search notes"
        />
        <FilterBar
          className="mt-3"
          aria-label="Note filters"
          filters={filterItems}
          active={filter}
          onChange={(id) => setFilter(id as NoteFilter)}
        />
      </div>

      {/* ── Masonry grid ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        {visibleNotes.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title={hasQuery ? 'No matching notes' : EMPTY_COPY[filter].title}
            description={
              hasQuery
                ? `Nothing matches "${searchQuery.trim()}". Try different keywords.`
                : EMPTY_COPY[filter].description
            }
            action={
              hasQuery
                ? { label: 'Clear search', onClick: () => setSearchQuery('') }
                : { label: 'New note', onClick: () => void handleCreate() }
            }
            secondaryAction={
              !hasQuery && filter !== 'all'
                ? { label: 'Show all notes', onClick: () => setFilter('all') }
                : undefined
            }
          />
        ) : (
          // CSS multi-column gives a masonry flow without measuring heights.
          <div className="columns-2 gap-3">
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={(n) => navigate(`/notes/${n.id}`)}
                onToggleImportant={(n) => togglePin(n.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleCreate}
        disabled={isCreating}
        aria-label="New note"
        className={cn(
          'absolute bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-orange-500 text-white',
          'transition-all duration-200 ease-out hover:bg-orange-600 active:scale-95',
          'disabled:pointer-events-none disabled:opacity-60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        )}
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}
