// =============================================================================
// Busy.me — Store barrel export
// Import any store from '@/store' for convenience.
// =============================================================================

export { useAuthStore } from './authStore';
export { useEmailStore } from './emailStore';
export type { EmailFilters } from './emailStore';

export { useTaskStore } from './taskStore';
export type { TaskFilters } from './taskStore';

export { useEventStore } from './eventStore';

export { useNoteStore } from './noteStore';

export { useContactStore } from './contactStore';
export type { ContactFilters } from './contactStore';

export { useResearchPackStore } from './researchPackStore';
export type { ResearchPackFilters } from './researchPackStore';

export { useChatStore } from './chatStore';

export { useConnectorStore } from './connectorStore';

export { useNotificationStore } from './notificationStore';

export { useUIStore } from './uiStore';
export type { BottomSheetType, ModalType, DrawerType, ToastVariant, ToastItem } from './uiStore';

export { useSettingsStore } from './settingsStore';
