import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import type { Email } from '@/types/index';
import { EmailCard } from '@/components/email/EmailCard';
import { EmptyState } from '@/components/ui/EmptyState';

// =============================================================================
// PackEmails — the emails linked to a research pack
// =============================================================================

export interface PackEmailsProps {
  emails: Email[];
}

export function PackEmails({ emails }: PackEmailsProps) {
  const navigate = useNavigate();

  if (emails.length === 0) {
    return (
      <EmptyState
        icon={<Mail />}
        title="No emails linked"
        description="Link a thread from the Emails screen, or ask Busy.me to pull related mail into this pack."
        action={{ label: 'Browse emails', onClick: () => navigate('/emails') }}
      />
    );
  }

  // Newest first, matching the main inbox ordering.
  const ordered = [...emails].sort(
    (a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt),
  );

  return (
    <ul className="divide-y divide-gray-100">
      {ordered.map((email) => (
        <li key={email.id}>
          <EmailCard email={email} />
        </li>
      ))}
    </ul>
  );
}

export default PackEmails;
