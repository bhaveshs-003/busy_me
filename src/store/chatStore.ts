import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatSession, ChatMessage, WorkboardItem, ResearchPack } from '@/types/index';
import { mockApi } from '@/services/mockApi';
import { mockChatSessions } from '@/data/chats';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatStore {
  // State
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isTyping: boolean;
  isSearchingWeb: boolean;
  webSearchEnabled: boolean;
  workboard: WorkboardItem[];
  error: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  createSession: (title?: string) => ChatSession;
  switchSession: (sessionId: string) => void;
  clearSession: (sessionId: string) => void;
  addToWorkboard: (item: Omit<WorkboardItem, 'id' | 'addedAt' | 'sortOrder'>) => void;
  removeFromWorkboard: (itemId: string) => void;
  createResearchPackFromWorkboard: () => ResearchPack;
  searchWeb: (query: string) => Promise<void>;
  toggleWebSearch: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function buildSession(title?: string): ChatSession {
  return {
    id: `session-${Date.now()}`,
    userId: 'user-001',
    title: title ?? null,
    messages: [],
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
    lastMessageAt: null,
    totalMessages: 0,
  };
}

function buildUserMessage(sessionId: string, content: string): ChatMessage {
  return {
    id: `msg-${Date.now()}-u`,
    sessionId,
    role: 'user',
    type: 'text',
    textContent: content,
    isStreaming: false,
    createdAt: now(),
    error: null,
  };
}

function buildAssistantMessage(sessionId: string, content: string): ChatMessage {
  return {
    id: `msg-${Date.now()}-a`,
    sessionId,
    role: 'assistant',
    type: 'text',
    textContent: content,
    isStreaming: false,
    createdAt: now(),
    error: null,
  };
}

function buildWorkboardItem(
  input: Omit<WorkboardItem, 'id' | 'addedAt' | 'sortOrder'>,
  order: number
): WorkboardItem {
  return {
    ...input,
    id: `wb-${Date.now()}`,
    addedAt: now(),
    sortOrder: order,
    isHighlighted: false,
    tags: input.tags ?? [],
    metadata: input.metadata ?? {},
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      sessions: mockChatSessions,
      currentSession: mockChatSessions[0] ?? null,
      isTyping: false,
      isSearchingWeb: false,
      webSearchEnabled: false,
      workboard: [],
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      sendMessage: async (content: string) => {
        let { currentSession } = get();
        if (!currentSession) {
          currentSession = get().createSession();
        }

        const sessionId = currentSession.id;
        const userMsg = buildUserMessage(sessionId, content);

        // Append user message immediately.
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  messages: [...sess.messages, userMsg],
                  totalMessages: sess.totalMessages + 1,
                  lastMessageAt: now(),
                  updatedAt: now(),
                }
              : sess
          ),
          currentSession: s.currentSession?.id === sessionId
            ? {
                ...s.currentSession,
                messages: [...s.currentSession.messages, userMsg],
                totalMessages: s.currentSession.totalMessages + 1,
              }
            : s.currentSession,
          isTyping: true,
          error: null,
        }));

        try {
          let responseContent: string;

          if (get().webSearchEnabled) {
            set({ isSearchingWeb: true });
            const results = await mockApi.chat.searchWeb(content);
            set({ isSearchingWeb: false });
            responseContent = `Here's what I found on the web:\n\n${results
              .map((r, i) => `**${i + 1}. [${r.title}](${r.url})**\n${r.snippet}`)
              .join('\n\n')}`;
          } else {
            const result = await mockApi.chat.send(content, sessionId);
            responseContent = result.content;
          }

          const assistantMsg = buildAssistantMessage(sessionId, responseContent);

          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === sessionId
                ? {
                    ...sess,
                    messages: [...sess.messages, assistantMsg],
                    totalMessages: sess.totalMessages + 1,
                    title: sess.title ?? content.slice(0, 60),
                    lastMessageAt: now(),
                    updatedAt: now(),
                  }
                : sess
            ),
            currentSession: s.currentSession?.id === sessionId
              ? {
                  ...s.currentSession,
                  messages: [...s.currentSession.messages, assistantMsg],
                  totalMessages: s.currentSession.totalMessages + 1,
                  title: s.currentSession.title ?? content.slice(0, 60),
                }
              : s.currentSession,
            isTyping: false,
            isSearchingWeb: false,
          }));
        } catch (err) {
          set({ isTyping: false, isSearchingWeb: false, error: (err as Error).message });
        }
      },

      createSession: (title?: string) => {
        const session = buildSession(title);
        set((s) => ({
          sessions: [session, ...s.sessions],
          currentSession: session,
        }));
        return session;
      },

      switchSession: (sessionId: string) => {
        const session = get().sessions.find((s) => s.id === sessionId) ?? null;
        set({ currentSession: session });
      },

      clearSession: (sessionId: string) => {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, messages: [], totalMessages: 0, updatedAt: now() }
              : sess
          ),
          currentSession: s.currentSession?.id === sessionId
            ? { ...s.currentSession, messages: [], totalMessages: 0 }
            : s.currentSession,
        }));
      },

      addToWorkboard: (input) => {
        const order = get().workboard.length;
        const item = buildWorkboardItem(input, order);
        set((s) => ({ workboard: [...s.workboard, item] }));
      },

      removeFromWorkboard: (itemId: string) => {
        set((s) => ({
          workboard: s.workboard.filter((i) => i.id !== itemId),
        }));
      },

      createResearchPackFromWorkboard: () => {
        const { workboard } = get();
        const pack: ResearchPack = {
          id: `pack-${Date.now()}`,
          title: 'Research Pack from Workboard',
          coverImageUrl: null,
          color: '#6366f1',
          linkedContactIds: [],
          linkedEmailIds: [],
          linkedEventIds: [],
          linkedTaskIds: [],
          linkedNoteIds: [],
          linkedFileIds: [],
          timeline: workboard.map((item, idx) => ({
            id: `tl-wb-${idx}`,
            researchPackId: `pack-${Date.now()}`,
            type: 'web-search' as const,
            title: item.title,
            summary: item.snippet,
            occurredAt: item.addedAt,
            addedAt: now(),
            sourceUrl: item.type === 'web-result' ? undefined : undefined,
            linkedEntityId: item.linkedEntityId,
            metadata: item.metadata,
            isAIGenerated: false,
          })),
          aiSummary: null,
          aiKeyInsights: [],
          aiNextSteps: [],
          createdAt: now(),
          updatedAt: now(),
          startedAt: now(),
          completedAt: null,
          dueDate: null,
          createdById: 'user-001',
          isShared: false,
          sharedWithEmails: [],
          watchKeywords: [],
          autoAddFromConnectors: false,
          lastActivityAt: now(),
        };
        // Clear workboard after conversion.
        set({ workboard: [] });
        return pack;
      },

      searchWeb: async (query: string) => {
        set({ isSearchingWeb: true, error: null });
        try {
          const results = await mockApi.chat.searchWeb(query);
          const content = results
            .map((r, i) => `**${i + 1}. [${r.title}](${r.url})**\n${r.snippet}`)
            .join('\n\n');
          const { currentSession } = get();
          if (currentSession) {
            const msg = buildAssistantMessage(currentSession.id, content);
            set((s) => ({
              sessions: s.sessions.map((sess) =>
                sess.id === currentSession.id
                  ? { ...sess, messages: [...sess.messages, msg] }
                  : sess
              ),
              currentSession: { ...currentSession, messages: [...currentSession.messages, msg] },
            }));
          }
          set({ isSearchingWeb: false });
        } catch (err) {
          set({ isSearchingWeb: false, error: (err as Error).message });
        }
      },

      toggleWebSearch: () => {
        set((s) => ({ webSearchEnabled: !s.webSearchEnabled }));
      },
    }),
    {
      name: 'busyme_chat',
      partialize: (s) => ({
        sessions: s.sessions,
        currentSession: s.currentSession,
        workboard: s.workboard,
        webSearchEnabled: s.webSearchEnabled,
      }),
    }
  )
);
