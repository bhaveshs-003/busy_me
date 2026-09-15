import { useNavigate } from 'react-router-dom';
import type { KeyboardEvent } from 'react';
import type { ResearchPack, ResearchPackStatus } from '@/types/index';
import { ResearchPackStatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatRelativeTime } from '@/lib/utils';
import * as t from '@/lib/theme';
import { formatPackCounts, usePackLinks } from './packLinks';

// =============================================================================
// ResearchPackCard — one row in the research pack list
// =============================================================================

export interface ResearchPackCardProps {
  pack: ResearchPack;
  /** Overrides navigation to `/research-packs/:id`. */
  onClick?: (pack: ResearchPack) => void;
  className?: string;
}

/** Status is carried by a small dot, never a filled chip. */
const statusDotFor: Record<ResearchPackStatus, string> = {
  active: t.statusDot.active,
  completed: t.statusDot.success,
  paused: t.statusDot.warning,
  archived: t.statusDot.neutral,
};

/** Tags beyond this count collapse into a `+N` chip. */
const MAX_TAGS = 3;

export function ResearchPackCard({ pack, onClick, className }: ResearchPackCardProps) {
  const navigate = useNavigate();
  const links = usePackLinks(pack);

  const counts = formatPackCounts(links);
  const visibleTags = pack.tags.slice(0, MAX_TAGS);
  const hiddenTagCount = pack.tags.length - visibleTags.length;
  const updatedAt = pack.lastActivityAt ?? pack.updatedAt;

  const open = () => {
    if (onClick) onClick(pack);
    else navigate(`/research-packs/${pack.id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={handleKeyDown}
      aria-label={pack.title}
      className={cn(
        'w-full cursor-pointer bg-white p-4 text-left',
        t.border,
        t.radius,
        t.pressable,
        t.focusRing,
        className,
      )}
    >
      {/* ── Title row ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={cn('mt-[7px] h-2 w-2 shrink-0 rounded-full', statusDotFor[pack.status])}
        />
        <h3 className={cn('min-w-0 flex-1 leading-snug', t.title)}>{pack.title}</h3>
      </div>

      {/* ── Description ────────────────────────────────────────────────── */}
      {pack.description && (
        <p className={cn('mt-1.5 truncate pl-[18px]', t.body)}>{pack.description}</p>
      )}

      {/* ── Status + updated ───────────────────────────────────────────── */}
      <div className="mt-2.5 flex items-center gap-2 pl-[18px]">
        <ResearchPackStatusBadge status={pack.status} size="sm" dot={false} />
        <span aria-hidden="true" className={t.meta}>
          ·
        </span>
        <time dateTime={updatedAt} className={t.meta}>
          Updated {formatRelativeTime(updatedAt)}
        </time>
      </div>

      {/* ── Tags ───────────────────────────────────────────────────────── */}
      {visibleTags.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-[18px]">
          {visibleTags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium leading-none text-gray-500"
            >
              {tag}
            </li>
          ))}
          {hiddenTagCount > 0 && (
            <li className={cn('text-[11px] font-medium leading-none', t.meta)}>
              +{hiddenTagCount}
            </li>
          )}
        </ul>
      )}

      {/* ── Linked counts ──────────────────────────────────────────────── */}
      {counts && (
        <p className={cn('mt-2.5 pl-[18px] tabular-nums', t.meta)}>{counts}</p>
      )}
    </div>
  );
}

export default ResearchPackCard;
