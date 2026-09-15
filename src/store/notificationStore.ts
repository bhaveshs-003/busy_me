import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationType } from '@/types/index';
import { mockNotifications } from '@/data/notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  error: string | null;

  // Actions
  addNotification: (
    input: Omit<Notification, 'id' | 'isRead' | 'isDismissed' | 'readAt' | 'createdAt' | 'userId'>
  ) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  dismissNotification: (id: string) => void;
  openCenter: () => void;
  closeCenter: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeUnread(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead && !n.isDismissed).length;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      // ── Initial state ──────────────────────────────────────────────────
      notifications: mockNotifications,
      unreadCount: computeUnread(mockNotifications),
      isOpen: false,
      error: null,

      // ── Actions ────────────────────────────────────────────────────────

      addNotification: (input) => {
        const notification: Notification = {
          ...input,
          id: `notif-${Date.now()}`,
          userId: 'user-001',
          isRead: false,
          isDismissed: false,
          readAt: null,
          createdAt: new Date().toISOString(),
        };
        set((s) => {
          const updated = [notification, ...s.notifications];
          return { notifications: updated, unreadCount: computeUnread(updated) };
        });
      },

      markRead: (id: string) => {
        set((s) => {
          const updated = s.notifications.map((n) =>
            n.id === id
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          );
          return { notifications: updated, unreadCount: computeUnread(updated) };
        });
      },

      markAllRead: () => {
        const readAt = new Date().toISOString();
        set((s) => {
          const updated = s.notifications.map((n) => ({ ...n, isRead: true, readAt }));
          return { notifications: updated, unreadCount: 0 };
        });
      },

      deleteNotification: (id: string) => {
        set((s) => {
          const updated = s.notifications.filter((n) => n.id !== id);
          return { notifications: updated, unreadCount: computeUnread(updated) };
        });
      },

      dismissNotification: (id: string) => {
        set((s) => {
          const updated = s.notifications.map((n) =>
            n.id === id ? { ...n, isDismissed: true } : n
          );
          return { notifications: updated, unreadCount: computeUnread(updated) };
        });
      },

      openCenter: () => {
        set({ isOpen: true });
      },

      closeCenter: () => {
        set({ isOpen: false });
      },
    }),
    {
      name: 'busyme_notifications',
      partialize: (s) => ({
        notifications: s.notifications,
        unreadCount: s.unreadCount,
      }),
    }
  )
);
