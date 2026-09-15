import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Mail,
  MailOpen,
  CheckSquare,
  AlertTriangle,
  Calendar,
  CalendarClock,
  Link2,
  Sparkles,
  FileSearch,
  ShieldAlert,
  CreditCard,
  Users,
} from 'lucide-react'
import { formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { useNotificationStore } from '@/store/notificationStore'
import type { Notification, NotificationType } from '@/types/index'

// ── Icon per notification type ────────────────────────────────────────────────
const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  'email-received': Mail,
  'email-reply': MailOpen,
  'task-due': CheckSquare,
  'task-overdue': AlertTriangle,
  'event-starting': CalendarClock,
  'event-invite': Calendar,
  'connector-expired': Link2,
  'connector-error': Link2,
  'ai-insight': Sparkles,
  'research-pack-update': FileSearch,
  'system-alert': ShieldAlert,
  'plan-expiring': CreditCard,
  'contact-activity': Users,
}

function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: Notification
  onNavigate: (n: Notification) => void
}) {
  const Icon = TYPE_ICONS[notification.type] ?? Bell
  const unread = !notification.isRead

  return (
    <button
      type="button"
      onClick={() => onNavigate(notification)}
      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
        unread ? 'bg-brand-50/50' : ''
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          unread ? 'bg-brand-100' : 'bg-gray-100'
        }`}
      >
        <Icon className={`w-4 h-4 ${unread ? 'text-brand-600' : 'text-gray-500'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            unread ? 'text-gray-900 font-medium' : 'text-gray-700'
          }`}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {unread && (
        <span
          className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2"
          aria-label="Unread"
        />
      )}
    </button>
  )
}

interface GroupedNotifications {
  today: Notification[]
  yesterday: Notification[]
  earlier: Notification[]
}

function groupNotifications(notifications: Notification[]): GroupedNotifications {
  const sorted = [...notifications].sort(
    (a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
  )

  return sorted.reduce<GroupedNotifications>(
    (acc, n) => {
      const date = parseISO(n.createdAt)
      if (isToday(date)) acc.today.push(n)
      else if (isYesterday(date)) acc.yesterday.push(n)
      else acc.earlier.push(n)
      return acc
    },
    { today: [], yesterday: [], earlier: [] }
  )
}

interface NotificationCenterProps {
  /** Called after a notification is opened, so the host sheet/dropdown can close. */
  onClose?: () => void
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const navigate = useNavigate()

  const visible = notifications.filter((n) => !n.isDismissed)
  const grouped = groupNotifications(visible)

  function handleNavigate(notification: Notification) {
    markRead(notification.id)
    if (notification.deepLinkPath) navigate(notification.deepLinkPath)
    onClose?.()
  }

  function renderGroup(label: string, items: Notification[]) {
    if (items.length === 0) return null
    return (
      <div key={label}>
        <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </span>
        </div>
        {items.map((n) => (
          <NotificationItem key={n.id} notification={n} onNavigate={handleNavigate} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-brand-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 px-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 text-center">No notifications yet</p>
          </div>
        ) : (
          <>
            {renderGroup('Today', grouped.today)}
            {renderGroup('Yesterday', grouped.yesterday)}
            {renderGroup('Earlier', grouped.earlier)}
          </>
        )}
      </div>
    </div>
  )
}

export default NotificationCenter
