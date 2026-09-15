/**
 * The rolling window that defines "this week" across the app.
 *
 * Ongoings is a digest of what is live right now, not an archive, so every
 * category is filtered to this window. Some entities look backwards (an email
 * arrived, a note was edited) and some look forwards (a task is due, an event is
 * scheduled), which is why there are two directional helpers rather than one.
 */

export const WINDOW_DAYS = 7

const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000

function parse(iso: string | null | undefined): number | null {
  if (!iso) return null
  const parsed = Date.parse(iso)
  return Number.isNaN(parsed) ? null : parsed
}

/** Happened within the last 7 days — for activity that is already in the past. */
export function isRecent(iso: string | null | undefined, now: number): boolean {
  const at = parse(iso)
  return at !== null && at <= now && now - at <= WINDOW_MS
}

/** Falls in the next 7 days — for scheduled work. */
export function isUpcoming(iso: string | null | undefined, now: number): boolean {
  const at = parse(iso)
  return at !== null && at >= now && at - now <= WINDOW_MS
}

/**
 * Either side of now, within the window.
 *
 * Used for research packs, where "activity" can legitimately be a past edit or a
 * future due date and both mean the pack is live this week.
 */
export function isWithinWindow(iso: string | null | undefined, now: number): boolean {
  const at = parse(iso)
  return at !== null && Math.abs(at - now) <= WINDOW_MS
}
