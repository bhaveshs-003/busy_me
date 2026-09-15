import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import {
  AlertCircle,
  Check,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useContactStore } from '@/store/contactStore';
import { useEmailStore } from '@/store/emailStore';
import { useUIStore } from '@/store/uiStore';
import { mailboxOwner } from '@/data/emailSeed';
import { cn, formatFileSize, generateId, sleep } from '@/lib/utils';
import type {
  Email,
  EmailAddress,
  EmailAttachment,
  EmailDraft,
} from '@/types/index';
import {
  attachmentVisual,
  dedupeAddresses,
  displayName,
  forwardSubject,
  isValidEmail,
  parseAddress,
  quotedBody,
  rephraseVariants,
  replySubject,
  sameAddress,
  type RephraseVariant,
} from './emailUtils';

// =============================================================================
// ComposeEmail — new / reply / reply-all / forward composer
// =============================================================================

export type ComposeMode = 'new' | 'reply' | 'reply-all' | 'forward';

export interface ComposeEmailProps {
  open: boolean;
  onClose: () => void;
  /** Defaults to a blank message. */
  mode?: ComposeMode;
  /** Source thread for reply / reply-all / forward. */
  sourceEmail?: Email | null;
  /** Pre-filled recipients on a new message. */
  initialTo?: EmailAddress[];
  initialSubject?: string;
  /** Pre-filled body — used by the detail screen's reply suggestions. */
  initialBody?: string;
  /** Continue an existing draft. */
  draft?: EmailDraft | null;
  /** Fired after a successful send with the stored sent email. */
  onSent?: (email: Email) => void;
}

/** Minimum time the sending state stays visible, so it reads as deliberate. */
const SEND_FEEDBACK_MS = 800;

interface ComposeState {
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  isImportant: boolean;
}

const EMPTY_STATE: ComposeState = {
  to: [],
  cc: [],
  bcc: [],
  subject: '',
  body: '',
  attachments: [],
  isImportant: false,
};

type FieldErrors = Partial<Record<'to' | 'subject' | 'body', string>>;

// ---------------------------------------------------------------------------
// Initial state derivation
// ---------------------------------------------------------------------------

function buildInitialState({
  mode,
  sourceEmail,
  initialTo,
  initialSubject,
  initialBody,
  draft,
}: Pick<
  ComposeEmailProps,
  'mode' | 'sourceEmail' | 'initialTo' | 'initialSubject' | 'initialBody' | 'draft'
>): ComposeState {
  if (draft) {
    return {
      ...EMPTY_STATE,
      to: draft.to,
      cc: draft.cc,
      bcc: draft.bcc,
      subject: draft.subject,
      body: draft.bodyText,
      attachments: draft.attachments,
      isImportant: draft.isImportant ?? false,
    };
  }

  if (sourceEmail && (mode === 'reply' || mode === 'reply-all')) {
    const others =
      mode === 'reply-all'
        ? dedupeAddresses([...sourceEmail.to, ...sourceEmail.cc]).filter(
            (a) => !sameAddress(a, mailboxOwner) && !sameAddress(a, sourceEmail.from),
          )
        : [];

    return {
      ...EMPTY_STATE,
      to: [sourceEmail.replyTo ?? sourceEmail.from],
      cc: others,
      subject: replySubject(sourceEmail.subject),
      body: `${initialBody ?? ''}\n${quotedBody(sourceEmail, 'reply')}`,
    };
  }

  if (sourceEmail && mode === 'forward') {
    return {
      ...EMPTY_STATE,
      to: initialTo ?? [],
      subject: forwardSubject(sourceEmail.subject),
      body: `${initialBody ?? ''}\n${quotedBody(sourceEmail, 'forward')}`,
      attachments: sourceEmail.attachments,
    };
  }

  return {
    ...EMPTY_STATE,
    to: initialTo ?? [],
    subject: initialSubject ?? '',
    body: initialBody ?? '',
  };
}

// ---------------------------------------------------------------------------
// RecipientField — chips + autocomplete
// ---------------------------------------------------------------------------

interface Suggestion {
  address: EmailAddress;
  subtitle: string;
}

interface RecipientFieldProps {
  label: string;
  value: EmailAddress[];
  onChange: (next: EmailAddress[]) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
  /** Rendered at the right edge of the field row (e.g. the Cc / Bcc toggles). */
  trailing?: ReactNode;
}

function RecipientField({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  error,
  autoFocus,
  trailing,
}: RecipientFieldProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const chosen = new Set(value.map((a) => a.email.toLowerCase()));
    return suggestions
      .filter((s) => !chosen.has(s.address.email.toLowerCase()))
      .filter(
        (s) =>
          !q ||
          s.address.email.toLowerCase().includes(q) ||
          (s.address.name ?? '').toLowerCase().includes(q) ||
          s.subtitle.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, suggestions, value]);

  const commit = useCallback(
    (address: EmailAddress) => {
      if (!value.some((a) => sameAddress(a, address))) onChange([...value, address]);
      setQuery('');
      setHighlight(0);
      inputRef.current?.focus();
    },
    [onChange, value],
  );

  const commitTyped = useCallback(() => {
    const parsed = parseAddress(query);
    if (parsed) {
      commit(parsed);
      return true;
    }
    return false;
  }, [commit, query]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const open = isFocused && matches.length > 0;

    if (event.key === 'ArrowDown' && open) {
      event.preventDefault();
      setHighlight((h) => (h + 1) % matches.length);
      return;
    }
    if (event.key === 'ArrowUp' && open) {
      event.preventDefault();
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab' || event.key === ',' || event.key === ';') {
      if (!query.trim() && event.key !== 'Enter') return;
      if (open && query.trim() && matches[highlight] && !isValidEmail(query.trim())) {
        event.preventDefault();
        commit(matches[highlight].address);
        return;
      }
      if (query.trim()) {
        event.preventDefault();
        commitTyped();
      }
      return;
    }
    if (event.key === 'Backspace' && !query && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const showMenu = isFocused && matches.length > 0;

  return (
    <div className="relative border-b border-gray-100">
      <div className="flex items-start gap-2 px-4 py-2">
        <span className="w-16 shrink-0 pt-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {value.map((address) => (
            <span
              key={address.email}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-1.5 text-xs font-medium text-gray-700"
            >
              <Avatar name={displayName(address)} size="xs" />
              <span className="truncate">{displayName(address)}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((a) => !sameAddress(a, address)))}
                aria-label={`Remove ${address.email}`}
                className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlight(0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay so a click on a suggestion still registers.
              blurTimer.current = setTimeout(() => {
                setIsFocused(false);
                commitTyped();
              }, 120);
            }}
            placeholder={value.length === 0 ? placeholder : ''}
            autoComplete="off"
            aria-label={label}
            className="min-w-[8rem] flex-1 border-0 bg-transparent py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>

        {trailing && <div className="flex shrink-0 items-center gap-1 pt-1">{trailing}</div>}
      </div>

      {error && (
        <p className="flex items-center gap-1 px-4 pb-1.5 pl-[5rem] text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {showMenu && (
        <ul
          role="listbox"
          aria-label={`${label} suggestions`}
          /* left-20 = the w-16 label gutter plus the row's px-4 padding, so the
             menu lines up with the input rather than the label. */
          className="absolute left-20 right-4 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-100 bg-white py-1"
        >
          {matches.map((match, index) => (
            <li key={match.address.email}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  commit(match.address);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
                  index === highlight ? 'bg-orange-50' : 'hover:bg-gray-50',
                )}
              >
                <Avatar name={displayName(match.address)} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">
                    {displayName(match.address)}
                  </span>
                  <span className="block truncate text-xs text-gray-500">
                    {match.address.email}
                    {match.subtitle && ` · ${match.subtitle}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  icon: ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  tone?: 'orange' | 'amber' | 'blue';
  children?: ReactNode;
}

const TOGGLE_TONES = {
  orange: 'peer-checked:bg-orange-500',
  amber: 'peer-checked:bg-amber-500',
  blue: 'peer-checked:bg-blue-500',
} as const;

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  tone = 'orange',
  children,
}: ToggleRowProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white">
      <label className="flex cursor-pointer items-center gap-3 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-900">{label}</span>
          {description && (
            <span className="block truncate text-xs text-gray-500">{description}</span>
          )}
        </span>
        <span className="relative inline-flex shrink-0">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span
            className={cn(
              'block h-6 w-10 rounded-full bg-gray-200 transition-colors',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500 peer-focus-visible:ring-offset-1',
              TOGGLE_TONES[tone],
            )}
          />
          <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
        </span>
      </label>

      {checked && children && (
        <div className="border-t border-gray-100 p-3 pt-2.5">{children}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComposeEmail
// ---------------------------------------------------------------------------

export function ComposeEmail({
  open,
  onClose,
  mode = 'new',
  sourceEmail = null,
  initialTo,
  initialSubject,
  initialBody,
  draft = null,
  onSent,
}: ComposeEmailProps) {
  const contacts = useContactStore((s) => s.contacts);
  const sendEmail = useEmailStore((s) => s.sendEmail);
  const addToast = useUIStore((s) => s.addToast);

  const [state, setState] = useState<ComposeState>(EMPTY_STATE);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [variants, setVariants] = useState<RephraseVariant[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);

  // Re-seed the form each time the sheet opens.
  useEffect(() => {
    if (open && !wasOpen.current) {
      const next = buildInitialState({
        mode,
        sourceEmail,
        initialTo,
        initialSubject,
        initialBody,
        draft,
      });
      setState(next);
      setShowCc(next.cc.length > 0);
      setShowBcc(next.bcc.length > 0);
      setErrors({});
      setVariants(null);
      setIsRephrasing(false);
      setIsSending(false);
    }
    wasOpen.current = open;
  }, [open, mode, sourceEmail, initialTo, initialSubject, initialBody, draft]);

  const patch = useCallback((next: Partial<ComposeState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  // ── Contact suggestions ─────────────────────────────────────────────────
  const suggestions = useMemo<Suggestion[]>(() => {
    const rows: Suggestion[] = [];
    for (const contact of contacts) {
      for (const entry of contact.emails) {
        rows.push({
          address: { name: contact.displayName, email: entry.email },
          subtitle: [contact.jobTitle, contact.company].filter(Boolean).join(', '),
        });
      }
    }
    return rows;
  }, [contacts]);

  /** Everyone on the message — the pool the "waiting on" picker draws from. */
  const recipientPool = useMemo(
    () => dedupeAddresses([...state.to, ...state.cc, ...state.bcc]),
    [state.to, state.cc, state.bcc],
  );


  // ── Attachments ─────────────────────────────────────────────────────────
  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const added: EmailAttachment[] = files.map((file) => ({
      id: `att-${generateId().slice(0, 8)}`,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      isInline: false,
    }));

    patch({ attachments: [...state.attachments, ...added] });
    event.target.value = '';
  };

  // ── Busy AI rephrase ────────────────────────────────────────────────────
  const runRephrase = async () => {
    if (!state.body.trim() || isRephrasing) return;
    setIsRephrasing(true);
    setVariants(null);
    await sleep(900);
    setVariants(rephraseVariants(state.body, state.to[0] ? displayName(state.to[0]) : undefined));
    setIsRephrasing(false);
  };

  const applyVariant = (variant: RephraseVariant) => {
    patch({ body: variant.text });
    setVariants(null);
    addToast({ variant: 'info', title: `Rewritten — ${variant.label.toLowerCase()} tone` });
  };

  // ── Validation + send ───────────────────────────────────────────────────
  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (state.to.length === 0) next.to = 'Add at least one recipient.';
    if (!state.subject.trim()) next.subject = 'Add a subject so the thread stays findable.';
    if (!state.body.trim()) next.body = 'Write a message before sending.';


    return next;
  };

  const handleSend = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;




    const payload: Partial<EmailDraft> = {
      id: draft?.id,
      subject: state.subject.trim(),
      bodyText: state.body,
      bodyHtml: '',
      to: state.to,
      cc: state.cc,
      bcc: state.bcc,
      attachments: state.attachments,
      inReplyToId: mode === 'reply' || mode === 'reply-all' ? sourceEmail?.id : undefined,
      forwardOfId: mode === 'forward' ? sourceEmail?.id : undefined,
      isImportant: state.isImportant,
    };

    setIsSending(true);
    try {
      const [sent] = await Promise.all([sendEmail(payload), sleep(SEND_FEEDBACK_MS)]);

      addToast({
        variant: 'success',
        title: 'Email sent',
        message: `Delivered to ${displayName(state.to[0])}${
              state.to.length > 1 ? ` and ${state.to.length - 1} other${state.to.length > 2 ? 's' : ''}` : ''
            }.`,
      });

      onSent?.(sent);
      setState(EMPTY_STATE);
      onClose();
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Could not send email',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const title =
    mode === 'reply' || mode === 'reply-all'
      ? 'Reply'
      : mode === 'forward'
        ? 'Forward'
        : 'New email';

  // ── Body ────────────────────────────────────────────────────────────────
  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* From */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2">
          <span className="w-16 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">
            From
          </span>
          <Avatar name={displayName(mailboxOwner)} size="xs" />
          <span className="min-w-0 truncate text-sm text-gray-700">
            {displayName(mailboxOwner)}{' '}
            <span className="text-gray-400">&lt;{mailboxOwner.email}&gt;</span>
          </span>
        </div>

        <RecipientField
          label="To"
          value={state.to}
          onChange={(to) => patch({ to })}
          suggestions={suggestions}
          placeholder="Start typing a name or email"
          error={errors.to}
          autoFocus={mode === 'new' || mode === 'forward'}
          trailing={
            <>
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="rounded-md px-1.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="rounded-md px-1.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  Bcc
                </button>
              )}
            </>
          }
        />

        {showCc && (
          <RecipientField
            label="Cc"
            value={state.cc}
            onChange={(cc) => patch({ cc })}
            suggestions={suggestions}
            placeholder="Carbon copy"
            trailing={
              <button
                type="button"
                onClick={() => {
                  setShowCc(false);
                  patch({ cc: [] });
                }}
                aria-label="Hide Cc"
                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            }
          />
        )}

        {showBcc && (
          <RecipientField
            label="Bcc"
            value={state.bcc}
            onChange={(bcc) => patch({ bcc })}
            suggestions={suggestions}
            placeholder="Blind carbon copy"
            trailing={
              <button
                type="button"
                onClick={() => {
                  setShowBcc(false);
                  patch({ bcc: [] });
                }}
                aria-label="Hide Bcc"
                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            }
          />
        )}

        {/* Subject */}
        <div className="border-b border-gray-100">
          <div className="flex items-center gap-2 px-4 py-2">
            <label
              htmlFor="compose-subject"
              className="w-16 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400"
            >
              Subject
            </label>
            <input
              id="compose-subject"
              type="text"
              value={state.subject}
              onChange={(event) => patch({ subject: event.target.value })}
              placeholder="Subject"
              className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
          {errors.subject && (
            <p className="flex items-center gap-1 px-4 pb-1.5 pl-[5rem] text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors.subject}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-4 pt-3">
          <textarea
            value={state.body}
            onChange={(event) => patch({ body: event.target.value })}
            placeholder="Write your message…"
            rows={8}
            className={cn(
              'w-full resize-none rounded-lg border bg-white p-3 text-sm leading-relaxed text-gray-900',
              'placeholder-gray-400 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-orange-500/40',
              errors.body
                ? 'border-red-300 focus:border-red-400'
                : 'border-gray-100 focus:border-orange-500',
            )}
          />
          {errors.body && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors.body}
            </p>
          )}

          {/* Busy AI rephrase */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runRephrase}
              disabled={!state.body.trim()}
              isLoading={isRephrasing}
              leftIcon={<Sparkles />}
              className="border-orange-200 text-orange-700 hover:border-orange-300 hover:bg-orange-50"
            >
              Rephrase with Busy AI
            </Button>
            {isRephrasing && (
              <span className="text-xs text-gray-400">Drafting three variants…</span>
            )}
          </div>

          {variants && (
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Busy AI suggests three rewrites
                </p>
                <button
                  type="button"
                  onClick={() => setVariants(null)}
                  aria-label="Dismiss rewrites"
                  className="rounded-md p-1 text-orange-500 transition-colors hover:bg-orange-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="rounded-lg border border-orange-100 bg-white p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{variant.label}</p>
                        <p className="text-[11px] text-gray-500">{variant.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Check />}
                        onClick={() => applyVariant(variant)}
                      >
                        Use
                      </Button>
                    </div>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-gray-600">
                      {variant.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="px-4 pt-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFiles}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />

          {state.attachments.length > 0 && (
            <ul className="mb-2 flex flex-col gap-1.5">
              {state.attachments.map((attachment) => {
                const { Icon, tone } = attachmentVisual(attachment.mimeType, attachment.filename);
                return (
                  <li
                    key={attachment.id}
                    className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white p-2"
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                        tone,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-gray-900">
                        {attachment.filename}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        {formatFileSize(attachment.sizeBytes)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          attachments: state.attachments.filter((a) => a.id !== attachment.id),
                        })
                      }
                      aria-label={`Remove ${attachment.filename}`}
                      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Paperclip />}
            onClick={() => fileInputRef.current?.click()}
          >
            Attach files
          </Button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2 px-4 py-3">
          <ToggleRow
            icon={<Star />}
            label="Mark as important"
            description="Flags the thread in your inbox and stats."
            checked={state.isImportant}
            onChange={(isImportant) => patch({ isImportant })}
            tone="amber"
          />


        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        <Button
          onClick={handleSend}
          isLoading={isSending}
          leftIcon={<Send />}
        >
          {isSending ? 'Sending…' : 'Send'}
        </Button>

        <Button variant="ghost" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>

        <span className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          {isSending && <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />}
          {state.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {state.attachments.length}
            </span>
          )}
        </span>
      </div>
    </div>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {/* The sheet caps itself at 85vh and spends ~10vh of that on its drag
          handle and title bar. An 80vh body therefore overflowed the panel and
          pushed the Send/Cancel footer outside it. */}
      <div className="h-[72vh]">{content}</div>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Schedule presets
// ---------------------------------------------------------------------------


export default ComposeEmail;
