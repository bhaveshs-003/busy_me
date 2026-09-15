import { Check, Lock } from 'lucide-react';
import type { ConnectorType } from '@/types/index';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// OAuthConsentModal — simulated provider consent screen
//
// This is a MOCK. It never contacts a provider, never opens a popup and never
// issues a network request of any kind: pressing Allow simply resolves the
// connector store's pending flow. The screen is dressed like a real consent
// page so the demo reads convincingly, with an explicit "simulated" note so it
// can never be mistaken for the real thing.
// =============================================================================

interface ProviderConsentCopy {
  /** Greyscale wordmark shown at the top of the sheet. */
  wordmark: string;
  /** Host shown in the simulated address bar. */
  host: string;
  /** "Busy.me wants to access your <accountNoun>". */
  accountNoun: string;
  scopes: { label: string; description: string }[];
}

const CONSENT_COPY: Record<ConnectorType, ProviderConsentCopy> = {
  gmail: {
    wordmark: 'Google',
    host: 'accounts.google.com',
    accountNoun: 'Google Account',
    scopes: [
      { label: 'Read your email', description: 'View messages, threads and attachments in Gmail' },
      { label: 'Manage labels', description: 'Create, apply and remove Gmail labels on your behalf' },
      { label: 'Read calendar events', description: 'See events so replies can suggest times that work' },
    ],
  },
  'google-calendar': {
    wordmark: 'Google',
    host: 'accounts.google.com',
    accountNoun: 'Google Account',
    scopes: [
      { label: 'Read calendar events', description: 'View events across all of your calendars' },
      { label: 'Manage events', description: 'Create, move and cancel events on your behalf' },
      { label: 'Read your email', description: 'Match invitations in Gmail to the right event' },
    ],
  },
  outlook: {
    wordmark: 'Microsoft',
    host: 'login.microsoftonline.com',
    accountNoun: 'Microsoft Account',
    scopes: [
      { label: 'Read your email', description: 'View messages and attachments in your mailbox' },
      { label: 'Manage labels', description: 'Create and apply folders and categories' },
      { label: 'Read calendar events', description: 'See events on your Outlook calendar' },
    ],
  },
  slack: {
    wordmark: 'Slack',
    host: 'techcorp.slack.com',
    accountNoun: 'Slack workspace',
    scopes: [
      { label: 'Read channel messages', description: 'View messages in channels you belong to' },
      { label: 'Send messages', description: 'Post replies and reminders as Busy.me' },
      { label: 'Read workspace members', description: 'Match people in Slack to your contacts' },
    ],
  },
};

export interface OAuthConsentModalProps {
  open: boolean;
  /** Provider being authorised — drives the wordmark and scope copy. */
  type: ConnectorType;
  /** Account the simulated provider is signed in as. */
  accountEmail: string;
  accountName: string;
  /** Disables both buttons and spins Allow while the flow resolves. */
  isSubmitting?: boolean;
  onAllow: () => void;
  onCancel: () => void;
}

export function OAuthConsentModal({
  open,
  type,
  accountEmail,
  accountName,
  isSubmitting = false,
  onAllow,
  onCancel,
}: OAuthConsentModalProps) {
  const copy = CONSENT_COPY[type];

  return (
    <Modal open={open} onClose={onCancel} variant="small" showCloseButton={false}>
      {/* Simulated browser chrome */}
      <div
        className={cn(
          'flex items-center gap-2 border-b bg-gray-50 px-4 py-2.5',
          t.hairline,
        )}
      >
        <Lock className="h-3 w-3 flex-shrink-0 text-gray-400" aria-hidden="true" />
        <span className="flex-1 truncate text-[11px] text-gray-500">{copy.host}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          Simulated
        </span>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
        <p className="text-center text-lg font-semibold tracking-tight text-gray-900">
          {copy.wordmark}
        </p>

        <h2 className="mt-3 text-center text-[15px] font-semibold leading-snug text-gray-900">
          Busy.me wants to access your {copy.accountNoun}
        </h2>

        {/* Signed-in account */}
        <div
          className={cn(
            'mt-4 flex items-center gap-3 px-3 py-2.5',
            t.border,
            t.radius,
          )}
        >
          <Avatar name={accountName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{accountName}</p>
            <p className={cn('truncate', t.meta)}>{accountEmail}</p>
          </div>
        </div>

        {/* Scopes */}
        <p className={cn('mt-5', t.label)}>
          This will allow Busy.me to:
        </p>
        <ul className="mt-2 space-y-3">
          {copy.scopes.map((scope) => (
            <li key={scope.label} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
              >
                <Check className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{scope.label}</p>
                <p className={cn('leading-relaxed', t.meta)}>{scope.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-[11px] leading-relaxed text-gray-400">
          Demo only — this consent screen is simulated. No {copy.wordmark} account is
          contacted, no request leaves this device and no real data is shared.
        </p>
      </div>

      <div className={cn('flex gap-3 border-t px-5 py-4', t.hairline)}>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onAllow}
          isLoading={isSubmitting}
          className="flex-1"
        >
          Allow
        </Button>
      </div>
    </Modal>
  );
}

export default OAuthConsentModal;
