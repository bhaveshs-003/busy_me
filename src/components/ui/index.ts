// =============================================================================
// UI components — barrel export
// =============================================================================

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Input } from './Input';
export type { InputProps, InputSize } from './Input';

export { Avatar, AvatarGroup, avatarSizeClasses } from './Avatar';
export type {
  AvatarProps,
  AvatarSize,
  AvatarGroupProps,
  AvatarGroupMember,
} from './Avatar';

export { Badge, badgeDotClasses } from './Badge';
export type { BadgeProps, BadgeColor, BadgeSize } from './Badge';

export {
  StatusBadge,
  ConnectorStatusBadge,
  TaskStatusBadge,
  ResearchPackStatusBadge,
} from './StatusBadge';
export type { StatusBadgeProps, EntityStatus } from './StatusBadge';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from './Card';
export type { CardProps, CardPadding, CardSectionProps } from './Card';

export {
  Skeleton,
  AvatarSkeleton,
  TextSkeleton,
  CardSkeleton,
  ListSkeleton,
  PageSkeleton,
} from './LoadingState';
export type {
  SkeletonProps,
  AvatarSkeletonProps,
  TextSkeletonProps,
  CardSkeletonProps,
  ListSkeletonProps,
  PageSkeletonProps,
} from './LoadingState';

export {
  EmptyState,
  NoEmailsEmpty,
  NoTasksEmpty,
  NoResultsEmpty,
} from './EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './EmptyState';

export { ErrorState } from './ErrorState';
export type { ErrorStateProps } from './ErrorState';

export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';

export { FilterBar } from './FilterBar';
export type { FilterBarProps, FilterItem } from './FilterBar';

export { Tabs } from './Tabs';
export type { TabsProps, TabItem, TabsVariant } from './Tabs';

export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps, ConfirmDialogVariant } from './ConfirmDialog';

// Overlay + feedback primitives owned elsewhere in this folder
export { Modal } from './Modal';
export { Drawer } from './Drawer';
export { BottomSheet } from './BottomSheet';
export { ToastContainer } from './Toast';
