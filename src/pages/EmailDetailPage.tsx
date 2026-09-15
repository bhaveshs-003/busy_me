import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  CornerUpLeft,
  Download,
  Forward,
  Layers,
  ListPlus,
  Loader2,
  Mail,
  MailOpen,
  MoreVertical,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import type { Email, EmailAddress, EmailAttachment } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import type { ComposeMode } from '@/components/email/ComposeEmail';
import {
  CATEGORY_META,
  attachmentVisual,
  displayName,
  emailBodyText,
  formatFullTimestamp,
  formatShortDate,
  parseEmailBody,
  splitLinks,
  type EmailBodyBlock,
} from '@/components/email/emailUtils';
import { useEmailStore } from '@/store/emailStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useTaskStore } from '@/store/taskStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatFileSize, sleep } from '@/lib/utils';

// =============================================================================
// Body rendering
//
// Bodies are parsed into a block model rather than injected as HTML, so the
// detail screen renders real elements with consistent spacing.
// =============================================================================

function Linkified({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((segment, index) =>
        segment.href ? (
          <a
            key={`${segment.href}-${index}`}
            href={segment.href}
            target="_blank"
            rel="noreferrer noopener"
            className="break-words text-gray-900 underline decoration-gray-300 underline-offset-2"
          >
            {segment.text}
          </a>
        ) : (
          <span key={`text-${index}`}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function BodyBlock({ block }: { block: EmailBodyBlock }) {
  switch (block.kind) {
    case 'heading':
      return (
        <h3 className="text-sm font-semibold text-gray-900">
          <Linkified text={block.text} />
        </h3>
      );

    case 'list':
      return block.ordered ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-gray-700">
          {block.items.map((item, index) => (
            <li key={`${item}-${index}`}>
              <Linkified text={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-gray-700">
          {block.items.map((item, index) => (
            <li key={`${item}-${index}`}>
              <Linkified text={item} />
            </li>
          ))}
        </ul>
      );

    case 'quote':
      return (
        <blockquote className="border-l-2 border-gray-100 pl-3 text-sm leading-relaxed text-gray-400">
          {block.lines.map((line, index) => (
            <span key={`${line}-${index}`} className="block">
              <Linkified text={line} />
            </span>
          ))}
        </blockquote>
      );

    case 'signature':
      return (
        <div className="border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-400">
          {block.lines.map((line, index) => (
            <span key={`${line}-${index}`} className="block">
              {line}
            </span>
          ))}
        </div>
      );

    case 'paragraph':
    default:
      return (
        <p className="text-sm leading-relaxed text-gray-700">
          <Linkified text={block.text} />
        </p>
      );
  }
}

// =============================================================================
// Small building blocks
// =============================================================================

function AddressRow({ label, addresses }: { label: string; addresses: EmailAddress[] }) {
  if (addresses.length === 0) return null;

  return (
    <div className="flex gap-2 text-xs">
      <span className="w-6 shrink-0 font-medium uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-gray-500">
        {addresses.map((address) => displayName(address)).join(', ')}
      </span>
    </div>
  );
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
    <section className={cn('rounded-lg border border-gray-100 bg-white p-4', className)}>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">{title}</h2>
      {children}
    </section>
  );
}

/** A tap target in the pinned bottom action bar. */
function ActionButton({
  icon,
  label,
  onClick,
  isActive = false,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5',
        'transition-opacity active:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
        tone === 'danger' ? 'text-red-600' : isActive ? 'text-gray-900' : 'text-gray-500',
      )}
    >
      <span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}

/** A row in the header's overflow sheet. */
function MenuRow({
  icon,
  label,
  description,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[44px] w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left',
        'last:border-b-0 transition-opacity active:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100',
          '[&>svg]:h-4 [&>svg]:w-4',
          tone === 'danger' ? 'text-red-600' : 'text-gray-500',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-sm font-medium',
            tone === 'danger' ? 'text-red-600' : 'text-gray-900',
          )}
        >
          {label}
        </span>
        {description && <span className="block truncate text-xs text-gray-500">{description}</span>}
      </span>
    </button>
  );
}

// =============================================================================
// Busy.me suggestions
// =============================================================================

type SuggestionId = 'task' | 'pack' | 'reply';

interface SuggestionConfig {
  id: SuggestionId;
  icon: React.ReactNode;
  title: string;
  description: (email: Email) => string;
  cta: string;
}

const SUGGESTIONS: SuggestionConfig[] = [
  {
    id: 'task',
    icon: <ListPlus />,
    title: 'Create follow-up task',
    description: (email) => `Track "${email.subject}" as a task due in two days.`,
    cta: 'Create',
  },
  {
    id: 'pack',
    icon: <Layers />,
    title: 'Add to Research Pack',
    description: () => 'File this thread on a pack timeline so the context stays together.',
    cta: 'Add',
  },
  {
    id: 'reply',
    icon: <Sparkles />,
    title: 'Draft a reply',
    description: (email) =>
      email.aiReplySuggestions?.[0]
        ? `Opens the composer pre-filled: "${email.aiReplySuggestions[0].slice(0, 60)}…"`
        : 'Opens the composer with a suggested opening line.',
    cta: 'Draft',
  },
];

/** Follow-up tasks default to two days out at 5pm, matching the task defaults. */
const FOLLOW_UP_DAYS = 2;

function followUpDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + FOLLOW_UP_DAYS);
  due.setHours(17, 0, 0, 0);
  return due.toISOString();
}

// =============================================================================
// Page
// =============================================================================

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const email = useEmailStore((s) => s.emails.find((e) => e.id === id));
  const markRead = useEmailStore((s) => s.markRead);
  const markUnread = useEmailStore((s) => s.markUnread);
  const markImportant = useEmailStore((s) => s.markImportant);
  const archiveEmail = useEmailStore((s) => s.archiveEmail);
  const deleteEmail = useEmailStore((s) => s.deleteEmail);
  const createTask = useTaskStore((s) => s.createTask);
  const packs = useResearchPackStore((s) => s.packs);
  const addItemToPack = useResearchPackStore((s) => s.addItemToPack);
  const addToast = useUIStore((s) => s.addToast);

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isPackSheetOpen, setPackSheetOpen] = useState(false);
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode | null>(null);
  const [composeBody, setComposeBody] = useState<string | undefined>(undefined);
  const [busySuggestion, setBusySuggestion] = useState<SuggestionId | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Mark read once per email — so the Unread toggle below is not undone.
  const readRef = useRef<string | null>(null);
  useEffect(() => {
    if (!email || readRef.current === email.id) return;
    readRef.current = email.id;
    if (email.status === 'unread') void markRead(email.id);
  }, [email, markRead]);

  const blocks = useMemo(
    () => (email ? parseEmailBody(emailBodyText(email)) : []),
    [email],
  );

  const openCompose = useCallback((mode: ComposeMode, body?: string) => {
    setComposeBody(body);
    setComposeMode(mode);
    setMenuOpen(false);
  }, []);

  const handleCreateFollowUpTask = useCallback(async () => {
    if (!email) return;
    setBusySuggestion('task');
    try {
      const task = await createTask({
        title: `Follow up: ${email.subject}`,
        description: email.aiSummary ?? email.snippet,
        dueDate: followUpDueDate(),
        dueTime: '17:00',
        priority: email.isImportant ? 'high' : 'medium',
        isImportant: email.isImportant,
        linkedEmailId: email.id,
        createdByAI: true,
        aiSource: `Email from ${displayName(email.from)}`,
      });
      addToast({
        variant: 'success',
        title: 'Follow-up task created',
        message: task.title,
      });
    } catch {
      addToast({
        variant: 'error',
        title: "Couldn't create the task",
        message: 'Please try again.',
      });
    } finally {
      setBusySuggestion(null);
    }
  }, [email, createTask, addToast]);

  const handleAddToPack = useCallback(
    (packId: string, packTitle: string) => {
      if (!email) return;
      addItemToPack(packId, {
        type: 'email',
        title: email.subject,
        summary: email.aiSummary ?? email.snippet,
        occurredAt: email.date,
        linkedEmailId: email.id,
        metadata: { from: email.from.email, category: email.category },
        isAIGenerated: true,
      });
      setPackSheetOpen(false);
      addToast({ variant: 'success', title: 'Added to research pack', message: packTitle });
    },
    [email, addItemToPack, addToast],
  );

  const handleSuggestion = useCallback(
    (suggestion: SuggestionId) => {
      if (!email) return;
      if (suggestion === 'task') {
        void handleCreateFollowUpTask();
        return;
      }
      if (suggestion === 'pack') {
        setPackSheetOpen(true);
        return;
      }
      openCompose('reply', email.aiReplySuggestions?.[0]);
    },
    [email, handleCreateFollowUpTask, openCompose],
  );

  const handleDownload = useCallback(
    async (attachment: EmailAttachment) => {
      setDownloadingId(attachment.id);
      await sleep(700);
      setDownloadingId(null);
      addToast({
        variant: 'success',
        title: 'Download started',
        message: `${attachment.filename} · ${formatFileSize(attachment.sizeBytes)}`,
      });
    },
    [addToast],
  );

  const handleArchive = useCallback(async () => {
    if (!email) return;
    setMenuOpen(false);
    try {
      await archiveEmail(email.id);
      addToast({ variant: 'success', title: 'Archived', message: email.subject });
      navigate('/emails', { replace: true });
    } catch {
      addToast({ variant: 'error', title: "Couldn't archive email" });
    }
  }, [email, archiveEmail, addToast, navigate]);

  const handleDelete = useCallback(async () => {
    if (!email) return;
    setDeleting(true);
    try {
      await deleteEmail(email.id);
      addToast({ variant: 'success', title: 'Moved to trash', message: email.subject });
      navigate('/emails', { replace: true });
    } catch {
      addToast({ variant: 'error', title: "Couldn't delete email" });
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }, [email, deleteEmail, addToast, navigate]);

  const handleToggleImportant = useCallback(() => {
    if (!email) return;
    void markImportant(email.id, !email.isImportant);
    addToast({
      variant: 'info',
      title: email.isImportant ? 'Importance removed' : 'Marked important',
      message: email.subject,
    });
  }, [email, markImportant, addToast]);

  const handleToggleUnread = useCallback(() => {
    if (!email) return;
    const wasUnread = email.status === 'unread';
    if (wasUnread) void markRead(email.id);
    else void markUnread(email.id);
    addToast({
      variant: 'info',
      title: wasUnread ? 'Marked as read' : 'Marked as unread',
      message: email.subject,
    });
  }, [email, markRead, markUnread, addToast]);

  // ── Not found ───────────────────────────────────────────────────────────
  if (!email) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Email" showBack />
        <EmptyState
          icon={<Mail />}
          title="Email not found"
          description="This message may have been deleted, archived or never existed."
          action={{ label: 'Back to inbox', onClick: () => navigate('/emails') }}
        />
      </div>
    );
  }

  const category = CATEGORY_META[email.category];
  const waitingOn = email.waitingOn ?? null;
  const isUnread = email.status === 'unread';

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title={displayName(email.from)}
        subtitle={formatFullTimestamp(email.date)}
        showBack
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label="More actions"
            onClick={() => setMenuOpen(true)}
          >
            <MoreVertical />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <div className="flex flex-col gap-4">
          {/* ── Subject + participants ───────────────────────────────── */}
          <section className="rounded-lg border border-gray-100 bg-white p-4">
            <h1 className="text-lg font-semibold leading-snug text-gray-900">{email.subject}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Badge color={category.color} dot size="sm">
                {category.label}
              </Badge>
              {email.isImportant && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Star className="h-3 w-3 text-gray-500" fill="currentColor" aria-hidden="true" />
                  Important
                </span>
              )}
              {isUnread && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />
                  Unread
                </span>
              )}
            </div>

            <div className="mt-4 flex items-start gap-3">
              <Avatar name={displayName(email.from)} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {displayName(email.from)}
                </p>
                <p className="truncate text-xs text-gray-500">{email.from.email}</p>
                <time dateTime={email.date} className="mt-0.5 block text-xs text-gray-400">
                  {formatFullTimestamp(email.date)}
                </time>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1 border-t border-gray-100 pt-3">
              <AddressRow label="To" addresses={email.to} />
              <AddressRow label="Cc" addresses={email.cc} />
            </div>

            {waitingOn && (
              <p className="mt-3 flex items-start gap-1.5 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                  aria-hidden="true"
                />
                <span>
                  Waiting on {waitingOn.contactName ?? waitingOn.contactEmail}
                  {waitingOn.chaseDate && ` · chase ${formatShortDate(waitingOn.chaseDate)}`}
                  {waitingOn.note && <span className="block text-gray-400">{waitingOn.note}</span>}
                </span>
              </p>
            )}
          </section>

          {/* ── Busy.me suggests ─────────────────────────────────────── */}
          <Section title="Busy.me suggests">
            {email.aiSummary && (
              <p className="mb-3 text-sm leading-relaxed text-gray-600">{email.aiSummary}</p>
            )}

            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 [&>svg]:h-4 [&>svg]:w-4">
                    {suggestion.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900">
                      {suggestion.title}
                    </span>
                    <span className="block text-xs leading-relaxed text-gray-500">
                      {suggestion.description(email)}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={busySuggestion === suggestion.id}
                    onClick={() => handleSuggestion(suggestion.id)}
                  >
                    {suggestion.cta}
                  </Button>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Body ─────────────────────────────────────────────────── */}
          <section className="rounded-lg border border-gray-100 bg-white p-4">
            <div className="flex flex-col gap-3">
              {blocks.map((block, index) => (
                <BodyBlock key={`${block.kind}-${index}`} block={block} />
              ))}
            </div>
          </section>

          {/* ── Attachments ──────────────────────────────────────────── */}
          {email.attachments.length > 0 && (
            <Section title={`Attachments · ${email.attachments.length}`}>
              <ul className="flex flex-col gap-2">
                {email.attachments.map((attachment) => {
                  const { Icon, label } = attachmentVisual(
                    attachment.mimeType,
                    attachment.filename,
                  );
                  const isDownloading = downloadingId === attachment.id;

                  return (
                    <li
                      key={attachment.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {attachment.filename}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {label} · {formatFileSize(attachment.sizeBytes)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleDownload(attachment)}
                        disabled={isDownloading}
                        aria-label={`Download ${attachment.filename}`}
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                          'text-gray-500 transition-opacity active:opacity-60',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                        )}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Download className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {email.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {email.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pinned action bar ──────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-stretch gap-1 border-t border-gray-100 bg-white px-2 py-1.5">
        <ActionButton
          icon={<CornerUpLeft />}
          label="Reply"
          onClick={() => openCompose('reply')}
        />
        <ActionButton icon={<Forward />} label="Forward" onClick={() => openCompose('forward')} />
        <ActionButton icon={<Archive />} label="Archive" onClick={() => void handleArchive()} />
        <ActionButton
          icon={<Star fill={email.isImportant ? 'currentColor' : 'none'} />}
          label="Important"
          isActive={email.isImportant}
          onClick={handleToggleImportant}
        />
        <ActionButton
          icon={isUnread ? <MailOpen /> : <Mail />}
          label={isUnread ? 'Read' : 'Unread'}
          isActive={isUnread}
          onClick={handleToggleUnread}
        />
        <ActionButton
          icon={<Trash2 />}
          label="Delete"
          tone="danger"
          onClick={() => setConfirmingDelete(true)}
        />
      </div>

      {/* ── Overflow menu ──────────────────────────────────────────────── */}
      <BottomSheet open={isMenuOpen} onClose={() => setMenuOpen(false)} title="Email actions">
        <div className="pb-2">
          <MenuRow
            icon={<CornerUpLeft />}
            label="Reply all"
            description="Include everyone on the thread"
            onClick={() => openCompose('reply-all')}
          />
          <MenuRow
            icon={<Forward />}
            label="Forward"
            description="Send this message on with its attachments"
            onClick={() => openCompose('forward')}
          />
          <MenuRow
            icon={<Star />}
            label={email.isImportant ? 'Remove importance' : 'Mark as important'}
            onClick={() => {
              handleToggleImportant();
              setMenuOpen(false);
            }}
          />
          <MenuRow
            icon={isUnread ? <MailOpen /> : <Mail />}
            label={isUnread ? 'Mark as read' : 'Mark as unread'}
            onClick={() => {
              handleToggleUnread();
              setMenuOpen(false);
            }}
          />
          <MenuRow
            icon={<Layers />}
            label="Add to Research Pack"
            description="File the thread on a pack timeline"
            onClick={() => {
              setMenuOpen(false);
              setPackSheetOpen(true);
            }}
          />
          <MenuRow
            icon={<Archive />}
            label="Archive"
            onClick={() => void handleArchive()}
          />
          <MenuRow
            icon={<Trash2 />}
            label="Delete"
            tone="danger"
            onClick={() => {
              setMenuOpen(false);
              setConfirmingDelete(true);
            }}
          />
        </div>
      </BottomSheet>

      {/* ── Research pack picker ───────────────────────────────────────── */}
      <BottomSheet
        open={isPackSheetOpen}
        onClose={() => setPackSheetOpen(false)}
        title="Add to Research Pack"
      >
        {packs.length === 0 ? (
          <EmptyState
            compact
            icon={<Layers />}
            title="No research packs yet"
            description="Create a pack first and this thread can be filed on its timeline."
            action={{ label: 'Go to research packs', onClick: () => navigate('/research-packs') }}
          />
        ) : (
          <div className="pb-2">
            {packs.map((pack) => (
              <MenuRow
                key={pack.id}
                icon={<Layers />}
                label={pack.title}
                description={`${pack.timeline.length} item${
                  pack.timeline.length === 1 ? '' : 's'
                } · ${pack.status}`}
                onClick={() => handleAddToPack(pack.id, pack.title)}
              />
            ))}
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete this email?"
        description={`"${email.subject}" will be moved to trash.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />

      <ComposeEmail
        open={composeMode !== null}
        onClose={() => setComposeMode(null)}
        mode={composeMode ?? 'reply'}
        sourceEmail={email}
        initialBody={composeBody}
      />
    </div>
  );
}
