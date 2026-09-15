import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOverlay } from '@/lib/useOverlay'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/** Drag distance (px) past which releasing dismisses the sheet. */
const DISMISS_THRESHOLD = 96

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  useOverlay(open, onClose, panelRef)

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return
    // Only allow dragging downwards.
    setDragOffset(Math.max(0, e.clientY - dragStartY.current))
  }, [])

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartY.current === null) return
      const distance = e.clientY - dragStartY.current

      dragStartY.current = null
      setDragOffset(0)

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }

      if (distance > DISMISS_THRESHOLD) onClose()
    },
    [onClose]
  )

  if (!open || typeof document === 'undefined') return null

  const isDragging = dragOffset > 0

  // Portal into the phone frame's overlay root. Rendering in place anchors the
  // sheet to whatever positioned ancestor happens to be nearest — which, on a
  // scrollable page, means the sheet scrolls away with the content instead of
  // sitting against the bottom of the frame.
  const overlayRoot = document.getElementById('overlay-root') ?? document.body

  return createPortal(
    <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 bottom-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet Panel */}
      <div
        ref={panelRef}
        className={`relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col ${
          isDragging ? '' : 'bottom-sheet-panel transition-transform duration-200'
        }`}
        style={isDragging ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" aria-hidden="true" />
        </div>
        {title && (
          <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 text-center">{title}</h2>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    overlayRoot
  )
}

export default BottomSheet
