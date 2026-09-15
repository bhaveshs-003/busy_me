import { useEffect, type ReactNode } from 'react'
import { demoConfig } from '@/config/demo'
import { OfflineBanner } from './OfflineBanner'
import { BottomNavigation } from './BottomNavigation'
import { NotificationCenter } from './NotificationCenter'
import { ToastContainer } from '@/components/ui/Toast'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useUIStore } from '@/store/uiStore'
import { useNotificationStore } from '@/store/notificationStore'
import { AlertTriangle, RefreshCw, ArrowUpCircle } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
}

function MaintenanceBanner() {
  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 flex-shrink-0">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <p className="text-sm font-medium">{demoConfig.maintenanceMessage}</p>
    </div>
  )
}

function UpdateAvailableBanner() {
  return (
    <div className="w-full bg-blue-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 flex-shrink-0">
      <ArrowUpCircle className="w-4 h-4 flex-shrink-0" />
      <p className="text-sm font-medium">{demoConfig.updateMessage}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-2 text-xs font-semibold bg-white/20 active:bg-white/30 px-2.5 py-1 rounded-lg transition-colors"
      >
        Update now
      </button>
    </div>
  )
}

function ForceUpdateBanner() {
  return (
    <div className="w-full bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-2 flex-shrink-0">
      <RefreshCw className="w-4 h-4 flex-shrink-0" />
      <p className="text-sm font-medium">{demoConfig.forceUpdateMessage}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-2 text-xs font-semibold bg-white/20 active:bg-white/30 px-2.5 py-1 rounded-lg transition-colors"
      >
        Update
      </button>
    </div>
  )
}

/**
 * The app renders as a single phone-width column, centred at every viewport
 * size. There is no desktop sidebar — on a wide screen the frame sits on a
 * neutral backdrop so the demo reads as a real mobile app.
 *
 * Everything that would be `fixed` on a real phone (bottom nav, sheets, toasts)
 * is positioned against this frame rather than the viewport, which is why the
 * frame establishes a stacking context with `relative`.
 */
export function AppShell({ children }: AppShellProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const setUnreadCount = useUIStore((s) => s.setUnreadCount)
  const isCenterOpen = useNotificationStore((s) => s.isOpen)
  const closeCenter = useNotificationStore((s) => s.closeCenter)

  // Mirror the notification unread count into the UI store so the nav badge
  // stays in sync without importing the notification store.
  useEffect(() => {
    setUnreadCount(unreadCount)
  }, [unreadCount, setUnreadCount])

  return (
    <div className="min-h-screen w-full bg-gray-100 flex justify-center">
      <div className="relative w-full max-w-[420px] min-h-screen h-screen bg-white flex flex-col overflow-hidden">
        {/* App lifecycle banners */}
        {demoConfig.offlineMode && <OfflineBanner />}
        {demoConfig.forceUpdate && <ForceUpdateBanner />}
        {!demoConfig.forceUpdate && demoConfig.updateAvailable && <UpdateAvailableBanner />}
        {demoConfig.maintenanceMode && <MaintenanceBanner />}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {children}
        </main>

        {/* Bottom nav — pinned to the frame, not the viewport */}
        <BottomNavigation />

        {/* Notification centre */}
        <BottomSheet open={isCenterOpen} onClose={closeCenter}>
          <div className="h-[70vh]">
            <NotificationCenter onClose={closeCenter} />
          </div>
        </BottomSheet>

        {/* Global toast notifications */}
        <ToastContainer />

        {/* Portal target for sheets, modals and dialogs.
            `fixed` rather than `absolute`: focusing a field inside a sheet makes
            the browser scroll the nearest scrollable ancestor — which is this
            frame, even though it is overflow-hidden — and absolutely-positioned
            children scroll away with it. Fixed positioning is immune to that,
            and the left-1/2 / max-w pair reproduces the frame's own geometry so
            overlays still sit exactly over the phone column. */}
        <div
          id="overlay-root"
          className="pointer-events-none fixed inset-y-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 empty:hidden [&>*]:pointer-events-auto"
        />
      </div>
    </div>
  )
}

export default AppShell
