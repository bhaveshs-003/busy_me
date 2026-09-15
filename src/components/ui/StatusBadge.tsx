import type { ConnectorStatus, ResearchPackStatus, TaskStatus } from '@/types';
import { Badge } from './Badge';
import type { BadgeColor, BadgeSize } from './Badge';

// =============================================================================
// StatusBadge — semantic badges for entity statuses
// =============================================================================

/** Every status this component can render, across entity types. */
export type EntityStatus = ConnectorStatus | TaskStatus | ResearchPackStatus;

interface StatusConfig {
  label: string;
  color: BadgeColor;
  dot: boolean;
}

/**
 * `completed` is shared by Task and ResearchPack and renders identically,
 * so a single lookup table covers all three entity families.
 */
const statusConfig: Record<EntityStatus, StatusConfig> = {
  // Connector
  connected: { label: 'Connected', color: 'green', dot: true },
  connecting: { label: 'Connecting', color: 'blue', dot: true },
  oauth_consent: { label: 'Awaiting consent', color: 'blue', dot: true },
  authorising: { label: 'Authorising', color: 'blue', dot: true },
  disconnected: { label: 'Disconnected', color: 'gray', dot: true },
  expired: { label: 'Expired', color: 'red', dot: true },
  error: { label: 'Error', color: 'red', dot: true },
  syncing: { label: 'Syncing', color: 'blue', dot: true },

  // Task
  open: { label: 'Open', color: 'blue', dot: true },
  completed: { label: 'Completed', color: 'green', dot: true },
  overdue: { label: 'Overdue', color: 'red', dot: true },

  // Research pack
  active: { label: 'Active', color: 'orange', dot: true },
  archived: { label: 'Archived', color: 'gray', dot: true },
  paused: { label: 'Paused', color: 'yellow', dot: true },
};

const fallbackConfig: StatusConfig = { label: 'Unknown', color: 'gray', dot: true };

export interface StatusBadgeProps {
  status: EntityStatus;
  size?: BadgeSize;
  /** Override the default label (e.g. "Synced 2m ago"). */
  label?: string;
  /** Force the leading dot on or off. */
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  label,
  dot,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status] ?? { ...fallbackConfig, label: String(status) };
  const showDot = dot ?? config.dot;

  return (
    <Badge color={config.color} size={size} dot={showDot} className={className}>
      {label ?? config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Entity-scoped wrappers — narrow the accepted status union at the call site
// ---------------------------------------------------------------------------

export interface ScopedStatusBadgeProps<T extends EntityStatus>
  extends Omit<StatusBadgeProps, 'status'> {
  status: T;
}

export function ConnectorStatusBadge(props: ScopedStatusBadgeProps<ConnectorStatus>) {
  return <StatusBadge {...props} />;
}

export function TaskStatusBadge(props: ScopedStatusBadgeProps<TaskStatus>) {
  return <StatusBadge {...props} />;
}

export function ResearchPackStatusBadge(
  props: ScopedStatusBadgeProps<ResearchPackStatus>,
) {
  return <StatusBadge {...props} />;
}

export default StatusBadge;
