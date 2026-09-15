import type { ChatSession, ChatMessage } from '@/types/index';

const sessionAMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    sessionId: 'session-001',
    role: 'user',
    type: 'text',
    textContent: 'Summarize my unread emails from today',
    isStreaming: false,
    createdAt: '2026-09-10T08:05:00Z',
    error: null,
  },
  {
    id: 'msg-002',
    sessionId: 'session-001',
    role: 'assistant',
    type: 'text',
    textContent: "You have **3 unread emails** this morning that need your attention:\n\n1. **Marcus Rivera (Acme Corp)** — Following up on the Q3 Partnership Proposal. He wants to know if you've reviewed the deck. *Action: Reply with your feedback.*\n\n2. **Priya Nair (Meridian Health)** — Urgent: contract renewal requires your signature by Friday. Attachment included. *Action: Review and sign.*\n\n3. **James Okafor** — Engineering standup notes with 3 blockers: Auth v2 design approval pending, ML pipeline blocked, and mobile app store review delay. *Action: Unblock Auth v2 design review.*\n\nWould you like me to draft a reply to any of these?",
    isStreaming: false,
    createdAt: '2026-09-10T08:05:12Z',
    error: null,
  },
  {
    id: 'msg-003',
    sessionId: 'session-001',
    role: 'user',
    type: 'text',
    textContent: 'Draft a reply to Marcus acknowledging his follow-up and letting him know I have questions about the revenue share model',
    isStreaming: false,
    createdAt: '2026-09-10T08:07:00Z',
    error: null,
  },
  {
    id: 'msg-004',
    sessionId: 'session-001',
    role: 'assistant',
    type: 'artifact',
    textContent: "Here's a draft reply for Marcus:",
    artifact: {
      id: 'artifact-001',
      type: 'email-draft',
      title: 'Re: Follow-up: Q3 Partnership Proposal',
      contentMarkdown: `**To:** Marcus Rivera <marcus.rivera@acmecorp.com>
**Subject:** Re: Follow-up: Q3 Partnership Proposal

Hi Marcus,

Thanks for following up — apologies for the delay on my end.

I've had a chance to review the deck and I'm genuinely excited about the potential here. Before we move forward, I have a few questions on the revenue share model:

1. Is the 20/80 split calculated on gross or net revenue (after infrastructure costs)?
2. What's the renegotiation mechanism at the 12-month mark — fixed formula or open negotiation?
3. Does the exclusivity clause in the APAC region apply to all of our customers or only to pilot participants?

Happy to jump on a quick call this week if that's easier. Thursday afternoon works well on my end.

Best,
Sarah`,
      createdAt: '2026-09-10T08:07:15Z',
      isEditable: true,
    },
    isStreaming: false,
    createdAt: '2026-09-10T08:07:15Z',
    error: null,
  },
];

const sessionBMessages: ChatMessage[] = [
  {
    id: 'msg-101',
    sessionId: 'session-002',
    role: 'user',
    type: 'text',
    textContent: 'What are the latest trends in AI productivity tools?',
    isStreaming: false,
    createdAt: '2026-09-09T15:00:00Z',
    error: null,
  },
  {
    id: 'msg-102',
    sessionId: 'session-002',
    role: 'assistant',
    type: 'search-results',
    textContent: 'I searched the web for the latest on AI productivity tools. Here are the key findings:',
    searchResults: [
      {
        id: 'sr-001',
        title: 'AI Productivity Tools Hit $4.2B in VC Investment — 2026 Report',
        url: 'https://example.com/ai-productivity-vc-2026',
        displayUrl: 'example.com/ai-productivity-vc-2026',
        snippet: 'Venture capital investment in AI productivity tools surged 68% year-over-year to $4.2 billion in 2025, with email and calendar AI seeing the strongest growth.',
        publishedAt: '2026-08-10T00:00:00Z',
        faviconUrl: null,
        imageUrl: null,
        sourceName: 'TechCrunch',
        relevanceScore: 0.97,
      },
      {
        id: 'sr-002',
        title: 'The Rise of Agentic Email: How AI is Reshaping the Inbox',
        url: 'https://example.com/agentic-email-2026',
        displayUrl: 'example.com/agentic-email-2026',
        snippet: "Agentic email tools — those that don't just summarize but take action — are the fastest-growing segment in the productivity AI market.",
        publishedAt: '2026-09-02T00:00:00Z',
        faviconUrl: null,
        imageUrl: null,
        sourceName: 'The Verge',
        relevanceScore: 0.93,
      },
    ],
    isStreaming: false,
    createdAt: '2026-09-09T15:00:20Z',
    error: null,
  },
];

export const mockChatSessions: ChatSession[] = [
  {
    id: 'session-001',
    userId: 'user-001',
    title: 'Morning Email Review',
    messages: sessionAMessages,
    isArchived: false,
    createdAt: '2026-09-10T08:05:00Z',
    updatedAt: '2026-09-10T08:07:15Z',
    lastMessageAt: '2026-09-10T08:07:15Z',
    totalMessages: 4,
  },
  {
    id: 'session-002',
    userId: 'user-001',
    title: 'AI Productivity Trends Research',
    messages: sessionBMessages,
    isArchived: false,
    createdAt: '2026-09-09T15:00:00Z',
    updatedAt: '2026-09-09T15:00:20Z',
    lastMessageAt: '2026-09-09T15:00:20Z',
    totalMessages: 2,
  },
];
