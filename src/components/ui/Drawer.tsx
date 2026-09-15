import { useRef } from 'react'
import { X } from 'lucide-react'
import { useOverlay } from '@/lib/useOverlay'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  side?: 'left' | 'right'
}

export function Drawer({ open, onClose, title, children, side = 'left' }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useOverlay(open, onClose, panelRef)

  if (!open) return null

  const translateClass = side === 'left'
    ? 'left-0 animate-slide-in-left'
    : 'right-0 animate-slide-in-right'

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer Panel */}
      <div
        ref={panelRef}
        className={`absolute top-0 bottom-0 w-80 max-w-[85vw] bg-white flex flex-col ${translateClass}`}
      >
        {(title) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 ml-auto"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default Drawer
