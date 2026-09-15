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

// ── Day-scoped helpers, for the To-Do view ──────────────────────────────────

export interface DayBounds {
  /** Inclusive start of the day, local time. */
  start: number
  /** Exclusive end of the day. */
  end: number
  /** Days from today: -1 yesterday, 0 today, +1 tomorrow. */
  offset: number
}

/**
 * Calendar-day bounds for an offset from today, in the viewer's local timezone.
 *
 * Deliberately local rather than UTC: "due today" has to mean the user's today,
 * or an item due late in the evening would land on the wrong day.
 */
export function dayBounds(offsetDays: number, now: number): DayBounds {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + offsetDays)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start: start.getTime(), end: end.getTime(), offset: offsetDays }
}

/** Whether a timestamp falls inside the given calendar day. */
export function isOnDay(iso: string | null | undefined, bounds: DayBounds): boolean {
  const at = parse(iso)
  return at !== null && at >= bounds.start && at < bounds.end
}

/** "today" / "yesterday" / "tomorrow" — used in headings and empty copy. */
export function dayLabel(offset: number): string {
  if (offset === -1) return 'yesterday'
  if (offset === 1) return 'tomorrow'
  return 'today'
}
