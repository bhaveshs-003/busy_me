import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Archive, Layers, MoreHorizontal, Trash2 } from 'lucide-react';
import type { ResearchPack } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ResearchPackStatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState as Empty } from '@/components/ui/EmptyState';
import { ContactCard } from '@/components/contacts/ContactCard';
import { CreateTaskSheet } from '@/components/tasks/CreateTaskSheet';
import { PackOverview } from '@/components/research-pack/PackOverview';
import { PackOngoingStory } from '@/components/research-pack/PackOngoingStory';
import { PackBriefing } from '@/components/research-pack/PackBriefing';
import { PackTimeline } from '@/components/research-pack/PackTimeline';
import { PackEmails } from '@/components/research-pack/PackEmails';
import { PackTasks } from '@/components/research-pack/PackTasks';
import { PackFiles } from '@/components/research-pack/PackFiles';
import { PackTagList } from '@/components/research-pack/PackSection';
import { usePackLinks } from '@/components/research-pack/packLinks';
import { EventCard } from '@/components/events/EventCard';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useTaskStore } from '@/store/taskStore';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// ResearchPackDetailPage
//
// Ten tabs inside a 420px frame, so the tab strip scrolls horizontally rather
// than wrapping — wrapping would push the content below the fold on open.
// =============================================================================

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'story', label: 'Story' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'emails', label: 'Emails' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'events', label: 'Events' },
  { id: 'notes', label: 'Notes' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'files', label: 'Files' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ResearchPackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const packs = useResearchPackStore((s) => s.packs);
  const fetchPacks = useResearchPackStore((s) => s.fetchPacks);
  const updatePack = useResearchPackStore((s) => s.updatePack);
  const deletePack = useResearchPackStore((s) => s.deletePack);
  const isLoading = useResearchPackStore((s) => s.isLoading);

  const updateTask = useTaskStore((s) => s.updateTask);
  const addToast = useUIStore((s) => s.addToast);
  const trackEvent = useSettingsStore((s) => s.trackEvent);

  const [tab, setTab] = useState<TabId>('overview');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isAddingTask, setAddingTask] = useState(false);

  const pack: ResearchPack | undefined = useMemo(
    () => packs.find((p) => p.id === id),
    [packs, id],
  );

  const links = usePackLinks(pack);

  useEffect(() => {
    if (packs.length === 0) void fetchPacks();
  }, [packs.length, fetchPacks]);

  useEffect(() => {
    if (pack) trackEvent('screen_view', { screen: 'research-pack', packId: pack.id });
  }, [pack, trackEvent]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (!pack && isLoading) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Research Pack" showBack />
        <div className="flex-1 overflow-y-auto px-4 pt-4">
          <ListSkeleton count={5} />
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (!pack) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Research Pack" showBack />
        <div className="flex-1 overflow-y-auto">
          <EmptyState
            icon={<Layers />}
            title="Research pack not found"
            description="This pack may have been deleted, or the link is out of date."
            action={{ label: 'All packs', onClick: () => navigate('/research-packs') }}
          />
        </div>
      </div>
    );
  }

  async function handleArchive() {
    setMenuOpen(false);
    await updatePack(pack!.id, { status: 'archived' });
    addToast({ variant: 'success', title: 'Pack archived' });
  }

  async function handleDelete() {
    setConfirmDelete(false);
    await deletePack(pack!.id);
    addToast({ variant: 'success', title: 'Pack deleted' });
    navigate('/research-packs', { replace: true });
  }

  const counts: Partial<Record<TabId, number>> = {
    emails: links.emails.length,
    tasks: links.tasks.length,
    events: links.events.length,
    notes: links.notes.length,
    contacts: links.contacts.length,
    files: links.files.length,
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title={pack.title}
        showBack
        rightActions={
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Pack options"
            aria-expanded={isMenuOpen}
            className={cn('rounded-lg p-2 text-gray-500', t.pressable, t.focusRing)}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        }
      />

      {/* Overflow menu */}
      {isMenuOpen && (
        <div className={cn(t.hairline, 'border-b bg-white px-4 py-2')}>
          <button
            type="button"
            onClick={handleArchive}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-700',
              t.pressable,
            )}
          >
            <Archive className="h-4 w-4" />
            Archive pack
          </button>
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
            Delete pack
          </button>
        </div>
      )}

      {/* Header block */}
      <div className={cn(t.hairline, 'flex-shrink-0 border-b bg-white px-4 pb-3 pt-1')}>
        <div className="flex items-center gap-2">
          <ResearchPackStatusBadge status={pack.status} size="sm" />
          <span className={t.meta}>Updated {formatRelativeTime(pack.updatedAt)}</span>
        </div>

        {pack.description && (
          <p className={cn(t.body, 'mt-2 leading-relaxed')}>{pack.description}</p>
        )}

        <PackTagList tags={pack.tags} className="mt-2.5" />

        <p className={cn(t.meta, 'mt-2.5')}>Created {formatDate(pack.createdAt)}</p>
      </div>

      {/* Tab strip — horizontally scrollable inside the phone frame */}
      <div
        role="tablist"
        aria-label="Research pack sections"
        className={cn(
          t.hairline,
          'scrollbar-hide flex flex-shrink-0 gap-1 overflow-x-auto border-b bg-white px-3 py-2',
        )}
      >
        {TABS.map(({ id: tabId, label }) => {
          const isActive = tabId === tab;
          const count = counts[tabId];
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setTab(tabId)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5',
                'text-xs font-medium',
                t.pressable,
                t.focusRing,
                isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500',
              )}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span
                  className={cn('tabular-nums', isActive ? 'text-white/70' : 'text-gray-400')}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
        {tab === 'overview' && (
          <PackOverview
            pack={pack}
            links={links}
            onOpenTab={(next) => setTab(next as TabId)}
            onAddTask={() => setAddingTask(true)}
            onAddNote={() => navigate('/notes')}
            onAddEmail={() => navigate('/emails')}
          />
        )}

        {tab === 'story' && <PackOngoingStory pack={pack} />}
        {tab === 'briefing' && <PackBriefing pack={pack} links={links} />}
        {tab === 'timeline' && <PackTimeline pack={pack} />}
        {tab === 'emails' && <PackEmails emails={links.emails} />}
        {tab === 'tasks' && (
          <PackTasks tasks={links.tasks} onAddTask={() => setAddingTask(true)} />
        )}

        {tab === 'events' && (
          links.events.length === 0 ? (
            <Empty
              icon={<Layers />}
              title="No events linked"
              description="Schedule something against this pack and it will show up here."
              action={{ label: 'Open calendar', onClick: () => navigate('/calendar') }}
            />
          ) : (
            <ul className="space-y-2">
              {[...links.events]
                .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
                .map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} onClick={() => navigate(`/events/${event.id}`)} />
                  </li>
                ))}
            </ul>
          )
        )}

        {tab === 'notes' && (
          links.notes.length === 0 ? (
            <Empty
              icon={<Layers />}
              title="No notes linked"
              description="Capture a thought against this pack to keep the thinking with the work."
              action={{ label: 'Open notes', onClick: () => navigate('/notes') }}
            />
          ) : (
            <ul className={cn(t.border, t.radius, 'divide-y divide-gray-100 bg-white')}>
              {links.notes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/notes/${note.id}`)}
                    className={cn('w-full px-3.5 py-3 text-left', t.pressable)}
                  >
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {note.title}
                    </span>
                    <span className={cn(t.meta, 'mt-0.5 block truncate')}>
                      {formatDate(note.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'contacts' && (
          links.contacts.length === 0 ? (
            <Empty
              icon={<Layers />}
              title="No contacts linked"
              description="Link the people involved so the pack knows who to chase."
              action={{ label: 'Open contacts', onClick: () => navigate('/contacts') }}
            />
          ) : (
            <ul className={cn(t.border, t.radius, 'divide-y divide-gray-100 bg-white')}>
              {links.contacts.map((contact) => (
                <li key={contact.id}>
                  <ContactCard
                    contact={contact}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  />
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'files' && <PackFiles files={links.files} />}
      </div>

      {/* CreateTaskSheet has no pack-awareness of its own, so the link is
          applied here once the task comes back. */}
      <CreateTaskSheet
        open={isAddingTask}
        onClose={() => setAddingTask(false)}
        onCreated={(task) => {
          void updateTask(task.id, { linkedResearchPackId: pack.id });
          addToast({
            variant: 'success',
            title: 'Task added to pack',
            message: task.title,
          });
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this research pack?"
        description="The pack and its timeline are removed. Linked emails, tasks and events are kept."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
