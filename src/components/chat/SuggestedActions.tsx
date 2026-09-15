import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  Check,
  FolderPlus,
  Globe,
  ListPlus,
  Loader2,
  Mail,
  NotebookPen,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import type { ChatSuggestedAction } from '@/types/index';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { useTaskStore } from '@/store/taskStore';
import { useEventStore } from '@/store/eventStore';
import { useNoteStore } from '@/store/noteStore';
import { useResearchPackStore } from '@/store/researchPackStore';
import { cn } from '@/lib/utils';

// =============================================================================
// SuggestedActions — inline action buttons attached to an AI message
// =============================================================================

export interface SuggestedActionsProps {
  actions: ChatSuggestedAction[];
  /** Re-ask the assistant (used by `summarize` actions). */
  onSendMessage?: (text: string) => void;
  /** Run a web search for the payload query. */
  onWebSearch?: (query: string) => void;
  className?: string;
}

type Payload = Record<string, string | number | boolean | null>;

function str(payload: Payload, key: string): string | null {
  const value = payload?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

const ACTION_ICON: Record<ChatSuggestedAction['actionType'], typeof ListPlus> = {
  'create-task': ListPlus,
  'create-event': CalendarPlus,
  'create-note': NotebookPen,
  'create-research-pack': FolderPlus,
  'send-email': Send,
  'open-email': Mail,
  'open-event': CalendarPlus,
  'web-search': Globe,
  summarize: Sparkles,
  dismiss: X,
};

export function SuggestedActions({
  actions,
  onSendMessage,
  onWebSearch,
  className,
}: SuggestedActionsProps) {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const createTask = useTaskStore((s) => s.createTask);
  const createEvent = useEventStore((s) => s.createEvent);
  const createNote = useNoteStore((s) => s.createNote);
  const createPack = useResearchPackStore((s) => s.createPack);
  const addToWorkboard = useChatStore((s) => s.addToWorkboard);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || actions.length === 0) return null;

  async function run(action: ChatSuggestedAction) {
    if (pendingId || doneIds.includes(action.id)) return;
    const payload = (action.payload ?? {}) as Payload;
    setPendingId(action.id);

    try {
      switch (action.actionType) {
        // ── Creates real entities in the stores ──────────────────────────
        case 'create-task': {
          const task = await createTask({
            title: str(payload, 'title') ?? action.label.replace(/^create task:?\s*/i, ''),
            description: str(payload, 'description'),
            dueDate:
              str(payload, 'dueDate') ??
              new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
            priority: 'high',
            createdByAI: true,
            aiSource: 'chat',
          });
          setDoneIds((d) => [...d, action.id]);
          addToast({
            variant: 'success',
            title: 'Task created',
            message: task.title,
          });
          addToWorkboard({
            type: 'task',
            linkedEntityId: task.id,
            title: task.title,
            subtitle: task.dueDate ? `Due ${task.dueDate}` : 'No due date',
            snippet: task.description,
            color: '#f97316',
            isHighlighted: false,
            tags: ['task'],
            metadata: {},
          });
          break;
        }

        case 'create-event': {
          const startAt =
            str(payload, 'startAt') ?? new Date(Date.now() + 86_400_000).toISOString();
          const event = await createEvent({
            title: str(payload, 'title') ?? action.label.replace(/^create event:?\s*/i, ''),
            description: str(payload, 'description'),
            location: str(payload, 'location') ?? 'Zoom',
            startAt,
            endAt: new Date(Date.parse(startAt) + 3_600_000).toISOString(),
          });
          setDoneIds((d) => [...d, action.id]);
          addToast({
            variant: 'success',
            title: 'Event added to calendar',
            message: event.title,
          });
          break;
        }

        case 'create-note': {
          const noteBody = str(payload, 'content') ?? '';
          const note = await createNote({
            title: str(payload, 'title') ?? action.label,
            bodyMarkdown: noteBody,
            bodyText: noteBody,
            createdByAI: true,
          });
          setDoneIds((d) => [...d, action.id]);
          addToast({ variant: 'success', title: 'Note created', message: note.title });
          break;
        }

        case 'create-research-pack': {
          const existingId = str(payload, 'researchPackId') ?? str(payload, 'packId');
          if (existingId) {
            navigate(`/research-packs/${existingId}`);
            break;
          }
          const pack = await createPack({
            title: str(payload, 'title') ?? 'Research Pack from chat',
            description: str(payload, 'query') ?? 'Started from a Busy.me conversation',
            tags: ['chat'],
          });
          setDoneIds((d) => [...d, action.id]);
          addToast({
            variant: 'success',
            title: 'Research Pack created',
            message: pack.title,
          });
          navigate(`/research-packs/${pack.id}`);
          break;
        }

        // ── Navigation ───────────────────────────────────────────────────
        case 'open-email': {
          const id = str(payload, 'emailId') ?? str(payload, 'id');
          navigate(id ? `/emails/${id}` : '/emails');
          break;
        }

        case 'open-event': {
          const id = str(payload, 'eventId') ?? str(payload, 'id');
          navigate(id ? `/events/${id}` : '/events');
          break;
        }

        case 'send-email': {
          setDoneIds((d) => [...d, action.id]);
          addToast({
            variant: 'success',
            title: 'Draft saved to Mail',
            message: str(payload, 'subject') ?? 'Open Mail to review and send.',
          });
          navigate('/emails');
          break;
        }

        // ── Conversational ───────────────────────────────────────────────
        case 'web-search': {
          const query = str(payload, 'query') ?? action.label;
          onWebSearch?.(query);
          break;
        }

        case 'summarize': {
          const packId = str(payload, 'researchPackId');
          const query = str(payload, 'query');
          if (query) onSendMessage?.(query);
          else if (packId) onSendMessage?.(`Summarize research pack ${packId}`);
          else onSendMessage?.(action.label);
          break;
        }

        case 'dismiss':
        default:
          setIsDismissed(true);
          break;
      }
    } catch (err) {
      addToast({
        variant: 'error',
        title: "Couldn't complete that action",
        message: (err as Error).message,
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {actions.map((action) => {
        const Icon = ACTION_ICON[action.actionType] ?? Sparkles;
        const isPending = pendingId === action.id;
        const isDone = doneIds.includes(action.id);
        const isSecondary = !action.isPrimary || action.actionType === 'dismiss';

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => void run(action)}
            disabled={isPending || isDone || Boolean(pendingId)}
            title={action.description ?? undefined}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold',
              'transition-colors disabled:cursor-default',
              isDone
                ? 'border-emerald-200 bg-gray-100 text-gray-500'
                : isSecondary
                  ? 'border-gray-100 bg-white text-gray-700 hover:border-gray-100 hover:bg-gray-50 disabled:opacity-60'
                  : 'border-transparent bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60',
            )}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : isDone ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isDone ? 'Done' : action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SuggestedActions;
