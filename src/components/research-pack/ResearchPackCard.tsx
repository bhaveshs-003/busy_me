import { useNavigate } from 'react-router-dom';
import type { KeyboardEvent } from 'react';
import type { ResearchPack } from '@/types/index';
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

export function ResearchPackCard({ pack, onClick, className }: ResearchPackCardProps) {
  const navigate = useNavigate();
  const links = usePackLinks(pack);

  const counts = formatPackCounts(links);
  // `lastActivityAt` can be in the future (scheduled work), and "Updated in
  // 2 weeks" reads as a bug — so the label uses the backward-looking field.
  const updatedAt = pack.updatedAt;

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
          className={cn('mt-[7px] h-2 w-2 shrink-0 rounded-full', t.statusDot.neutral)}
        />
        <h3 className={cn('min-w-0 flex-1 leading-snug', t.title)}>{pack.title}</h3>
      </div>

      {/* ── Updated ────────────────────────────────────────────────────── */}
      <div className="mt-2.5 flex items-center gap-2 pl-[18px]">
        <time dateTime={updatedAt} className={t.meta}>
          Updated {formatRelativeTime(updatedAt)}
        </time>
      </div>

      {/* ── Linked counts ──────────────────────────────────────────────── */}
      {counts && (
        <p className={cn('mt-2.5 pl-[18px] tabular-nums', t.meta)}>{counts}</p>
      )}
    </div>
  );
}

export default ResearchPackCard;
