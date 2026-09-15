import { cn } from '@/lib/utils';
import type { AvatarSize } from './Avatar';

// =============================================================================
// Loading / skeleton primitives
// =============================================================================

export interface SkeletonProps {
  className?: string;
  /** Inline width when a Tailwind width class is not expressive enough. */
  width?: number | string;
  /** Renders a pill instead of a rounded rectangle. */
  rounded?: 'md' | 'full';
}

export function Skeleton({ className, width, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={width !== undefined ? { width } : undefined}
      className={cn(
        'animate-pulse bg-gray-200/80',
        rounded === 'full' ? 'rounded-full' : 'rounded-md',
        className,
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// AvatarSkeleton
// ---------------------------------------------------------------------------

export interface AvatarSkeletonProps {
  size?: AvatarSize;
  className?: string;
}

const avatarSizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
  return (
    <Skeleton
      rounded="full"
      className={cn('shrink-0', avatarSizeClasses[size], className)}
    />
  );
}

// ---------------------------------------------------------------------------
// TextSkeleton
// ---------------------------------------------------------------------------

export interface TextSkeletonProps {
  /** Number of lines. Defaults to 3. */
  lines?: number;
  className?: string;
}

const lineWidths = ['w-full', 'w-11/12', 'w-4/5', 'w-5/6', 'w-2/3'];

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: Math.max(lines, 1) }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', lineWidths[i % lineWidths.length])} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardSkeleton — mirrors the EntityCard layout (email / task / event)
// ---------------------------------------------------------------------------

export interface CardSkeletonProps {
  /** Hide the leading avatar block for icon-less cards. */
  showAvatar?: boolean;
  className?: string;
}

export function CardSkeleton({ showAvatar = true, className }: CardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-gray-100/80 bg-white p-4',
        className,
      )}
    >
      {showAvatar && <AvatarSkeleton size="md" />}

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-14 shrink-0" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center gap-2 pt-0.5">
          <Skeleton rounded="full" className="h-5 w-16" />
          <Skeleton rounded="full" className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ListSkeleton — N stacked card skeletons
// ---------------------------------------------------------------------------

export interface ListSkeletonProps {
  /** Number of rows. Defaults to 5. */
  count?: number;
  showAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({ count = 5, showAvatar, className }: ListSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={cn('flex flex-col gap-2', className)}
    >
      {Array.from({ length: Math.max(count, 1) }).map((_, i) => (
        <CardSkeleton key={i} showAvatar={showAvatar} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PageSkeleton — header, filter chips and a list
// ---------------------------------------------------------------------------

export interface PageSkeletonProps {
  /** Render the left navigation rail (desktop shell). */
  showSidebar?: boolean;
  rows?: number;
  className?: string;
}

export function PageSkeleton({
  showSidebar = false,
  rows = 4,
  className,
}: PageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page"
      className={cn('flex h-full w-full', className)}
    >
      {showSidebar && (
        <div className="hidden w-64 shrink-0 flex-col gap-4 border-r border-gray-100 bg-gray-50/60 p-4">
          <Skeleton className="mb-2 h-8 w-28" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-3.5 flex-1" />
            </div>
          ))}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <div className="flex gap-2 overflow-hidden">
          {[84, 64, 76, 58].map((w, i) => (
            <Skeleton key={i} rounded="full" className="h-8 shrink-0" width={w} />
          ))}
        </div>

        <ListSkeleton count={rows} />
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default ListSkeleton;
