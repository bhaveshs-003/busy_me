import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useUIStore, type ToastItem, type ToastVariant } from '@/store/uiStore'

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-orange-50 border-orange-200 text-orange-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const ICON_STYLES: Record<ToastVariant, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-orange-500',
  info: 'text-blue-500',
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const removeToast = useUIStore((s) => s.removeToast)
  const Icon = ICONS[toast.variant]

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border animate-slide-down max-w-sm w-full pointer-events-auto ${STYLES[toast.variant]}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${ICON_STYLES[toast.variant]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-80 mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-0.5 rounded-md hover:bg-black/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="absolute z-[100] pointer-events-none top-4 inset-x-0 flex flex-col gap-2 items-center w-full px-4">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

export default ToastContainer
