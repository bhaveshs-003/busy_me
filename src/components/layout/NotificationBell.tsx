import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'

interface NotificationBellProps {
  className?: string
}

/**
 * Opens the notification center. Drop into `PageHeader`'s `rightActions` so the
 * center is reachable on mobile, where the bottom nav has no room for it.
 */
export function NotificationBell({ className = '' }: NotificationBellProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const openCenter = useNotificationStore((s) => s.openCenter)

  return (
    <button
      type="button"
      onClick={openCenter}
      className={`relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${className}`}
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default NotificationBell
