import { create } from 'zustand'

// ── Toast ─────────────────────────────────────────────────────────────────────
export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  message?: string
  duration?: number
}

// ── Bottom Sheet ──────────────────────────────────────────────────────────────
export type BottomSheetType = 'notification-center' | 'filter' | 'sort' | 'share' | 'custom' | null

// ── Modal ─────────────────────────────────────────────────────────────────────
export type ModalType =
  | 'compose-email'
  | 'create-task'
  | 'create-event'
  | 'create-note'
  | 'create-research-pack'
  | 'create-contact'
  | 'confirm-delete'
  | 'settings'
  | 'custom'
  | null

// ── Drawer ────────────────────────────────────────────────────────────────────
export type DrawerType = 'navigation' | 'chat-history' | 'filters' | 'custom' | null

// ── Store ─────────────────────────────────────────────────────────────────────
interface UIState {
  // Toasts
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void

  // Bottom sheet
  activeBottomSheet: BottomSheetType
  bottomSheetProps: Record<string, unknown>
  openBottomSheet: (type: BottomSheetType, props?: Record<string, unknown>) => void
  closeBottomSheet: () => void

  // Modal
  activeModal: ModalType
  modalProps: Record<string, unknown>
  openModal: (type: ModalType, props?: Record<string, unknown>) => void
  closeModal: () => void

  // Drawer
  activeDrawer: DrawerType
  drawerProps: Record<string, unknown>
  openDrawer: (type: DrawerType, props?: Record<string, unknown>) => void
  closeDrawer: () => void

  // Notification badge count (derived from notificationStore, mirrored here for nav)
  unreadCount: number
  setUnreadCount: (count: number) => void
}

let toastId = 0

export const useUIStore = create<UIState>((set, get) => ({
  // ── Toasts ────────────────────────────────────────────────────────────────
  toasts: [],

  addToast: (toast) => {
    const id = String(++toastId)
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    const duration = toast.duration ?? 4000
    setTimeout(() => get().removeToast(id), duration)
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  activeBottomSheet: null,
  bottomSheetProps: {},
  openBottomSheet: (type, props = {}) => set({ activeBottomSheet: type, bottomSheetProps: props }),
  closeBottomSheet: () => set({ activeBottomSheet: null, bottomSheetProps: {} }),

  // ── Modal ─────────────────────────────────────────────────────────────────
  activeModal: null,
  modalProps: {},
  openModal: (type, props = {}) => set({ activeModal: type, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),

  // ── Drawer ────────────────────────────────────────────────────────────────
  activeDrawer: null,
  drawerProps: {},
  openDrawer: (type, props = {}) => set({ activeDrawer: type, drawerProps: props }),
  closeDrawer: () => set({ activeDrawer: null, drawerProps: {} }),

  // ── Unread count ──────────────────────────────────────────────────────────
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}))
