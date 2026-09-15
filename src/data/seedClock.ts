/**
 * Seed clock — keeps the demo data evergreen.
 *
 * Every seed file in `src/data/` uses hardcoded ISO timestamps, which keeps them
 * readable and reviewable in a diff. The cost is that they age: once Ongoings
 * filters to a rolling 7-day window, fixed dates drift out of range and the
 * screen empties out, which reads as a bug rather than as a filter.
 *
 * This module shifts seed timestamps by the distance between the instant the
 * data was authored (`SEED_EPOCH`) and now, so "3 days ago" stays 3 days ago and
 * "next Tuesday" stays in the future, however long after authoring the demo runs.
 *
 * Limitation: stores persist their seeded state, so the shift is applied once on
 * first seed. A browser left untouched for weeks drifts until
 * Profile → Demo Control Panel → Reset Demo Data re-seeds against today.
 */

/** The instant the seed data was written around. */
export const SEED_EPOCH = '2026-09-10T12:00:00Z'

/**
 * Offset applied to every seed timestamp, computed once at module load so a
 * single render pass can never straddle two different "now" values.
 */
const OFFSET_MS = Date.now() - Date.parse(SEED_EPOCH)

/** Shifts one ISO timestamp, preserving its distance from the seed epoch. */
export function rebase(iso: string): string
export function rebase(iso: string | null): string | null
export function rebase(iso: string | null | undefined): string | null | undefined
export function rebase(iso: string | null | undefined): string | null | undefined {
  if (iso == null) return iso
  const parsed = Date.parse(iso)
  // Leave anything unparseable exactly as-is rather than emitting "Invalid Date".
  if (Number.isNaN(parsed)) return iso
  return new Date(parsed + OFFSET_MS).toISOString()
}

/**
 * Clamps a timestamp so it never lands in the future.
 *
 * Some fields are past-only by definition — nothing can have been *created*,
 * *updated* or *received* later than now. The seed data does not all sit before
 * `SEED_EPOCH` (one pack carries an `updatedAt` twelve days after it), so a
 * straight shift pushes those past the present and the UI renders "Updated in
 * 2 weeks". Apply this to past-only fields; leave `dueDate`, `startAt` and
 * friends alone, since those are legitimately in the future.
 */
export function notFuture(iso: string): string
export function notFuture(iso: string | null): string | null
export function notFuture(iso: string | null | undefined): string | null | undefined {
  if (iso == null) return iso
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return iso
  const now = Date.now()
  return parsed > now ? new Date(now).toISOString() : iso
}

/**
 * Rebases the named date fields on every record in a seed array.
 *
 * Returns new objects; the seed modules themselves are never mutated, so a
 * re-seed (Reset Demo Data) always starts from the original fixed dates rather
 * than compounding the shift.
 */
export function rebaseAll<T extends object>(records: readonly T[], fields: readonly (keyof T)[]): T[] {
  return records.map((record) => {
    const next = { ...record }
    for (const field of fields) {
      const value = next[field]
      if (typeof value === 'string' || value === null) {
        next[field] = rebase(value as string | null) as T[keyof T]
      }
    }
    return next
  })
}
