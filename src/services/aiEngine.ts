// ---------------------------------------------------------------------------
// Deterministic mock AI engine for Busy.me
// ---------------------------------------------------------------------------

import { generateId } from '../lib/utils';
import { MOCK_CONTACTS } from './mockApi';

// ---------------------------------------------------------------------------
// Intent types
// ---------------------------------------------------------------------------
export type IntentType =
  | 'find-emails'
  | 'create-task'
  | 'create-event'
  | 'draft-email'
  | 'summarize'
  | 'find-contact'
  | 'search-web'
  | 'create-research-pack'
  | 'show-followups'
  | 'general';

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------
export interface AIResponse {
  content: string;
  data?: unknown;
  actions?: Array<{ label: string; action: string; payload?: unknown }>;
}

// ---------------------------------------------------------------------------
// Keyword maps for intent detection
// ---------------------------------------------------------------------------
const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  'find-emails': ['email', 'emails', 'mail', 'inbox', 'message', 'messages', 'unread', 'sent', 'received', 'from'],
  'create-task': ['task', 'tasks', 'todo', 'to-do', 'action item', 'reminder', 'create task', 'add task', 'new task'],
  'create-event': ['event', 'meeting', 'schedule', 'calendar', 'appointment', 'book', 'invite', 'call at', 'meet'],
  'draft-email': ['draft', 'write email', 'compose', 'send email', 'reply to', 'respond to'],
  'summarize': ['summarize', 'summary', 'tldr', 'tl;dr', 'brief me', 'what happened', 'catch me up', 'overview', 'digest'],
  'find-contact': ['contact', 'contacts', 'who is', 'find person', 'email address of', 'phone number of'],
  'search-web': ['search', 'look up', 'google', 'browse', 'research online', 'find online', 'what is', 'how does'],
  'create-research-pack': ['research pack', 'research', 'gather info', 'compile', 'investigate', 'report on', 'pack about'],
  'show-followups': ['follow up', 'followup', 'follow-up', 'pending', 'outstanding', 'waiting on', 'haven\'t heard'],
  'general': [],
};

// ---------------------------------------------------------------------------
// Mock data references used in response generation
// ---------------------------------------------------------------------------
const TOPICS = ['Q3 partnership', 'pricing update', 'product roadmap', 'contract renewal', 'onboarding'];
const PACK_NAMES = ['AI Productivity Tools Landscape 2026', 'APAC Market Expansion — Feasibility', 'Zero-Knowledge Auth Approaches'];

// ---------------------------------------------------------------------------
// detectIntent
// ---------------------------------------------------------------------------
export function detectIntent(message: string): IntentType {
  const lower = message.toLowerCase();

  // Score each intent by counting matching keyword hits
  let bestIntent: IntentType = 'general';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [IntentType, string[]][]) {
    if (intent === 'general') continue;
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestIntent;
}

// ---------------------------------------------------------------------------
// Response generators — one per intent
// ---------------------------------------------------------------------------

function respondFindEmails(message: string): AIResponse {
  const topic = TOPICS.find((t) => message.toLowerCase().includes(t.split(' ')[0].toLowerCase())) ?? 'your query';
  const count = Math.floor(Math.random() * 4) + 2;
  const contactName = MOCK_CONTACTS[Math.floor(Math.random() * MOCK_CONTACTS.length)].name;

  const emailRefs = Array.from({ length: count }, (_, i) => ({
    id: `email-${i + 1}`,
    subject: `Follow-up: ${topic.charAt(0).toUpperCase() + topic.slice(1)} update ${i + 1}`,
    from: contactName,
  }));

  return {
    content: `I found **${count} emails** related to "${topic}".\n\nHere are the most relevant ones:`,
    data: { emails: emailRefs },
    actions: [
      { label: 'Open Inbox', action: 'navigate', payload: { path: '/mail' } },
      { label: 'Archive All', action: 'archive-emails', payload: { ids: emailRefs.map((e) => e.id) } },
    ],
  };
}

function respondCreateTask(message: string): AIResponse {
  // Try to extract a plausible task title from the message
  const cleaned = message
    .replace(/create|add|new|task|todo|to-do|action item|reminder/gi, '')
    .replace(/[":]/g, '')
    .trim();
  const title = cleaned.length > 5 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'New task from chat';
  const dueDate = new Date(Date.now() + 2 * 86_400_000).toISOString().split('T')[0];

  const task = {
    id: `t-${generateId().slice(0, 8)}`,
    title,
    status: 'todo',
    priority: 'medium',
    dueDate,
  };

  return {
    content: `I've created a task for you:\n\n**${title}**\nDue: ${dueDate} · Priority: medium`,
    data: { task },
    actions: [
      { label: 'View Task', action: 'navigate', payload: { path: `/tasks/${task.id}` } },
      { label: 'Edit', action: 'open-task-editor', payload: { taskId: task.id } },
    ],
  };
}

function respondCreateEvent(message: string): AIResponse {
  const cleaned = message
    .replace(/create|schedule|add|new|event|meeting|appointment|calendar/gi, '')
    .replace(/[":]/g, '')
    .trim();
  const title = cleaned.length > 5 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'New Meeting';
  const start = new Date(Date.now() + 24 * 3_600_000).toISOString();
  const end = new Date(Date.now() + 24 * 3_600_000 + 3_600_000).toISOString();

  const event = {
    id: `ev-${generateId().slice(0, 8)}`,
    title,
    start,
    end,
    location: 'Zoom',
  };

  return {
    content: `I've added **"${title}"** to your calendar.\n\nStart: ${new Date(start).toLocaleString()}\nLocation: Zoom`,
    data: { event },
    actions: [
      { label: 'View in Calendar', action: 'navigate', payload: { path: `/calendar/${event.id}` } },
      { label: 'Invite Attendees', action: 'open-event-editor', payload: { eventId: event.id } },
    ],
  };
}

function respondDraftEmail(message: string): AIResponse {
  const contactMatch = MOCK_CONTACTS.find((c) =>
    message.toLowerCase().includes(c.name.split(' ')[0].toLowerCase())
  );
  const to = contactMatch
    ? { name: contactMatch.name, email: contactMatch.email }
    : { name: 'Unknown Recipient', email: 'recipient@example.com' };

  const subject = 'Follow-up from our recent conversation';
  const body = `Hi ${to.name.split(' ')[0]},\n\nI hope this finds you well. I wanted to follow up on our recent discussion.\n\nPlease let me know if you have any questions.\n\nBest regards,\nMe`;

  return {
    content: `I've drafted an email to **${to.name}**:\n\n---\n**To:** ${to.email}\n**Subject:** ${subject}\n\n${body}\n\n---`,
    data: { draft: { to: [to], subject, body } },
    actions: [
      { label: 'Edit Draft', action: 'open-composer', payload: { draft: { to: [to], subject, body } } },
      { label: 'Send Now', action: 'send-email', payload: { to: [to], subject, body } },
    ],
  };
}

function respondSummarize(): AIResponse {
  return {
    content: `Here's your **daily brief**:\n\n` +
      `**Emails:** 7 unread, 2 flagged as important\n` +
      `- Alice Johnson sent a follow-up on the Q3 Partnership Proposal\n` +
      `- Invoice #INV-2025-0044 from Bob Martinez is awaiting payment\n\n` +
      `**Tasks:** 3 due this week\n` +
      `- Sign contract renewal with David Kim (due Friday — urgent)\n` +
      `- Prepare product roadmap slides (due Thursday)\n` +
      `- Send invoice reminder to Bob (due tomorrow)\n\n` +
      `**Calendar:** 2 events tomorrow\n` +
      `- Product Roadmap Review at 14:00 (Zoom)\n` +
      `- Contract deadline all day`,
    data: null,
    actions: [
      { label: 'Go to Inbox', action: 'navigate', payload: { path: '/mail' } },
      { label: 'View Tasks', action: 'navigate', payload: { path: '/tasks' } },
    ],
  };
}

function respondFindContact(message: string): AIResponse {
  const contact = MOCK_CONTACTS.find((c) =>
    message.toLowerCase().includes(c.name.split(' ')[0].toLowerCase()) ||
    message.toLowerCase().includes(c.company.toLowerCase())
  ) ?? MOCK_CONTACTS[0];

  return {
    content:
      `Here's what I found for **${contact.name}**:\n\n` +
      `**Email:** ${contact.email}\n` +
      `**Company:** ${contact.company}\n` +
      `**Role:** ${contact.role}\n` +
      `**Phone:** ${contact.phone}`,
    data: { contact },
    actions: [
      { label: 'Open Contact', action: 'navigate', payload: { path: `/contacts/${contact.id}` } },
      { label: 'Send Email', action: 'open-composer', payload: { to: [{ name: contact.name, email: contact.email }] } },
    ],
  };
}

function respondSearchWeb(message: string): AIResponse {
  const query = message
    .replace(/search|look up|google|browse|find online|what is|how does/gi, '')
    .replace(/[":?]/g, '')
    .trim();

  return {
    content: `Searching the web for **"${query}"**…\n\nI'll gather the top results and can compile them into a Research Pack for you.`,
    data: { query, searching: true },
    actions: [
      { label: 'View Results', action: 'web-search', payload: { query } },
      { label: 'Create Research Pack', action: 'create-research-pack', payload: { title: query, query } },
    ],
  };
}

function respondCreateResearchPack(message: string): AIResponse {
  const existingPack = PACK_NAMES[Math.floor(Math.random() * PACK_NAMES.length)];
  const cleaned = message
    .replace(/create|new|research pack|pack about|research on|compile|gather/gi, '')
    .replace(/[":]/g, '')
    .trim();
  const title = cleaned.length > 5
    ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    : existingPack;

  const pack = {
    id: `rp-${generateId().slice(0, 8)}`,
    title,
    status: 'draft',
  };

  return {
    content: `I've started a new Research Pack: **"${title}"**\n\nI'll begin gathering sources and will summarise findings as they come in.`,
    data: { pack },
    actions: [
      { label: 'Open Pack', action: 'navigate', payload: { path: `/research/${pack.id}` } },
      { label: 'Add Sources', action: 'open-research-editor', payload: { packId: pack.id } },
    ],
  };
}

function respondShowFollowups(): AIResponse {
  return {
    content:
      `Here are your **pending follow-ups**:\n\n` +
      `1. **Alice Johnson** — Q3 Partnership Proposal (sent 2 days ago, no reply)\n` +
      `2. **Bob Martinez** — Invoice #INV-2025-0044 (overdue 15 days)\n` +
      `3. **David Kim** — Contract renewal (due this Friday)\n` +
      `4. **Eva Rossi** — EU launch campaign brief (sent 5 days ago)\n\n` +
      `Would you like me to draft follow-up emails for any of these?`,
    data: {
      followups: [
        { contactName: 'Alice Johnson', topic: 'Q3 Partnership Proposal', daysAgo: 2 },
        { contactName: 'Bob Martinez', topic: 'Invoice #INV-2025-0044', daysAgo: 15 },
        { contactName: 'David Kim', topic: 'Contract renewal', urgency: 'high' },
        { contactName: 'Eva Rossi', topic: 'EU launch campaign brief', daysAgo: 5 },
      ],
    },
    actions: [
      { label: 'Draft Follow-ups', action: 'draft-followup-emails', payload: {} },
      { label: 'View in Inbox', action: 'navigate', payload: { path: '/mail' } },
    ],
  };
}

function respondGeneral(message: string): AIResponse {
  const greetings = ['Hello!', 'Hi there!', 'Hey!'];
  const isGreeting = /^(hi|hello|hey|good morning|good evening|howdy)/i.test(message.trim());

  if (isGreeting) {
    return {
      content:
        `${greetings[Math.floor(Math.random() * greetings.length)]} I'm your Busy.me AI assistant.\n\n` +
        `Here's what I can help you with:\n` +
        `- **Find emails** — "Show emails from Alice"\n` +
        `- **Create tasks** — "Add a task to review the contract"\n` +
        `- **Schedule events** — "Schedule a call with Bob tomorrow"\n` +
        `- **Research** — "Create a research pack on AI tools"\n` +
        `- **Summarise** — "Give me a daily brief"\n\n` +
        `What would you like to do?`,
      data: null,
      actions: [],
    };
  }

  return {
    content:
      `I understand you're asking about: **"${message}"**\n\n` +
      `I can help you manage emails, tasks, events, contacts, and research. ` +
      `Try asking me to find emails, create a task, schedule a meeting, or summarise your day.`,
    data: null,
    actions: [
      { label: 'Daily Brief', action: 'send-message', payload: { message: 'Give me a daily brief' } },
      { label: 'View Inbox', action: 'navigate', payload: { path: '/mail' } },
    ],
  };
}

// ---------------------------------------------------------------------------
// generateResponse — dispatches to the correct intent handler
// ---------------------------------------------------------------------------
export function generateResponse(
  intent: IntentType,
  message: string,
  _context: Record<string, unknown>
): AIResponse {
  switch (intent) {
    case 'find-emails':
      return respondFindEmails(message);
    case 'create-task':
      return respondCreateTask(message);
    case 'create-event':
      return respondCreateEvent(message);
    case 'draft-email':
      return respondDraftEmail(message);
    case 'summarize':
      return respondSummarize();
    case 'find-contact':
      return respondFindContact(message);
    case 'search-web':
      return respondSearchWeb(message);
    case 'create-research-pack':
      return respondCreateResearchPack(message);
    case 'show-followups':
      return respondShowFollowups();
    default:
      return respondGeneral(message);
  }
}

// ---------------------------------------------------------------------------
// Named export for use in mockApi (dynamic import)
// ---------------------------------------------------------------------------
export const aiEngine = {
  detectIntent,
  generateResponse,
};
