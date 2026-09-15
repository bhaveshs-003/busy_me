import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';

// =============================================================================
// Avatar
// =============================================================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /** Image URL. Falls back to initials when absent or the image fails to load. */
  src?: string | null;
  /** Display name — drives initials and the deterministic fallback color. */
  name?: string;
  size?: AvatarSize;
  /** Renders a presence dot. `undefined` hides the indicator entirely. */
  online?: boolean;
  /** Ring around the avatar (used inside stacks and on colored surfaces). */
  ring?: boolean;
  alt?: string;
  className?: string;
}

export const avatarSizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

const indicatorClasses: Record<AvatarSize, string> = {
  xs: 'h-2 w-2 border',
  sm: 'h-2.5 w-2.5 border-2',
  md: 'h-3 w-3 border-2',
  lg: 'h-3.5 w-3.5 border-2',
};

const overlapClasses: Record<AvatarSize, string> = {
  xs: '-ml-2',
  sm: '-ml-2.5',
  md: '-ml-3',
  lg: '-ml-4',
};

/** Muted, brand-adjacent tints — deterministic per name so avatars stay stable. */
const fallbackPalette = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
];

function paletteFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
}

export function Avatar({
  src,
  name = '',
  size = 'md',
  online,
  ring = false,
  alt,
  className,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const initials = name.trim() ? getInitials(name) : '?';

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded-full',
          'select-none font-semibold leading-none',
          avatarSizeClasses[size],
          ring && 'ring-2 ring-white',
          !showImage && paletteFor(name),
        )}
      >
        {showImage ? (
          <img
            src={src as string}
            alt={alt ?? name}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span title={name || undefined}>{initials}</span>
        )}
      </span>

      {online !== undefined && (
        <span
          role="img"
          aria-label={online ? 'Online' : 'Offline'}
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            indicatorClasses[size],
            online ? 'bg-emerald-500' : 'bg-gray-300',
          )}
        />
      )}
    </span>
  );
}

// =============================================================================
// AvatarGroup — overlapping stack with a +N overflow chip
// =============================================================================

export interface AvatarGroupMember {
  src?: string | null;
  name?: string;
}

export interface AvatarGroupProps {
  avatars: AvatarGroupMember[];
  /** Number of faces shown before collapsing into +N. Defaults to 3. */
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 3,
  size = 'sm',
  className,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - visible.length;

  return (
    <span className={cn('flex items-center', className)}>
      {visible.map((member, index) => (
        <span
          key={`${member.name ?? 'avatar'}-${index}`}
          className={cn('shrink-0', index > 0 && overlapClasses[size])}
          style={{ zIndex: visible.length - index }}
        >
          <Avatar src={member.src} name={member.name} size={size} ring />
        </span>
      ))}

      {overflow > 0 && (
        <span
          title={`${overflow} more`}
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full ring-2 ring-white',
            'bg-gray-100 font-semibold leading-none text-gray-600',
            avatarSizeClasses[size],
            overlapClasses[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}

export default Avatar;
