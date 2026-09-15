/**
 * Design tokens for the minimal, flat visual language.
 *
 * These are composable Tailwind class strings, intended to be combined with the
 * `cn()` helper in `@/lib/utils`. They are the single source of truth for the
 * app's surface treatment — prefer importing from here over hand-writing
 * borders, radii and type scales in components.
 *
 * Rules this module encodes:
 *   1. No shadows. Separation comes from hairline borders and whitespace.
 *   2. One radius (`rounded-lg`) everywhere — no larger radius variants.
 *   3. Brand orange is reserved for primary actions and the active nav item.
 *      Everything else is greyscale.
 *   4. Status is communicated with a small dot plus grey text, never a filled
 *      colour chip.
 */

// ── Surfaces ────────────────────────────────────────────────────────────────

/** Default page / card background. */
export const surface = 'bg-white'

/** Recessed background, used behind the phone frame and for inset areas. */
export const surfaceMuted = 'bg-gray-50'

/** The only border colour used in the app. */
export const hairline = 'border-gray-100'

/** Full hairline border on all sides. */
export const border = 'border border-gray-100'

/** Hairline rule between stacked rows. */
export const divider = 'border-b border-gray-100 last:border-b-0'

/** The single corner radius. */
export const radius = 'rounded-lg'

// ── Layout ──────────────────────────────────────────────────────────────────

/** Horizontal padding for page-level content. */
export const pagePad = 'px-4'

/** Vertical rhythm between major sections. */
export const sectionGap = 'space-y-6'

/** Vertical rhythm between items in a list. */
export const listGap = 'space-y-2'

/**
 * Width of the phone frame. The app renders as this single centred column at
 * every viewport size.
 */
export const frameWidth = 'max-w-[420px]'

// ── Typography ──────────────────────────────────────────────────────────────

/** Small section label. */
export const label = 'text-xs font-medium text-gray-500'

/** Card / row title. */
export const title = 'text-[15px] font-semibold text-gray-900'

/** Page title, used in PageHeader. */
export const pageTitle = 'text-base font-semibold text-gray-900'

/** Default body copy. */
export const body = 'text-sm text-gray-600'

/** De-emphasised metadata (timestamps, counts). */
export const meta = 'text-xs text-gray-400'

// ── Interaction ─────────────────────────────────────────────────────────────

/** Touch feedback for tappable rows and icon buttons. */
export const pressable = 'active:opacity-60 transition-opacity'

/** Visible keyboard focus ring. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1'

/** Minimum comfortable touch target. */
export const touchTarget = 'min-h-[44px]'

// ── Brand ───────────────────────────────────────────────────────────────────

/** Primary action fill. The only place a solid orange background belongs. */
export const brandFill = 'bg-brand-500 text-white active:bg-brand-600'

/** Brand text, for the active nav item. */
export const brandText = 'text-brand-500'

// ── Status ──────────────────────────────────────────────────────────────────

/**
 * Dot colours for status indication. Pair with grey text rather than a filled
 * chip, e.g. `<span className={statusDot.error} /> Expired`.
 */
export const statusDot: Record<string, string> = {
  neutral: 'bg-gray-300',
  active: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
}
