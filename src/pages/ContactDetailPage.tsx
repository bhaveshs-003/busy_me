import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Cake,
  CalendarDays,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
  UserX,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { CalendarEvent, Contact, Email, ResearchPack } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageSkeleton } from '@/components/ui/LoadingState';
import { CreateContactSheet } from '@/components/contacts/CreateContactSheet';
import { contactSubtitle, primaryEmail, primaryPhone } from '@/components/contacts/ContactCard';
import { useContactStore } from '@/store/contactStore';
import { useEmailStore } from '@/store/emailStore';
import { useEventStore } from '@/store/eventStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Helpers
// =============================================================================

/** Lower-cased set of every address on file, for matching against mail/events. */
function emailSet(contact: Contact): Set<string> {
  return new Set(contact.emails.map((e) => e.email.toLowerCase()));
}

/** Formats a `YYYY-MM-DD` birthday for display; falls through on bad input. */
function formatBirthday(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return formatDate(parsed, { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatAddress(contact: Contact): string | null {
  const parts = [
    contact.address?.street,
    contact.address?.city,
    contact.address?.country,
  ].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(', ') : null;
}

/** Strips the scheme so a long URL reads cleanly in a narrow row. */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

// =============================================================================
// Row primitives
// =============================================================================

function DetailRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 [&>svg]:h-4 [&>svg]:w-4"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block', t.label)}>{label}</span>
        <span className="mt-0.5 block break-words text-sm text-gray-900">{value}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          'flex items-center gap-3 px-3 py-2.5',
          t.divider,
          t.touchTarget,
          t.pressable,
        )}
      >
        {body}
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
      </a>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 px-3 py-2.5', t.divider, t.touchTarget)}>
      {body}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function QuickAction({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1.5 bg-white py-3',
        t.border,
        t.radius,
        t.touchTarget,
        t.focusRing,
        disabled ? 'opacity-40' : t.pressable,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 [&>svg]:h-4 [&>svg]:w-4"
      >
        {icon}
      </span>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>
  );
}

const emptyLine = 'px-3 py-4 text-sm text-gray-400';

// =============================================================================
// Page
// =============================================================================

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const contact = useContactStore((s) => s.contacts.find((c) => c.id === id));
  const isLoading = useContactStore((s) => s.isLoading);
  const error = useContactStore((s) => s.error);
  const fetchContacts = useContactStore((s) => s.fetchContacts);
  const deleteContact = useContactStore((s) => s.deleteContact);

  const emails = useEmailStore((s) => s.emails);
  const events = useEventStore((s) => s.events);
  const packs = useResearchPackStore((s) => s.packs);
  const addToast = useUIStore((s) => s.addToast);

  const [isEditOpen, setEditOpen] = useState(false);
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!contact) void fetchContacts();
  }, [contact, fetchContacts]);

  const addresses = useMemo(
    () => (contact ? emailSet(contact) : new Set<string>()),
    [contact],
  );

  // Last three messages this person sent, newest first.
  const recentEmails: Email[] = useMemo(() => {
    if (addresses.size === 0) return [];
    return emails
      .filter((email) => addresses.has(email.from.email.toLowerCase()))
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, 3);
  }, [emails, addresses]);

  // Events they're invited to that haven't started yet, soonest first.
  const upcomingEvents: CalendarEvent[] = useMemo(() => {
    if (addresses.size === 0) return [];
    const now = Date.now();
    return events
      .filter(
        (event) =>
          !event.isCancelled &&
          Date.parse(event.startAt) >= now &&
          event.attendees.some((a) => addresses.has(a.email.toLowerCase())),
      )
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
      .slice(0, 3);
  }, [events, addresses]);

  const linkedPacks: ResearchPack[] = useMemo(
    () => (contact ? packs.filter((pack) => pack.linkedContactIds.includes(contact.id)) : []),
    [packs, contact],
  );

  // ── Loading / error / not-found ────────────────────────────────────────
  if (!contact && isLoading) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Contact" showBack />
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (!contact && error) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Contact" showBack />
        <ErrorState
          title="Couldn't load this contact"
          description="We hit a problem reaching your address book."
          detail={error}
          onRetry={() => void fetchContacts()}
          isRetrying={isLoading}
        />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-full flex-col bg-gray-50">
        <PageHeader title="Contact" showBack />
        <EmptyState
          icon={<UserX />}
          title="Contact not found"
          description="This person may have been deleted, or the link is out of date."
          action={{ label: 'Back to contacts', onClick: () => navigate('/contacts') }}
        />
      </div>
    );
  }

  const subtitle = contactSubtitle(contact);
  const email = primaryEmail(contact);
  const phone = primaryPhone(contact);
  const address = formatAddress(contact);

  // Email / Call / Message are simulated — Busy.me has no dialer in this build.
  const simulate = (title: string, message: string) => {
    addToast({ variant: 'info', title, message });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteContact(contact.id);
      addToast({
        variant: 'success',
        title: 'Contact deleted',
        message: contact.displayName,
      });
      navigate('/contacts', { replace: true });
    } catch {
      addToast({ variant: 'error', title: "Couldn't delete contact" });
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Contact"
        showBack
        rightActions={
          <Button
            iconOnly
            variant="ghost"
            aria-label="Edit contact"
            onClick={() => setEditOpen(true)}
          >
            <Pencil />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
        <div className="flex flex-col gap-6">
          {/* ── Identity ──────────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center">
            <Avatar src={contact.avatarUrl} name={contact.displayName} size="lg" />
            <h1 className="mt-3 text-lg font-semibold text-gray-900">
              {contact.displayName}
            </h1>
            {subtitle && <p className={cn('mt-0.5', t.body)}>{subtitle}</p>}
            {contact.lastContactedAt && (
              <p className={cn('mt-1', t.meta)}>
                Last contacted {formatRelativeTime(contact.lastContactedAt)}
              </p>
            )}
          </div>

          {/* ── Quick actions ─────────────────────────────────────────── */}
          <div className="flex gap-2">
            <QuickAction
              icon={<Mail />}
              label="Email"
              disabled={!email}
              onClick={() =>
                simulate('Opening composer', `A draft to ${email} would open here.`)
              }
            />
            <QuickAction
              icon={<Phone />}
              label="Call"
              disabled={!phone}
              onClick={() => simulate('Calling', `Dialling ${phone} on this device.`)}
            />
            <QuickAction
              icon={<MessageSquare />}
              label="Message"
              disabled={!phone}
              onClick={() => simulate('Opening messages', `A new thread to ${phone}.`)}
            />
          </div>

          {/* ── Details ───────────────────────────────────────────────── */}
          <Section title="Details">
            <div className={cn('overflow-hidden bg-white', t.border, t.radius)}>
              {email && (
                <DetailRow
                  icon={<Mail />}
                  label="Email"
                  value={email}
                  href={`mailto:${email}`}
                />
              )}
              {phone && (
                <DetailRow
                  icon={<Phone />}
                  label="Phone"
                  value={phone}
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                />
              )}
              {contact.jobTitle && (
                <DetailRow icon={<Briefcase />} label="Job title" value={contact.jobTitle} />
              )}
              {contact.company && (
                <DetailRow icon={<Building2 />} label="Company" value={contact.company} />
              )}
              {contact.websiteUrl && (
                <DetailRow
                  icon={<Globe />}
                  label="Website"
                  value={prettyUrl(contact.websiteUrl)}
                  href={contact.websiteUrl}
                />
              )}
              {contact.birthday && (
                <DetailRow
                  icon={<Cake />}
                  label="Birthday"
                  value={formatBirthday(contact.birthday)}
                />
              )}
              {address && <DetailRow icon={<MapPin />} label="Address" value={address} />}
              {contact.notes && (
                <DetailRow icon={<StickyNote />} label="Notes" value={contact.notes} />
              )}

              {!email && !phone && !contact.jobTitle && !contact.company &&
                !contact.websiteUrl && !contact.birthday && !address && !contact.notes && (
                  <p className={emptyLine}>
                    Nothing on file yet — tap edit to fill in their details.
                  </p>
                )}
            </div>
          </Section>

          {/* ── Recent emails ─────────────────────────────────────────── */}
          <Section title="Recent emails">
            <div className={cn('overflow-hidden bg-white', t.border, t.radius)}>
              {recentEmails.length === 0 ? (
                <p className={emptyLine}>
                  No messages from {contact.firstName || contact.displayName} yet.
                </p>
              ) : (
                recentEmails.map((mail) => (
                  <Link
                    key={mail.id}
                    to={`/emails/${mail.id}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3',
                      t.divider,
                      t.touchTarget,
                      t.pressable,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                    >
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {mail.subject}
                      </span>
                      <span className={cn('mt-0.5 block truncate', t.meta)}>
                        {formatRelativeTime(mail.date)} · {mail.snippet}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
                  </Link>
                ))
              )}
            </div>
          </Section>

          {/* ── Upcoming events ───────────────────────────────────────── */}
          <Section title="Upcoming events">
            <div className={cn('overflow-hidden bg-white', t.border, t.radius)}>
              {upcomingEvents.length === 0 ? (
                <p className={emptyLine}>
                  Nothing scheduled with {contact.firstName || contact.displayName}.
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3',
                      t.divider,
                      t.touchTarget,
                      t.pressable,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {event.title}
                      </span>
                      <span className={cn('mt-0.5 block truncate', t.meta)}>
                        {formatDate(event.startAt, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
                  </Link>
                ))
              )}
            </div>
          </Section>

          {/* ── Research packs ────────────────────────────────────────── */}
          <Section title="Research packs">
            <div className={cn('overflow-hidden bg-white', t.border, t.radius)}>
              {linkedPacks.length === 0 ? (
                <p className={emptyLine}>
                  Not referenced by any research pack yet.
                </p>
              ) : (
                linkedPacks.map((pack) => (
                  <Link
                    key={pack.id}
                    to={`/research-packs/${pack.id}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3',
                      t.divider,
                      t.touchTarget,
                      t.pressable,
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {pack.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            pack.status === 'active'
                              ? t.statusDot.success
                              : t.statusDot.neutral,
                          )}
                        />
                        <span className={cn('capitalize', t.meta)}>{pack.status}</span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
                  </Link>
                ))
              )}
            </div>
          </Section>

          {/* ── Destructive ───────────────────────────────────────────── */}
          <Button
            variant="outline"
            fullWidth
            leftIcon={<Trash2 />}
            onClick={() => setConfirmingDelete(true)}
            className="text-red-600"
          >
            Delete contact
          </Button>
        </div>
      </div>

      <CreateContactSheet
        open={isEditOpen}
        contact={contact}
        onClose={() => setEditOpen(false)}
      />

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete this contact?"
        description={`${contact.displayName} will be removed from your address book. This cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
