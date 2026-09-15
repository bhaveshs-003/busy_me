import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Camera,
  FileText,
  Globe,
  HardDrive,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Square,
  X,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { mockFiles } from '@/data/mockFiles';
import { cn, formatFileSize } from '@/lib/utils';

// =============================================================================
// ChatComposer — sticky input bar with voice, attachments and web search
// =============================================================================

export interface ChatComposerProps {
  onSend: (text: string) => void;
  /** Blocks sending while the assistant is still answering. */
  disabled?: boolean;
  /** Tap-to-send prompt chips rendered above the input. */
  suggestions?: string[];
  showSuggestions?: boolean;
  placeholder?: string;
  className?: string;
}

export const DEFAULT_SUGGESTIONS = [
  'Find latest from Meridian',
 "What's due this week?",
  'Draft follow-up email',
  'Summarize Project Atlas',
];

/** Phrases the simulated speech-to-text engine "hears". */
const VOICE_TRANSCRIPTS = [
  'What happened with the Meridian Health partnership this week?',
  'Draft a follow-up email to Marcus about the launch timeline',
  'What are my most urgent tasks today?',
  'Summarize where Project Atlas stands against the feature freeze',
];

const MAX_TEXTAREA_HEIGHT = 160;
const LISTENING_MS = 2000;

interface Attachment {
  id: string;
  name: string;
  size: string;
}

export function ChatComposer({
  onSend,
  disabled = false,
  suggestions = DEFAULT_SUGGESTIONS,
  showSuggestions = true,
  placeholder = 'Message Busy.me…',
  className,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const webSearchEnabled = useChatStore((s) => s.webSearchEnabled);
  const toggleWebSearch = useChatStore((s) => s.toggleWebSearch);
  const addToast = useUIStore((s) => s.addToast);

  const canSend = value.trim().length > 0 && !disabled && !isListening;

  // ── Auto-expanding textarea ─────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  useEffect(
    () => () => {
      if (listenTimer.current) clearTimeout(listenTimer.current);
    },
    [],
  );

  // ── Sending ─────────────────────────────────────────────────────────────
  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || disabled) return;

      const suffix =
        attachments.length > 0
          ? `\n\n*Attached: ${attachments.map((a) => a.name).join(', ')}*`
          : '';

      onSend(trimmed + suffix);
      setValue('');
      setAttachments([]);
      // Keep the keyboard up for the next turn.
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [attachments, disabled, onSend],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(value);
    }
  }

  // ── Voice simulation ────────────────────────────────────────────────────
  function handleMic() {
    if (isListening) {
      if (listenTimer.current) clearTimeout(listenTimer.current);
      listenTimer.current = null;
      setIsListening(false);
      return;
    }

    setIsListening(true);
    listenTimer.current = setTimeout(() => {
      const transcript = VOICE_TRANSCRIPTS[Math.floor(Math.random() * VOICE_TRANSCRIPTS.length)];
      setValue((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
      setIsListening(false);
      listenTimer.current = null;
      textareaRef.current?.focus();
    }, LISTENING_MS);
  }

  // ── Attachments ─────────────────────────────────────────────────────────
  function attach(name: string, size: string) {
    setAttachments((prev) =>
      prev.some((a) => a.name === name)
        ? prev
        : [...prev, { id: `att-${Date.now()}-${prev.length}`, name, size }],
    );
    setIsPickerOpen(false);
    addToast({ variant: 'success', title: 'Attached', message: name });
  }

  const recentFiles = mockFiles.slice(0, 5);

  return (
    <div
      className={cn(
        'flex-shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur safe-bottom',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-3xl px-3 pb-3 pt-2">
        {/* ── Suggested prompt chips ─────────────────────────────────── */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="scrollbar-hide -mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-0.5">
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={disabled}
                onClick={() => submit(prompt)}
                className="inline-flex h-8 flex-shrink-0 items-center rounded-full border border-gray-100 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* ── Web search active banner ───────────────────────────────── */}
        {webSearchEnabled && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 animate-slide-up">
            <Globe className="h-3.5 w-3.5 flex-shrink-0 text-orange-600" aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-orange-800">
              Web search active — answers will cite live sources
            </p>
            <button
              type="button"
              onClick={toggleWebSearch}
              className="flex-shrink-0 rounded-md p-0.5 text-orange-500 transition-colors hover:bg-orange-100 hover:text-orange-700"
              aria-label="Turn off web search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Attachment chips ───────────────────────────────────────── */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 pl-2 pr-1 text-xs text-gray-700"
              >
                <FileText className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                <span className="truncate">{a.name}</span>
                <span className="flex-shrink-0 text-gray-400">{a.size}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                  className="flex-shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ── Input row ──────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-end gap-1 rounded-lg border bg-white p-1.5 transition-colors',
            isListening ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-100',
          )}
        >
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            disabled={disabled}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
            aria-label="Add attachment"
          >
            <Paperclip className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            onClick={toggleWebSearch}
            disabled={disabled}
            aria-pressed={webSearchEnabled}
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40',
              webSearchEnabled
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
            aria-label={webSearchEnabled ? 'Turn off web search' : 'Turn on web search'}
          >
            <Globe className="h-[18px] w-[18px]" />
          </button>

          <div className="min-w-0 flex-1 px-1 py-1.5">
            {isListening ? (
              <div className="flex h-6 items-center gap-2" aria-live="polite">
                <span className="flex items-end gap-0.5" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="typing-dot w-0.5 rounded-full bg-orange-500"
                      style={{ height: `${8 + ((i % 3) + 1) * 3}px`, animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </span>
                <span className="text-sm font-medium text-orange-600">Listening…</span>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                disabled={disabled}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? 'Busy.me is replying…' : placeholder}
                aria-label="Message"
                className="max-h-40 w-full resize-none bg-transparent text-sm leading-6 text-gray-900 placeholder:text-gray-400 disabled:text-gray-400"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleMic}
            disabled={disabled}
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40',
              isListening
                ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
            aria-label={isListening ? 'Stop listening' : 'Dictate a message'}
          >
            {isListening ? (
              <Square className="h-[15px] w-[15px] fill-current" />
            ) : (
              <Mic className="h-[18px] w-[18px]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => submit(value)}
            disabled={!canSend}
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all',
              canSend
                ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                : 'cursor-not-allowed bg-gray-100 text-gray-400',
            )}
            aria-label="Send message"
          >
            <ArrowUp className="h-[18px] w-[18px]" />
          </button>
        </div>

        <p className="mt-1.5 text-center text-[11px] text-gray-400">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>

      {/* ── File picker bottom sheet ──────────────────────────────────── */}
      <BottomSheet open={isPickerOpen} onClose={() => setIsPickerOpen(false)} title="Add to message">
        <div className="px-4 pb-6 pt-1">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Photos', icon: ImageIcon, name: 'IMG_4821.HEIC', size: '3.1 MB' },
              { label: 'Camera', icon: Camera, name: 'Scan_2026-09-15.jpg', size: '1.4 MB' },
              { label: 'Drive', icon: HardDrive, name: 'Q4_Forecast.xlsx', size: '820 KB' },
            ].map(({ label, icon: Icon, name, size }) => (
              <button
                key={label}
                type="button"
                onClick={() => attach(name, size)}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-4 transition-colors hover:border-orange-200 hover:bg-orange-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-5 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Recent files
          </p>
          <ul className="space-y-1">
            {recentFiles.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  onClick={() => attach(file.filename, formatFileSize(file.sizeBytes))}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {file.filename}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {formatFileSize(file.sizeBytes)} · {file.category.toUpperCase()}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </BottomSheet>
    </div>
  );
}

export default ChatComposer;
