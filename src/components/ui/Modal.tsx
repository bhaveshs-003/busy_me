import { useRef } from 'react'
import { X } from 'lucide-react'
import { useOverlay } from '@/lib/useOverlay'

type ModalVariant = 'small' | 'medium' | 'large' | 'fullscreen'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  variant?: ModalVariant
  showCloseButton?: boolean
}

const SIZE_CLASSES: Record<ModalVariant, string> = {
  small: 'max-w-sm w-full',
  medium: 'max-w-lg w-full',
  large: 'max-w-2xl w-full',
  fullscreen: 'w-full h-full max-w-none rounded-none',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'medium',
  showCloseButton = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useOverlay(open, onClose, dialogRef)

  if (!open) return null

  const isFullscreen = variant === 'fullscreen'

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={dialogRef}
        className={`relative bg-white rounded-lg animate-slide-up flex flex-col ${SIZE_CLASSES[variant]} ${isFullscreen ? 'h-full' : 'max-h-[90%]'}`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 ml-auto active:opacity-60 transition-opacity"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default Modal
