import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import type { Contact } from '@/types/index';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// Helpers
// =============================================================================

/** Primary email, falling back to the first one on file. */
export function primaryEmail(contact: Contact): string | null {
  const entry = contact.emails.find((e) => e.isPrimary) ?? contact.emails[0];
  return entry?.email ?? null;
}

/** Primary phone, falling back to the first one on file. */
export function primaryPhone(contact: Contact): string | null {
  const entry = contact.phones.find((p) => p.isPrimary) ?? contact.phones[0];
  return entry?.number ?? null;
}

/** "Head of Design · Acme Corp", collapsing gracefully when either is missing. */
export function contactSubtitle(contact: Contact): string | null {
  const parts = [contact.jobTitle, contact.company].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' · ') : null;
}

// =============================================================================
// ContactCard
// =============================================================================

export interface ContactCardProps {
  contact: Contact;
  /** Overrides the default navigation to the contact detail page. */
  onClick?: (contact: Contact) => void;
  className?: string;
}

export function ContactCard({ contact, onClick, className }: ContactCardProps) {
  const subtitle = contactSubtitle(contact);
  const email = primaryEmail(contact);

  const content = (
    <>
      {/* Initials avatar — colour is derived from a hash of the name. */}
      <Avatar src={contact.avatarUrl} name={contact.displayName} size="md" />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={cn(t.title, 'truncate')}>{contact.displayName}</span>
          {contact.isFavorite && (
            <Star
              className="h-3.5 w-3.5 shrink-0 fill-gray-400 text-gray-400"
              aria-label="Favourite"
            />
          )}
        </span>

        {subtitle && (
          <span className={cn('mt-0.5 block truncate', t.body)}>{subtitle}</span>
        )}

        {email && (
          <span className={cn('mt-0.5 block truncate', t.meta)}>{email}</span>
        )}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
    </>
  );

  const rowClass = cn(
    'flex w-full items-center gap-3 bg-white px-3 py-3 text-left',
    t.border,
    t.radius,
    t.touchTarget,
    t.pressable,
    t.focusRing,
    className,
  );

  if (onClick) {
    return (
      <button type="button" className={rowClass} onClick={() => onClick(contact)}>
        {content}
      </button>
    );
  }

  return (
    <Link to={`/contacts/${contact.id}`} className={rowClass}>
      {content}
    </Link>
  );
}

export default ContactCard;
