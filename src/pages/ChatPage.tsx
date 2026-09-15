import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Layers, SquarePen, X } from 'lucide-react';
import type {
  ChatMessage as ChatMessageModel,
  ChatSuggestedAction,
  WebSearchResult,
} from '@/types/index';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { MessageList } from '@/components/chat/MessageList';
import { ChatComposer, DEFAULT_SUGGESTIONS } from '@/components/chat/ChatComposer';
import { Workboard } from '@/components/chat/Workboard';
import { WebSearchResults } from '@/components/chat/WebSearchResults';
import { detectIntent, generateResponse, type IntentType } from '@/services/aiEngine';
import { mockApi } from '@/services/mockApi';
import { mockChatResponses, mockWebSearchResults } from '@/data/mockChat';
import { generateId, simulateDelay } from '@/lib/utils';

// =============================================================================
// ChatPage — the Busy.me home screen
// =============================================================================

// ── Message factories ────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function userMessage(sessionId: string, content: string): ChatMessageModel {
  return {
    id: `msg-${generateId()}`,
    sessionId,
    role: 'user',
    type: 'text',
    textContent: content,
    isStreaming: false,
    createdAt: nowIso(),
    error: null,
  };
}

function assistantMessage(
  sessionId: string,
  patch: Partial<ChatMessageModel> & { textContent: string | null },
): ChatMessageModel {
  const hasActions = (patch.suggestedActions?.length ?? 0) > 0;
  return {
    id: `msg-${generateId()}`,
    sessionId,
    role: 'assistant',
    type:
      patch.type ??
      (patch.artifact
        ? 'artifact'
        : patch.searchResults
          ? 'search-results'
          : patch.researchPackSummaryId
            ? 'research-pack-summary'
            : hasActions
              ? 'action-suggestion'
              : 'text'),
    isStreaming: false,
    createdAt: nowIso(),
    modelId: 'busyme-assistant-v2',
    error: null,
    ...patch,
  };
}

function action(
  label: string,
  actionType: ChatSuggestedAction['actionType'],
  payload: ChatSuggestedAction['payload'] = {},
  isPrimary = false,
): ChatSuggestedAction {
  return {
    id: `act-${generateId()}`,
    label,
    description: null,
    actionType,
    payload,
    isPrimary,
  };
}

const DISMISS = () => action('Not Now', 'dismiss');

// ── Store writes ─────────────────────────────────────────────────────────────

/**
 * `chatStore` keeps `sessions` and `currentSession` in sync by hand, so both
 * copies have to be patched together when a message is appended.
 */
function appendMessage(sessionId: string, message: ChatMessageModel): void {
  useChatStore.setState((s) => {
    const title =
      message.role === 'user' ? (message.textContent ?? '').slice(0, 60) : null;

    return {
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              messages: [...sess.messages, message],
              totalMessages: sess.totalMessages + 1,
              title: sess.title ?? title,
              lastMessageAt: message.createdAt,
              updatedAt: message.createdAt,
            }
          : sess,
      ),
      currentSession:
        s.currentSession?.id === sessionId
          ? {
              ...s.currentSession,
              messages: [...s.currentSession.messages, message],
              totalMessages: s.currentSession.totalMessages + 1,
              title: s.currentSession.title ?? title,
              lastMessageAt: message.createdAt,
              updatedAt: message.createdAt,
            }
          : s.currentSession,
    };
  });
}

// ── Topic routing (rich, hand-written demo answers) ──────────────────────────

const TOPIC_MATCHERS: Array<{
  key: keyof typeof mockChatResponses;
  test: RegExp;
  packId?: string;
  actions: () => ChatSuggestedAction[];
}> = [
  {
    key: 'meridian',
    test: /meridian|priya|rachel kim|partnership agreement/i,
    actions: () => [
      action(
        'Create Task',
        'create-task',
        { title: 'Chase Rachel Kim for Meridian API sandbox credentials' },
        true,
      ),
      action('Draft follow-up email', 'summarize', {
        query: 'Draft a follow-up email to Rachel Kim about the API sandbox credentials',
      }),
      DISMISS(),
    ],
  },
  {
    key: 'atlas',
    test: /atlas|feature freeze|roadmap/i,
    actions: () => [
      action('Create Task', 'create-task', { title: 'Approve Atlas Figma prototype' }, true),
      action('Open Research Pack', 'create-research-pack', { researchPackId: 'pack-001' }),
      DISMISS(),
    ],
  },
  {
    key: 'tasks',
    test: /due this week|overdue|open tasks|urgent task|what'?s due/i,
    actions: () => [
      action('Create Task', 'create-task', { title: 'Review Vertex Labs LOI draft' }, true),
      action('Show overdue items', 'summarize', { query: 'Find all overdue tasks' }),
      DISMISS(),
    ],
  },
  {
    key: 'investor',
    test: /investor|series b call|pitch deck|board meeting/i,
    actions: () => [
      action(
        'Create Event',
        'create-event',
        { title: 'Investor deck working session', location: 'Zoom' },
        true,
      ),
      action('Create Task', 'create-task', { title: 'Alert legal about incoming term sheet' }),
      DISMISS(),
    ],
  },
  {
    key: 'series_b',
    test: /term sheet|fundraising|data room|sequoia|horizon/i,
    actions: () => [
      action('Create Task', 'create-task', { title: 'Upload Series B data room documents' }, true),
      action('Open Research Pack', 'create-research-pack', { researchPackId: 'pack-001' }),
      DISMISS(),
    ],
  },
  {
    key: 'singapore',
    test: /singapore|apac|changi|dbs|trip/i,
    packId: 'pack-002',
    actions: () => [
      action('Open Research Pack', 'create-research-pack', { researchPackId: 'pack-002' }, true),
      action('Create Task', 'create-task', { title: 'Prepare APAC pitch materials' }),
      DISMISS(),
    ],
  },
  {
    key: 'brightwave',
    test: /brightwave|competitor|competitive|landscape/i,
    packId: 'pack-001',
    actions: () => [
      action('Open Research Pack', 'create-research-pack', { researchPackId: 'pack-001' }, true),
      action('Search the web', 'web-search', { query: 'BrightWave AI enterprise pricing 2026' }),
      DISMISS(),
    ],
  },
];

// ── Intent → rich message ────────────────────────────────────────────────────

function fromIntent(
  sessionId: string,
  intent: IntentType,
  text: string,
): ChatMessageModel {
  const response = generateResponse(intent, text, { sessionId });
  const data = (response.data ?? {}) as Record<string, Record<string, string>>;

  switch (intent) {
    case 'create-task': {
      const task = data.task ?? {};
      return assistantMessage(sessionId, {
        type: 'artifact',
        textContent: "Here's the task I put together — say the word and I'll save it.",
        artifact: {
          id: `artifact-${generateId()}`,
          type: 'task-list',
          title: task.title ?? 'New task',
          contentMarkdown: `- **${task.title ?? 'New task'}**\n- Due: ${task.dueDate ?? 'not set'}\n- Priority: ${task.priority ?? 'medium'}`,
          createdAt: nowIso(),
          isEditable: true,
        },
        suggestedActions: [
          action('Create Task', 'create-task', { title: task.title ?? 'New task', dueDate: task.dueDate ?? null }, true),
          DISMISS(),
        ],
      });
    }

    case 'create-event': {
      const event = data.event ?? {};
      return assistantMessage(sessionId, {
        type: 'artifact',
        textContent: 'I can put this on your calendar:',
        artifact: {
          id: `artifact-${generateId()}`,
          type: 'event-summary',
          title: event.title ?? 'New meeting',
          contentMarkdown: `- **${event.title ?? 'New meeting'}**\n- Starts: ${event.start ? new Date(event.start).toLocaleString() : 'tomorrow'}\n- Location: ${event.location ?? 'Zoom'}`,
          createdAt: nowIso(),
          isEditable: true,
        },
        suggestedActions: [
          action(
            'Create Event',
            'create-event',
            { title: event.title ?? 'New meeting', startAt: event.start ?? null, location: event.location ?? 'Zoom' },
            true,
          ),
          DISMISS(),
        ],
      });
    }

    case 'draft-email': {
      const draft = (data.draft ?? {}) as unknown as {
        to?: Array<{ name: string; email: string }>;
        subject?: string;
        body?: string;
      };
      const recipient = draft.to?.[0];
      return assistantMessage(sessionId, {
        type: 'artifact',
        textContent: `Here's a draft${recipient ? ` for **${recipient.name}**` : ''} — review it before it goes out.`,
        artifact: {
          id: `artifact-${generateId()}`,
          type: 'email-draft',
          title: draft.subject ?? 'Draft email',
          contentMarkdown: `**To:** ${recipient?.email ?? 'recipient@example.com'}\n**Subject:** ${draft.subject ?? ''}\n\n${draft.body ?? ''}`,
          createdAt: nowIso(),
          isEditable: true,
        },
        suggestedActions: [
          action('Send Email', 'send-email', { subject: draft.subject ?? null }, true),
          action('Create follow-up Task', 'create-task', {
            title: `Follow up: ${draft.subject ?? 'email'}`,
          }),
          DISMISS(),
        ],
      });
    }

    case 'find-emails':
      return assistantMessage(sessionId, {
        textContent: response.content,
        suggestedActions: [
          action('Open Inbox', 'open-email', {}, true),
          action('Create follow-up Task', 'create-task', { title: 'Reply to flagged emails' }),
          DISMISS(),
        ],
      });

    case 'find-contact':
      return assistantMessage(sessionId, {
        textContent: response.content,
        suggestedActions: [
          action('Draft an email', 'summarize', { query: `Draft an email to ${text}` }, true),
          DISMISS(),
        ],
      });

    case 'create-research-pack':
      return assistantMessage(sessionId, {
        textContent: response.content,
        suggestedActions: [
          action(
            'Create Research Pack',
            'create-research-pack',
            { title: text.slice(0, 60), query: text },
            true,
          ),
          action('Search the web first', 'web-search', { query: text }),
          DISMISS(),
        ],
      });

    case 'search-web':
      return assistantMessage(sessionId, {
        textContent: response.content,
        suggestedActions: [
          action('Search the web', 'web-search', { query: text }, true),
          DISMISS(),
        ],
      });

    case 'show-followups':
      return assistantMessage(sessionId, {
        textContent: response.content,
        suggestedActions: [
          action('Create Task', 'create-task', { title: 'Send outstanding follow-ups' }, true),
          action('Open Inbox', 'open-email', {}),
          DISMISS(),
        ],
      });

    case 'summarize':
      return assistantMessage(sessionId, {
        textContent: response.content,
        suggestedActions: [
          action('Create Task', 'create-task', { title: 'Work through the daily brief' }, true),
          action("What's due this week?", 'summarize', { query: "What's due this week?" }),
        ],
      });

    default:
      return assistantMessage(sessionId, {
        textContent: response.content,
        suggestedActions: [
          action('Give me a daily brief', 'summarize', { query: 'Give me a daily brief' }, true),
          action('Search the web', 'web-search', { query: text }),
        ],
      });
  }
}

function buildAssistantReply(sessionId: string, text: string): ChatMessageModel {
  const topic = TOPIC_MATCHERS.find((t) => t.test.test(text));
  if (topic) {
    return assistantMessage(sessionId, {
      type: topic.packId ? 'research-pack-summary' : 'action-suggestion',
      textContent: mockChatResponses[topic.key],
      researchPackSummaryId: topic.packId,
      suggestedActions: topic.actions(),
      tokensUsed: 280 + Math.floor(Math.random() * 300),
    });
  }
  return fromIntent(sessionId, detectIntent(text), text);
}

// ── Web search ───────────────────────────────────────────────────────────────

async function runWebSearch(query: string): Promise<WebSearchResult[]> {
  const raw = await mockApi.chat.searchWeb(query);

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3);

  const curated = mockWebSearchResults.filter((r) =>
    terms.some((t) => `${r.title} ${r.snippet} ${r.sourceName ?? ''}`.toLowerCase().includes(t)),
  );

  const live: WebSearchResult[] = raw.map((r, i) => ({
    id: `sr-live-${generateId()}`,
    title: r.title,
    url: r.url,
    displayUrl: r.source,
    snippet: r.snippet,
    publishedAt: nowIso(),
    faviconUrl: null,
    imageUrl: null,
    sourceName: r.source,
    relevanceScore: Math.max(0.5, 0.86 - i * 0.06),
  }));

  return [...(curated.length > 0 ? curated : mockWebSearchResults.slice(0, 2)), ...live];
}

// ── Greeting ─────────────────────────────────────────────────────────────────

/** A session untouched for this long is reopened as a fresh conversation. */
const STALE_SESSION_MS = 6 * 60 * 60 * 1000;

function greetingText(): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    `${part} — I'm **Busy.me**, your AI chief of staff.\n\n` +
    `I can see across your inbox, calendar, tasks, contacts and research packs, so ask me anything about what's going on:\n\n` +
    `- **Catch up** — "What happened with Meridian this week?"\n` +
    `- **Plan** — "What's due this week?"\n` +
    `- **Draft** — "Write a follow-up email to Marcus"\n` +
    `- **Research** — turn on web search and I'll cite live sources\n\n` +
    `Anything you like the look of, add it to your **Workboard** and I'll turn the collection into a Research Pack.`
  );
}

function greetingMessage(sessionId: string): ChatMessageModel {
  return assistantMessage(sessionId, {
    type: 'action-suggestion',
    textContent: greetingText(),
    suggestedActions: [
      action("What's urgent today?", 'summarize', { query: "What's urgent today?" }, true),
      action('Catch me up on Meridian', 'summarize', {
        query: 'Catch me up on the Meridian Health partnership',
      }),
      action('Prepare for investor call', 'summarize', {
        query: 'Prepare me for the investor call',
      }),
    ],
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const currentSession = useChatStore((s) => s.currentSession);
  const isTyping = useChatStore((s) => s.isTyping);
  const isSearchingWeb = useChatStore((s) => s.isSearchingWeb);
  const workboardCount = useChatStore((s) => s.workboard.length);
  const chatError = useChatStore((s) => s.error);
  const createSession = useChatStore((s) => s.createSession);
  const addToast = useUIStore((s) => s.addToast);

  const [isWorkboardOpen, setIsWorkboardOpen] = useState(false);
  const [searchPanel, setSearchPanel] = useState<{
    open: boolean;
    query: string;
    results: WebSearchResult[];
  }>({ open: false, query: '', results: [] });

  const didGreetRef = useRef(false);
  const messages = currentSession?.messages ?? [];

  // ── Initial greeting ────────────────────────────────────────────────────
  // A conversation that has gone cold is not worth resuming: open a fresh
  // session with the greeting instead, leaving the old one in the history.
  useEffect(() => {
    if (didGreetRef.current) return;
    didGreetRef.current = true;

    const state = useChatStore.getState();
    const existing = state.currentSession;
    const lastActivity = existing?.lastMessageAt ?? existing?.updatedAt ?? null;
    const isStale =
      !existing ||
      existing.messages.length === 0 ||
      !lastActivity ||
      Date.now() - Date.parse(lastActivity) > STALE_SESSION_MS;

    if (!isStale) return;

    const session = state.createSession('New chat');
    appendMessage(session.id, greetingMessage(session.id));
  }, []);

  // ── Send ────────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      const state = useChatStore.getState();
      const session = state.currentSession ?? state.createSession(text.slice(0, 60));
      const sessionId = session.id;

      appendMessage(sessionId, userMessage(sessionId, text));
      useChatStore.setState({ isTyping: true, error: null });

      try {
        if (useChatStore.getState().webSearchEnabled) {
          useChatStore.setState({ isSearchingWeb: true });
          setSearchPanel({ open: true, query: text, results: [] });

          const results = await runWebSearch(text);

          setSearchPanel({ open: true, query: text, results });
          useChatStore.setState({ isSearchingWeb: false });

          appendMessage(
            sessionId,
            assistantMessage(sessionId, {
              type: 'search-results',
              textContent:
                `I searched the web for **"${text}"** and found ${results.length} relevant source${results.length === 1 ? '' : 's'}.\n\n` +
                `The strongest match is **${results[0]?.sourceName ?? results[0]?.displayUrl ?? 'the top result'}**. Add anything useful to your Workboard and I'll compile it into a Research Pack.`,
              searchResults: results,
              suggestedActions: [
                action(
                  'Create Research Pack',
                  'create-research-pack',
                  { title: text.slice(0, 60), query: text },
                  true,
                ),
                action('Search again', 'web-search', { query: text }),
                DISMISS(),
              ],
            }),
          );
        } else {
          // Thinking pause — long enough to read as deliberate, short enough to feel fast.
          await simulateDelay(700, 1500);
          appendMessage(sessionId, buildAssistantReply(sessionId, text));
        }
      } catch (err) {
        useChatStore.setState({ error: (err as Error).message, isSearchingWeb: false });
        appendMessage(
          sessionId,
          assistantMessage(sessionId, {
            textContent: "I couldn't finish that request.",
            error: (err as Error).message,
          }),
        );
      } finally {
        useChatStore.setState({ isTyping: false, isSearchingWeb: false });
      }
    },
    [],
  );

  // ── Web search triggered from an action button ──────────────────────────
  const handleWebSearch = useCallback(async (query: string) => {
    const state = useChatStore.getState();
    const session = state.currentSession ?? state.createSession(query.slice(0, 60));
    const sessionId = session.id;

    setSearchPanel({ open: true, query, results: [] });
    useChatStore.setState({ isSearchingWeb: true, isTyping: true, error: null });

    try {
      const results = await runWebSearch(query);
      setSearchPanel({ open: true, query, results });
      appendMessage(
        sessionId,
        assistantMessage(sessionId, {
          type: 'search-results',
          textContent: `Live results for **"${query}"**:`,
          searchResults: results,
          suggestedActions: [
            action(
              'Create Research Pack',
              'create-research-pack',
              { title: query.slice(0, 60), query },
              true,
            ),
            DISMISS(),
          ],
        }),
      );
    } catch (err) {
      useChatStore.setState({ error: (err as Error).message });
    } finally {
      useChatStore.setState({ isSearchingWeb: false, isTyping: false });
    }
  }, []);

  const handleViewAllResults = useCallback((message: ChatMessageModel) => {
    setSearchPanel({
      open: true,
      query: '',
      results: message.searchResults ?? [],
    });
  }, []);

  const handleNewChat = useCallback(() => {
    const session = createSession('New chat');
    appendMessage(session.id, greetingMessage(session.id));
    setSearchPanel({ open: false, query: '', results: [] });
    addToast({ variant: 'info', title: 'New conversation started' });
  }, [createSession, addToast]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-orange-500" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="text-base font-bold tracking-tight text-gray-900">
            Busy<span className="text-orange-500">.</span>me
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleNewChat}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Start a new conversation"
          >
            <SquarePen className="h-5 w-5" />
          </button>

          <NotificationBell />

          <button
            type="button"
            onClick={() => setIsWorkboardOpen(true)}
            className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label={
              workboardCount > 0
                ? `Workboard, ${workboardCount} item${workboardCount === 1 ? '' : 's'}`
                : 'Workboard'
            }
          >
            <Layers className="h-5 w-5" />
            {workboardCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {workboardCount > 99 ? '99+' : workboardCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {chatError && (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{chatError}</span>
          <button
            type="button"
            onClick={() => useChatStore.setState({ error: null })}
            className="rounded p-0.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Transcript + web results panel ──────────────────────────────── */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          isTyping={isTyping}
          typingLabel={isSearchingWeb ? 'Searching the web…' : null}
          onSendMessage={handleSend}
          onWebSearch={handleWebSearch}
          onViewAllResults={handleViewAllResults}
        />

        {searchPanel.open && (
          <div className="bottom-sheet-panel absolute inset-x-0 bottom-0 z-20 h-[62%] overflow-hidden rounded-t-2xl border-t border-gray-100 bg-gray-50">
            <WebSearchResults
              results={searchPanel.results}
              query={searchPanel.query || null}
              isLoading={isSearchingWeb}
              onClose={() => setSearchPanel((p) => ({ ...p, open: false }))}
            />
          </div>
        )}
      </div>

      {/* ── Composer ────────────────────────────────────────────────────── */}
      <ChatComposer onSend={handleSend} disabled={isTyping} suggestions={DEFAULT_SUGGESTIONS} />

      {/* ── Workboard ───────────────────────────────────────────────────── */}
      <Workboard open={isWorkboardOpen} onClose={() => setIsWorkboardOpen(false)} />
    </div>
  );
}
