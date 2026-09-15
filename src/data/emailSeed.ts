// =============================================================================
// Email seed data
//
// Two mock sets ship with the app: `data/emails.ts` (compact, HTML bodies) and
// `data/mockEmails.ts` (40 long-form threads). This module merges them into the
// single dataset the email store boots from, layers on the non-primary
// categories (social / updates / promotions) the long-form set does not cover,
// and attaches the "waiting on" metadata the inbox surfaces.
// =============================================================================

import type { Email, EmailAddress, EmailDraft, EmailWaitingOn } from '@/types/index';
import { mockEmails as compactEmails, mockDrafts } from './emails';
import { mockEmails as threadEmails } from './mockEmails';

const ME: EmailAddress = { name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' };

// ---------------------------------------------------------------------------
// Waiting-on seed — emails whose reply Sarah is still chasing
// ---------------------------------------------------------------------------

interface WaitingOnSeed {
  since: string; // ISO 8601
  chaseDate: string | null; // ISO 8601
  note: string;
}

const WAITING_ON_SEED: Record<string, WaitingOnSeed> = {
  'email-002': {
    since: '2026-09-09T09:20:00Z',
    chaseDate: '2026-09-17T09:00:00Z',
    note: 'Awaiting redline resolution on section 4.2 before legal sign-off.',
  },
  'email-006': {
    since: '2026-09-08T15:40:00Z',
    chaseDate: '2026-09-16T09:00:00Z',
    note: 'Daniel still owes the latency benchmarks for the architecture review.',
  },
  'email-012': {
    since: '2026-09-07T11:05:00Z',
    chaseDate: '2026-09-18T09:00:00Z',
    note: 'Waiting on final JD sign-off so the roles can be posted.',
  },
  'email-024': {
    since: '2026-09-05T17:30:00Z',
    chaseDate: '2026-09-19T09:00:00Z',
    note: 'Legal has not returned the LOI markup.',
  },
  'email-030': {
    since: '2026-09-02T08:00:00Z',
    chaseDate: '2026-09-15T09:00:00Z',
    note: 'No acknowledgement from the investor list on the August update.',
  },
  'email-039': {
    since: '2026-09-04T10:15:00Z',
    chaseDate: '2026-09-16T12:00:00Z',
    note: 'Board pre-read materials still outstanding from two owners.',
  },
};

/** The counterpart of a thread: the sender, or the first recipient when sent. */
function counterpartOf(email: Email): EmailAddress {
  if (email.status === 'sent' || email.from.email === ME.email) {
    return email.to[0] ?? email.from;
  }
  return email.from;
}

function waitingOnFor(email: Email): EmailWaitingOn | null {
  const seed = WAITING_ON_SEED[email.id];
  if (!seed) return email.waitingOn ?? null;
  const contact = counterpartOf(email);
  return {
    contactEmail: contact.email,
    contactName: contact.name,
    since: seed.since,
    chaseDate: seed.chaseDate,
    note: seed.note,
  };
}

// ---------------------------------------------------------------------------
// Reply suggestions — short drafts Busy.me offers on the detail screen
// ---------------------------------------------------------------------------

const REPLY_SUGGESTIONS: Record<string, string[]> = {
  'email-001': [
    'Thanks Marcus — Thursday 2pm works on my side. I will pull James and Rachel in and share the critical path beforehand.',
    'Good flag on procurement. Let me re-baseline the timeline against a three-week onboarding window and come back tomorrow.',
    'Can we hold the October 15th date for now? I would rather align on the integration milestones before we move it.',
  ],
  'email-002': [
    'Thanks Priya — Thursday afternoon works for the legal review. I will have our counsel on the call.',
    'Section 4.2 is the one that needs a design conversation. Can Rachel join so we can walk through the deployment topology?',
    'Received. We will turn the redlines around before September 19th so we keep the signing date.',
  ],
  'email-003': [
    'Data room access is set up — sharing credentials separately today.',
    'Happy to help. Which of the diligence folders would you like prioritised first?',
    'Noted on the timeline. I will confirm once the financials are uploaded.',
  ],
};

function replySuggestionsFor(email: Email): string[] {
  if (email.aiReplySuggestions?.length) return email.aiReplySuggestions;
  const preset = REPLY_SUGGESTIONS[email.id];
  if (preset) return preset;

  const firstName = (email.from.name ?? email.from.email).split(' ')[0];
  return [
    `Thanks ${firstName} — got it. I will review and come back to you by end of day tomorrow.`,
    `Thanks for the detail, ${firstName}. Do you have time for fifteen minutes this week to walk through it?`,
    `Acknowledged, ${firstName}. Let me confirm internally and revert with a firm answer.`,
  ];
}

// ---------------------------------------------------------------------------
// Supplemental emails — social / updates / promotions so every category chip
// on the list screen resolves to real content.
// ---------------------------------------------------------------------------

function supplementalEmail(
  index: number,
  partial: Omit<
    Email,
    | 'id'
    | 'connectorId'
    | 'threadId'
    | 'messageId'
    | 'to'
    | 'cc'
    | 'bcc'
    | 'replyTo'
    | 'receivedAt'
    | 'isStarred'
    | 'isImportant'
    | 'hasCalendarInvite'
    | 'attachments'
    | 'labels'
  > &
    Partial<Pick<Email, 'attachments' | 'labels' | 'isStarred' | 'isImportant'>>,
): Email {
  const id = `email-${String(100 + index)}`;
  return {
    ...partial,
    id,
    connectorId: 'gmail',
    threadId: `thread-${String(100 + index)}`,
    messageId: `<${id}@busy.me>`,
    to: [ME],
    cc: [],
    bcc: [],
    replyTo: null,
    receivedAt: partial.date,
    attachments: partial.attachments ?? [],
    labels: partial.labels ?? [],
    isStarred: partial.isStarred ?? false,
    isImportant: partial.isImportant ?? false,
    hasCalendarInvite: false,
  };
}

const supplementalEmails: Email[] = [
  supplementalEmail(1, {
    subject: 'Marcus Rivera and 4 others viewed your profile this week',
    snippet:
      'Your profile appeared in 38 searches this week. Marcus Rivera (Acme Corp) and 4 others viewed your profile…',
    bodyHtml: null,
    bodyText: `Hi Sarah,

Your profile appeared in 38 searches this week — up 24% from last week.

Recent viewers:
- Marcus Rivera, Chief Executive Officer at Acme Corp
- Amanda Foster, Partner at Horizon Ventures
- Natalie Brooks, Head of Design at TechCorp
- Two viewers from healthcare technology

People in your network are talking about Series B fundraising and enterprise AI adoption.

See who viewed your profile: https://linkedin.com/me/profile-views`,
    from: { name: 'LinkedIn', email: 'notifications-noreply@linkedin.com' },
    date: '2026-09-09T13:10:00Z',
    status: 'unread',
    category: 'social',
    labels: ['social', 'network'],
    aiSummary: '38 profile views this week, including Marcus Rivera and Amanda Foster.',
    spamScore: 0.02,
  }),
  supplementalEmail(2, {
    subject: '3 new mentions in #project-atlas',
    snippet:
      'Kevin Zhao mentioned you in #project-atlas: "can @sarah confirm the notification copy before we freeze the build?"',
    bodyHtml: null,
    bodyText: `You have 3 unread mentions in TechCorp's workspace.

#project-atlas — Kevin Zhao
"can @sarah confirm the notification copy before we freeze the build?"

#design-review — Natalie Brooks
"@sarah the revised empty states are in Figma, page 4"

#leadership — James Okafor
"@sarah adding the OKR draft to Monday's agenda unless you object"

Open Slack to reply: https://techcorp.slack.com`,
    from: { name: 'Slack', email: 'no-reply@slack.com' },
    date: '2026-09-09T18:44:00Z',
    status: 'unread',
    category: 'social',
    labels: ['social', 'slack'],
    aiSummary: 'Three mentions waiting in Slack, two of which ask you to confirm copy and OKRs.',
  }),
  supplementalEmail(3, {
    subject: 'Your AWS invoice for August 2026 is available',
    snippet:
      'Your total charges for August 2026 are $18,420.66, a 6% increase over July driven by inference capacity…',
    bodyHtml: null,
    bodyText: `Hello,

Your AWS invoice for the billing period August 1 – August 31, 2026 is now available.

Account: TechCorp Production (8842-1109-4420)
Total charges: $18,420.66
Change vs. July: +6.1%

Top cost drivers:
1. Amazon SageMaker inference endpoints — $6,204.18
2. Amazon EC2 (m6i, c7g) — $4,918.02
3. Amazon RDS (Aurora PostgreSQL) — $3,140.55
4. Data transfer out — $1,802.44

Payment will be collected automatically on September 18th.`,
    from: { name: 'AWS Billing', email: 'billing@amazonaws.com' },
    date: '2026-09-08T04:02:00Z',
    status: 'read',
    category: 'updates',
    labels: ['billing', 'finance'],
    attachments: [
      {
        id: 'att-aws-aug',
        filename: 'AWS_Invoice_August_2026.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 168_432,
        isInline: false,
      },
    ],
    aiSummary: 'AWS August invoice is $18,420.66, up 6.1% on inference capacity.',
    aiActionItems: ['Review inference spend with Raj', 'Confirm budget line for Q4'],
  }),
  supplementalEmail(4, {
    subject: 'Figma: Natalie Brooks shared "Atlas — Notification System v3"',
    snippet:
      'Natalie Brooks shared a file with you and left 6 comments on the notification permission flow…',
    bodyHtml: null,
    bodyText: `Natalie Brooks shared a file with you.

Atlas — Notification System v3
6 new comments, 2 of them addressed to you.

"Sarah — we need a decision on whether the digest defaults to daily or weekly."
"Flagging that the permission primer copy still references the old brand voice."

Open in Figma: https://figma.com/file/atlas-notifications-v3`,
    from: { name: 'Figma', email: 'no-reply@figma.com' },
    date: '2026-09-08T16:25:00Z',
    status: 'read',
    category: 'updates',
    labels: ['design', 'project-atlas'],
    aiSummary: 'Natalie shared the v3 notification designs and needs a digest-frequency decision.',
    aiActionItems: ['Decide digest default frequency', 'Review permission primer copy'],
  }),
  supplementalEmail(5, {
    subject: 'Your weekly Stripe summary: $412,908 collected',
    snippet:
      'Week of September 1 – 7: $412,908.44 collected across 1,284 successful payments, 11 disputes opened…',
    bodyHtml: null,
    bodyText: `Weekly summary for TechCorp, September 1 – 7, 2026.

Gross volume: $412,908.44 (+9.2% week over week)
Successful payments: 1,284
Failed payments: 46 (3.5%)
Disputes opened: 11
Net after fees: $399,118.02

Your largest payment this week was $84,000.00 from Meridian Health.`,
    from: { name: 'Stripe', email: 'no-reply@stripe.com' },
    date: '2026-09-07T07:30:00Z',
    status: 'read',
    category: 'updates',
    labels: ['finance', 'revenue'],
    aiSummary: 'Weekly gross volume of $412,908, up 9.2%, with 11 disputes to review.',
  }),
  supplementalEmail(6, {
    subject: 'Last chance: SaaStr Enterprise 2026 — 40% off team passes',
    snippet:
      'Team passes for SaaStr Enterprise 2026 drop to $890 until Friday. Sessions on AI-native go-to-market…',
    bodyHtml: null,
    bodyText: `Hi Sarah,

Team passes for SaaStr Enterprise 2026 (November 3 – 5, San Francisco) are 40% off until Friday at midnight.

This year's track list:
- AI-native go-to-market
- Enterprise pricing and packaging in the AI era
- Scaling from $20M to $100M ARR

Speakers include leaders from Snowflake, Databricks and Ramp.

Claim your team discount: https://saastr.com/enterprise-2026

Unsubscribe from SaaStr promotions.`,
    from: { name: 'SaaStr Events', email: 'events@saastr.com' },
    date: '2026-09-06T14:00:00Z',
    status: 'read',
    category: 'promotions',
    labels: ['promotions', 'events'],
    spamScore: 0.22,
  }),
  supplementalEmail(7, {
    subject: 'Introducing usage-based pricing on Vercel Enterprise',
    snippet:
      'We are rolling out usage-based pricing for Enterprise customers, with committed-use discounts up to 32%…',
    bodyHtml: null,
    bodyText: `Hi there,

Starting October 1st, Vercel Enterprise moves to usage-based pricing with committed-use discounts of up to 32%.

What changes for TechCorp:
- Your current commitment is honoured through the end of the contract term
- Edge function invocations are billed per million rather than per seat
- New spend controls and budget alerts are available today

Read the full pricing guide: https://vercel.com/pricing-2026

You are receiving this because your workspace is on an Enterprise plan.`,
    from: { name: 'Vercel', email: 'hello@vercel.com' },
    date: '2026-09-05T11:20:00Z',
    status: 'read',
    category: 'promotions',
    labels: ['promotions', 'vendor'],
    spamScore: 0.14,
  }),
  supplementalEmail(8, {
    subject: 'Elena Vasquez commented on your post',
    snippet:
      '"This is the clearest breakdown of enterprise AI adoption I have read this year." — 42 reactions so far…',
    bodyHtml: null,
    bodyText: `Your post is getting attention.

Elena Vasquez commented:
"This is the clearest breakdown of enterprise AI adoption I have read this year. Sending it to our whole platform team."

42 reactions · 9 comments · 1,830 impressions

View the conversation: https://linkedin.com/feed/post/atlas-adoption`,
    from: { name: 'LinkedIn', email: 'notifications-noreply@linkedin.com' },
    date: '2026-09-04T19:05:00Z',
    status: 'read',
    category: 'social',
    labels: ['social'],
  }),
];

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

/** Longer bodies win — the thread set is the richer of the two mock sources. */
function mergeById(...sets: Email[][]): Email[] {
  const byId = new Map<string, Email>();
  for (const set of sets) {
    for (const email of set) {
      const existing = byId.get(email.id);
      if (!existing) {
        byId.set(email.id, email);
        continue;
      }
      const existingLength = (existing.bodyText ?? existing.bodyHtml ?? '').length;
      const candidateLength = (email.bodyText ?? email.bodyHtml ?? '').length;
      if (candidateLength > existingLength) byId.set(email.id, email);
    }
  }
  return [...byId.values()];
}

function decorate(email: Email): Email {
  return {
    ...email,
    waitingOn: waitingOnFor(email),
    aiReplySuggestions: replySuggestionsFor(email),
  };
}

/** Newest first — the order the inbox renders in. */
function byDateDesc(a: Email, b: Email): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export const seedEmails: Email[] = mergeById(
  threadEmails,
  compactEmails,
  supplementalEmails,
)
  .map(decorate)
  .sort(byDateDesc);

export const seedDrafts: EmailDraft[] = mockDrafts;

/** The mailbox owner — used as the `from` address on anything composed here. */
export const mailboxOwner: EmailAddress = ME;

export default seedEmails;
