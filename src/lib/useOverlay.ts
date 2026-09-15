import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// Body scroll-lock is refcounted so that closing one overlay while another is
// still open does not restore scrolling prematurely.
let scrollLockCount = 0

function lockScroll(): () => void {
  if (scrollLockCount === 0) {
    document.body.style.overflow = 'hidden'
  }
  scrollLockCount += 1

  let released = false
  return () => {
    if (released) return
    released = true
    scrollLockCount -= 1
    if (scrollLockCount === 0) {
      document.body.style.overflow = ''
    }
  }
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => el.offsetParent !== null || el === document.activeElement)
}

/**
 * Shared behaviour for modal-like overlays (Modal, Drawer, BottomSheet):
 *
 *  - locks body scroll while open (refcounted across nested overlays)
 *  - closes on Escape
 *  - traps Tab focus inside the panel and restores focus to the previously
 *    focused element on close
 */
export function useOverlay(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
): void {
  // Keep the latest onClose without re-running the effect on every render.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const releaseScroll = lockScroll()
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Move focus into the panel.
    const panel = panelRef.current
    if (panel) {
      const focusable = getFocusable(panel)
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        panel.setAttribute('tabindex', '-1')
        panel.focus()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }

      if (e.key !== 'Tab') return

      const container = panelRef.current
      if (!container) return

      const focusable = getFocusable(container)
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      releaseScroll()
      previouslyFocused?.focus?.()
    }
  }, [open, panelRef])
}
