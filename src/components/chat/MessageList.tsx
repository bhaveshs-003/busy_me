import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import type { ChatMessage as ChatMessageModel } from '@/types/index';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

// =============================================================================
// MessageList — scrollable transcript, newest at the bottom
// =============================================================================

export interface MessageListProps {
  messages: ChatMessageModel[];
  isTyping?: boolean;
  /** Status line for the typing bubble, e.g. "Searching the web…". */
  typingLabel?: string | null;
  onSendMessage?: (text: string) => void;
  onWebSearch?: (query: string) => void;
  onViewAllResults?: (message: ChatMessageModel) => void;
  /** Replaces the built-in empty state. */
  emptyState?: ReactNode;
  className?: string;
}

/** Minimum silence between two messages before a time divider is drawn. */
const TIME_GAP_MS = 10 * 60 * 1000;
/** How far from the bottom the user can be and still be "following" the chat. */
const PIN_THRESHOLD_PX = 120;

function formatDivider(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfMessageDay.getTime()) / 86_400_000,
  );

  if (dayDiff === 0) return `Today · ${time}`;
  if (dayDiff === 1) return `Yesterday · ${time}`;
  if (dayDiff > 1 && dayDiff < 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'long' })} · ${time}`;
  }
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time}`;
}

function TimeDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1" role="separator">
      <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
      <span className="text-[11px] font-medium text-gray-400">{label}</span>
      <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
    </div>
  );
}

function DefaultEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div
        aria-hidden="true"
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-orange-50"
      >
        <Sparkles className="h-6 w-6 text-orange-500" />
      </div>
      <h2 className="text-base font-semibold text-gray-900">Ask Busy.me anything</h2>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">
        Your email, calendar, tasks and research packs are all connected. Start with
        one of the suggestions below.
      </p>
    </div>
  );
}

export function MessageList({
  messages,
  isTyping = false,
  typingLabel = null,
  onSendMessage,
  onWebSearch,
  onViewAllResults,
  emptyState,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasRenderedRef = useRef(false);
  const [isPinned, setIsPinned] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return;
    // `scrollTo` (rather than scrollIntoView) keeps the page around the list still.
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinned(distance <= PIN_THRESHOLD_PX);
  }, []);

  // Jump to the newest message — instantly on first paint, smoothly afterwards.
  useEffect(() => {
    if (!hasRenderedRef.current) {
      hasRenderedRef.current = true;
      scrollToBottom('auto');
      return;
    }
    if (isPinned) scrollToBottom('smooth');
    // `isPinned` is intentionally read, not tracked — re-running on pin changes
    // alone would yank the view while the user is reading history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isTyping, scrollToBottom]);

  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {isEmpty ? (
          (emptyState ?? <DefaultEmptyState />)
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4">
            {messages.map((message, index) => {
              const previous = index > 0 ? messages[index - 1] : null;
              const gapMs = previous
                ? Date.parse(message.createdAt) - Date.parse(previous.createdAt)
                : Number.POSITIVE_INFINITY;
              const showDivider = !previous || (Number.isFinite(gapMs) ? gapMs > TIME_GAP_MS : true);
              const showAvatar =
                showDivider || !previous || previous.role !== message.role;

              return (
                <Fragment key={message.id}>
                  {showDivider && <TimeDivider label={formatDivider(message.createdAt)} />}
                  <ChatMessage
                    message={message}
                    showAvatar={showAvatar}
                    onSendMessage={onSendMessage}
                    onWebSearch={onWebSearch}
                    onViewAllResults={onViewAllResults}
                  />
                </Fragment>
              );
            })}

            {isTyping && <TypingIndicator label={typingLabel} />}

            <div ref={bottomRef} className="h-1 w-full flex-shrink-0" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Jump to latest — only while the user is reading back. */}
      {!isPinned && !isEmpty && (
        <button
          type="button"
          onClick={() => {
            scrollToBottom('smooth');
            setIsPinned(true);
          }}
          className="absolute bottom-3 left-1/2 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          Jump to latest
        </button>
      )}
    </div>
  );
}

export default MessageList;
