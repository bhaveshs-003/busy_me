import { useEffect, useMemo, useState } from 'react';
import { DownloadCloud, Plus, SearchX, Users } from 'lucide-react';
import type { Contact } from '@/types/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterItem } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/LoadingState';
import { ContactCard } from '@/components/contacts/ContactCard';
import { CreateContactSheet } from '@/components/contacts/CreateContactSheet';
import { ImportContactsSheet } from '@/components/contacts/ImportContactsSheet';
import { useContactStore } from '@/store/contactStore';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Filters
// =============================================================================

type ContactView = 'all' | 'recent' | 'company';

/** A contact counts as "recent" if it was contacted inside this window. */
const RECENT_WINDOW_DAYS = 30;

function isRecent(contact: Contact, now: number): boolean {
  if (!contact.lastContactedAt) return false;
  const last = Date.parse(contact.lastContactedAt);
  if (Number.isNaN(last)) return false;
  return now - last <= RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function matchesView(contact: Contact, view: ContactView, now: number): boolean {
  switch (view) {
    case 'recent':
      return isRecent(contact, now);
    case 'company':
      return Boolean(contact.company);
    case 'all':
    default:
      return true;
  }
}

/** Case-insensitive match across the fields a person would actually search by. */
function matchesQuery(contact: Contact, query: string): boolean {
  if (!query) return true;
  const haystack = [
    contact.displayName,
    contact.company,
    contact.jobTitle,
    ...contact.emails.map((e) => e.email),
    ...contact.phones.map((p) => p.number),
    ...contact.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

// =============================================================================
// Grouping
// =============================================================================

interface ContactGroup {
  key: string;
  label: string;
  contacts: Contact[];
}

/** Section header for a name — the first letter, or `#` for anything else. */
function letterFor(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

/**
 * Alphabetical sections. The `company` view sections by employer instead of by
 * initial — the headers stay A→Z either way.
 */
function groupContacts(contacts: Contact[], view: ContactView): ContactGroup[] {
  const buckets = new Map<string, Contact[]>();

  for (const contact of contacts) {
    const label = view === 'company' ? (contact.company ?? 'Other') : letterFor(contact.displayName);
    const bucket = buckets.get(label);
    if (bucket) bucket.push(contact);
    else buckets.set(label, [contact]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, groupContactsList]) => ({
      key: label,
      label,
      contacts: [...groupContactsList].sort((a, b) =>
        a.displayName.localeCompare(b.displayName),
      ),
    }));
}

// =============================================================================
// Empty copy
// =============================================================================

const EMPTY_COPY: Record<ContactView, { title: string; description: string }> = {
  all: {
    title: 'No contacts yet',
    description:
      'Add someone by hand, or pull in everyone already stored on this device.',
  },
  recent: {
    title: 'No recent contacts',
    description: `Nobody you've emailed or met in the last ${RECENT_WINDOW_DAYS} days. Switch to All to see everyone.`,
  },
  company: {
    title: 'No company on file',
    description:
      'None of your contacts have a company yet. Add one while editing a contact.',
  },
};

// =============================================================================
// Page
// =============================================================================

export default function ContactListPage() {
  const contacts = useContactStore((s) => s.contacts);
  const isLoading = useContactStore((s) => s.isLoading);
  const error = useContactStore((s) => s.error);
  const fetchContacts = useContactStore((s) => s.fetchContacts);
  const searchQuery = useContactStore((s) => s.searchQuery);
  const setSearchQuery = useContactStore((s) => s.setSearchQuery);

  const [view, setView] = useState<ContactView>('all');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  // Captured once per render pass so every contact is bucketed against the
  // same instant.
  const now = useMemo(() => Date.now(), []);
  const normalisedQuery = searchQuery.trim().toLowerCase();

  const counts = useMemo(
    () => ({
      all: contacts.length,
      recent: contacts.filter((c) => isRecent(c, now)).length,
      company: contacts.filter((c) => Boolean(c.company)).length,
    }),
    [contacts, now],
  );

  const filterItems: FilterItem[] = useMemo(
    () => [
      { id: 'all', label: 'All', count: counts.all },
      { id: 'recent', label: 'Recent', count: counts.recent },
      { id: 'company', label: 'Company', count: counts.company },
    ],
    [counts],
  );

  const visibleContacts = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          matchesView(contact, view, now) && matchesQuery(contact, normalisedQuery),
      ),
    [contacts, view, now, normalisedQuery],
  );

  const groups = useMemo(
    () => groupContacts(visibleContacts, view),
    [visibleContacts, view],
  );

  const showSkeleton = isLoading && contacts.length === 0;
  const showError = Boolean(error) && !showSkeleton && contacts.length === 0;
  const isEmpty = !showSkeleton && !showError && visibleContacts.length === 0;
  const isSearchEmpty = isEmpty && normalisedQuery.length > 0;

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PageHeader
        title="Contacts"
        subtitle={`${counts.all} people · ${counts.recent} recent`}
        rightActions={
          <>
            <Button
              iconOnly
              variant="ghost"
              aria-label="Import contacts"
              onClick={() => setImportOpen(true)}
            >
              <DownloadCloud />
            </Button>
            <Button
              iconOnly
              variant="ghost"
              aria-label="New contact"
              onClick={() => setCreateOpen(true)}
            >
              <Plus />
            </Button>
          </>
        }
      />

      {/* ── Search + filters ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 pb-3 pt-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search name, company, email…"
          aria-label="Search contacts"
        />
        <FilterBar
          className="mt-2"
          aria-label="Contact filters"
          filters={filterItems}
          active={view}
          onChange={(id) => setView(id as ContactView)}
        />
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {showSkeleton && <ListSkeleton count={8} />}

        {showError && (
          <ErrorState
            title="Couldn't load contacts"
            description="We hit a problem reaching your address book."
            detail={error ?? undefined}
            onRetry={() => void fetchContacts()}
            isRetrying={isLoading}
          />
        )}

        {isEmpty &&
          (isSearchEmpty ? (
            <EmptyState
              icon={<SearchX />}
              title="No matches"
              description={`Nothing matches "${searchQuery.trim()}". Try a different name, company or email.`}
              action={{ label: 'Clear search', onClick: () => setSearchQuery('') }}
            />
          ) : (
            <EmptyState
              icon={<Users />}
              title={EMPTY_COPY[view].title}
              description={EMPTY_COPY[view].description}
              action={{ label: 'Add contact', onClick: () => setCreateOpen(true) }}
              secondaryAction={
                view === 'all'
                  ? { label: 'Import from device', onClick: () => setImportOpen(true) }
                  : { label: 'Show all contacts', onClick: () => setView('all') }
              }
            />
          ))}

        {groups.map((group) => (
          <section key={group.key} className="mb-4">
            <h2
              className={cn(
                'sticky top-0 z-10 -mx-1 mb-2 bg-gray-50/90 px-1 py-1.5 backdrop-blur-sm',
                'text-xs font-semibold uppercase tracking-wide text-gray-500',
              )}
            >
              {group.label}
              <span className="ml-1.5 font-normal tabular-nums text-gray-400">
                {group.contacts.length}
              </span>
            </h2>

            <div className={t.listGap}>
              {group.contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <CreateContactSheet open={isCreateOpen} onClose={() => setCreateOpen(false)} />
      <ImportContactsSheet open={isImportOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
