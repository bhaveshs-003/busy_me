import { useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query.
 *
 * Returns `false` during SSR / before hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void): (() => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const mql = window.matchMedia(query)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }

  const getSnapshot = (): boolean => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  }

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Tailwind's `md` breakpoint (768px) and up. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}
