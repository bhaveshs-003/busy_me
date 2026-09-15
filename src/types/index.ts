// =============================================================================
// Busy.me — Application Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Core User & Auth
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  timezone: string;
  locale: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastSeenAt?: string; // ISO 8601
  isPremium: boolean;
  planId?: string;
  planExpiresAt?: string; // ISO 8601
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null; // ISO 8601
  error: string | null;
}

export interface OTPState {
  isRequested: boolean;
  isSending: boolean;
  isSent: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  destination: string | null; // email or phone
  expiresAt: string | null; // ISO 8601
  attemptsRemaining: number;
  error: string | null;
}

export type BiometricType = 'face-id' | 'touch-id' | 'fingerprint' | 'none';

export interface BiometricState {
  isAvailable: boolean;
  isEnabled: boolean;
  biometricType: BiometricType;
  lastAuthenticatedAt: string | null; // ISO 8601
  error: string | null;
}

export interface SessionState {
  sessionId: string | null;
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  startedAt: string | null; // ISO 8601
  lastActiveAt: string | null; // ISO 8601
  isLocked: boolean;
  lockAfterSeconds: number;
}

// -----------------------------------------------------------------------------
// Connectors / Integrations
// -----------------------------------------------------------------------------

export type ConnectorType =
  | 'gmail'
  | 'google-calendar'
  | 'outlook'
  | 'slack';

export type ConnectorStatus =
  | 'disconnected'
  /** Preparing the provider hand-off (before the consent screen appears). */
  | 'connecting'
  /** Waiting for the user to approve/deny the provider consent screen. */
  | 'oauth_consent'
  /** Consent granted — exchanging the code for tokens. */
  | 'authorising'
  | 'connected'
  | 'expired'
  | 'error'
  | 'syncing';

/** Statuses that represent an operation in flight — UI should block new actions. */
export const CONNECTOR_TRANSIENT_STATUSES = [
  'connecting',
  'oauth_consent',
  'authorising',
  'syncing',
] as const satisfies readonly ConnectorStatus[];

export type ConnectorTransientStatus = (typeof CONNECTOR_TRANSIENT_STATUSES)[number];

export type ConnectorSyncFrequency =
  | 'realtime'
  | '15min'
  | 'hourly'
  | 'daily'
  | 'manual';

export type ConnectorSyncOutcome = 'success' | 'partial' | 'failed';

export interface ConnectorSyncRecord {
  id: string;
  connectorType: ConnectorType;
  startedAt: string; // ISO 8601
  durationMs: number;
  outcome: ConnectorSyncOutcome;
  itemsSynced: number;
  message?: string;
}

export interface Connector {
  id: string;
  type: ConnectorType;
  status: ConnectorStatus;
  accountEmail: string | null;
  accountDisplayName: string | null;
  accountAvatarUrl?: string;
  scopes: string[];
  connectedAt: string | null; // ISO 8601
  lastSyncedAt: string | null; // ISO 8601
  nextSyncAt: string | null; // ISO 8601
  errorMessage: string | null;
  metadata: Record<string, string | number | boolean>;
}

// -----------------------------------------------------------------------------
// Email
// -----------------------------------------------------------------------------

export type EmailCategory =
  | 'primary'
  | 'social'
  | 'updates'
  | 'promotions'
  | 'other';

export type EmailStatus = 'unread' | 'read' | 'archived' | 'trashed' | 'sent' | 'draft';

export interface EmailAddress {
  name: string | null;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
  thumbnailUrl?: string;
  isInline: boolean;
}

/**
 * An email whose reply the user is still waiting for. `chaseDate` is when
 * Busy.me should nudge the user to follow up if nothing has come back.
 */
export interface EmailWaitingOn {
  contactEmail: string;
  contactName: string | null;
  /** When the wait started (ISO 8601). */
  since: string;
  chaseDate: string | null; // ISO 8601
  note?: string;
}

/** View-level email filters surfaced in the email list FilterBar. */
export type EmailViewFilter =
  | 'all'
  | 'unread'
  | 'important'
  | 'waiting'
  | 'attachments';

export interface Email {
  id: string;
  connectorId: string;
  threadId: string;
  messageId: string; // RFC 2822 Message-ID
  subject: string;
  snippet: string;
  bodyHtml: string | null;
  bodyText: string | null;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo: EmailAddress | null;
  date: string; // ISO 8601
  receivedAt: string; // ISO 8601
  status: EmailStatus;
  category: EmailCategory;
  labels: string[];
  attachments: EmailAttachment[];
  isStarred: boolean;
  isImportant: boolean;
  /** Set when the user is blocked on a reply to this thread. */
  waitingOn?: EmailWaitingOn | null;
  aiSummary?: string;
  aiActionItems?: string[];
  /** Short reply drafts Busy.me offers on the detail screen. */
  aiReplySuggestions?: string[];
  hasCalendarInvite: boolean;
  spamScore?: number;
}

export interface EmailDraft {
  id: string;
  connectorId: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo?: EmailAddress;
  attachments: EmailAttachment[];
  inReplyToId?: string;
  forwardOfId?: string;
  isImportant?: boolean;
  /** Track the recipient's reply as an outstanding item once sent. */
  waitingOn?: EmailWaitingOn | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  scheduledSendAt?: string; // ISO 8601
}

export interface EmailSummaryStats {
  totalUnread: number;
  totalInPrimary: number;
  totalInSocial: number;
  totalInUpdates: number;
  totalInPromotions: number;
  totalStarred: number;
  oldestUnreadDate: string | null; // ISO 8601
  lastSyncedAt: string | null; // ISO 8601
}

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'open' | 'completed' | 'overdue';

export interface TaskChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt: string | null; // ISO 8601
  sortOrder: number;
}

export interface TaskAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
}

/**
 * A task that is blocked on someone else. `chaseDate` is when the user should
 * follow up if nothing has come back yet.
 */
export interface TaskWaitingOn {
  contactId: string;
  contactName: string;
  chaseDate: string | null; // ISO 8601
  note?: string;
}

/** View-level task filters surfaced in the task list FilterBar. */
export type TaskViewFilter =
  | 'all'
  | 'open'
  | 'overdue'
  | 'completed'
  | 'important'
  | 'waiting';

/** Sort keys offered on the task list. */
export type TaskSortKey = 'dueDate' | 'priority' | 'created';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // ISO 8601
  dueTime: string | null; // HH:MM
  completedAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  checklist: TaskChecklistItem[];
  tags: string[];
  /** Starred by the user — drives the "Important" filter. */
  isImportant?: boolean;
  /** Set when the task is blocked on another person. */
  waitingOn?: TaskWaitingOn | null;
  attachments?: TaskAttachment[];
  linkedEmailId?: string;
  linkedEventId?: string;
  linkedResearchPackId?: string;
  assigneeId?: string;
  createdByAI: boolean;
  aiSource?: string;
  reminderAt?: string; // ISO 8601
  recurrenceRule?: string; // iCal RRULE string
  estimatedMinutes?: number;
  actualMinutes?: number;
}

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

export type EventType = 'meeting' | 'call' | 'deadline' | 'reminder' | 'personal';

export type RecurrenceType =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

export interface CalendarAccount {
  id: string;
  connectorId: string;
  calendarId: string;
  name: string;
  color: string; // hex color
  isPrimary: boolean;
  isVisible: boolean;
  timeZone: string;
  accessRole: 'reader' | 'writer' | 'owner';
}

export interface EventAttendee {
  email: string;
  displayName: string | null;
  responseStatus: 'needsAction' | 'accepted' | 'declined' | 'tentative';
  isOrganizer: boolean;
  isOptional: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarAccountId: string;
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  videoConferenceUrl: string | null;
  type: EventType;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  isAllDay: boolean;
  timeZone: string;
  recurrenceType: RecurrenceType;
  recurrenceRule: string | null; // iCal RRULE string
  recurrenceInstanceId: string | null;
  attendees: EventAttendee[];
  organizerEmail: string | null;
  color: string | null; // hex color
  isPrivate: boolean;
  isCancelled: boolean;
  isTentative: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  aiSummary?: string;
  linkedResearchPackId?: string;
  reminderMinutesBefore: number[];
}

// -----------------------------------------------------------------------------
// Notes
// -----------------------------------------------------------------------------

export interface Note {
  id: string;
  title: string;
  bodyMarkdown: string;
  bodyText: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  color: string | null; // hex color
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  linkedEmailId?: string;
  linkedEventId?: string;
  linkedTaskId?: string;
  linkedResearchPackId?: string;
  linkedContactId?: string;
  attachments: string[]; // file IDs
  wordCount: number;
  createdByAI: boolean;
}

// -----------------------------------------------------------------------------
// Contacts
// -----------------------------------------------------------------------------

export interface ContactEmailEntry {
  label: 'work' | 'personal' | 'other';
  email: string;
  isPrimary: boolean;
}

export interface ContactPhoneEntry {
  label: 'mobile' | 'work' | 'home' | 'other';
  number: string;
  isPrimary: boolean;
}

/** Postal address. Every part is optional — most contacts only have a city. */
export interface ContactAddress {
  street: string | null;
  city: string | null;
  country: string | null;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  company: string | null;
  jobTitle: string | null;
  department: string | null;
  avatarUrl: string | null;
  emails: ContactEmailEntry[];
  phones: ContactPhoneEntry[];
  linkedInUrl: string | null;
  twitterHandle: string | null;
  websiteUrl: string | null;
  /** `YYYY-MM-DD`. Year may be omitted by the source, so treat it as display-only. */
  birthday?: string | null;
  address?: ContactAddress | null;
  notes: string | null;
  tags: string[];
  isFavorite: boolean;
  isBlocked: boolean;
  lastContactedAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  importedFromConnectorId?: string;
  emailCount: number;
  meetingCount: number;
  aiInsights?: string;
}

// -----------------------------------------------------------------------------
// Research Packs (the core "Ongoing" object)
// -----------------------------------------------------------------------------


export type TimelineEntryType =
  | 'email'
  | 'event'
  | 'note'
  | 'task'
  | 'web-search'
  | 'ai-summary'
  | 'file'
  | 'status-change'
  | 'contact-added';

export interface TimelineEntry {
  id: string;
  researchPackId: string;
  type: TimelineEntryType;
  title: string;
  summary: string | null;
  occurredAt: string; // ISO 8601
  addedAt: string; // ISO 8601
  linkedEmailId?: string;
  linkedEventId?: string;
  linkedNoteId?: string;
  linkedTaskId?: string;
  linkedContactId?: string;
  linkedFileId?: string;
  sourceUrl?: string;
  metadata: Record<string, string | number | boolean>;
  isAIGenerated: boolean;
}

export interface ResearchPack {
  id: string;
  title: string;
  /** How urgent the pack is. Absent on legacy packs — treat as `medium`. */
  priority?: TaskPriority;
  coverImageUrl: string | null;
  color: string; // hex color
  linkedContactIds: string[];
  linkedEmailIds: string[];
  linkedEventIds: string[];
  linkedTaskIds: string[];
  linkedNoteIds: string[];
  linkedFileIds: string[];
  timeline: TimelineEntry[];
  aiSummary: string | null;
  aiKeyInsights: string[];
  aiNextSteps: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  startedAt: string | null; // ISO 8601
  completedAt: string | null; // ISO 8601
  dueDate: string | null; // ISO 8601
  createdById: string;
  isShared: boolean;
  sharedWithEmails: string[];
  watchKeywords: string[];
  autoAddFromConnectors: boolean;
  lastActivityAt: string | null; // ISO 8601
}

// -----------------------------------------------------------------------------
// Chat
// -----------------------------------------------------------------------------

export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessageType =
  | 'text'
  | 'search-results'
  | 'artifact'
  | 'action-suggestion'
  | 'research-pack-summary';

export interface WebSearchResult {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  publishedAt: string | null; // ISO 8601
  faviconUrl: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  relevanceScore: number; // 0–1
}

export type ChatArtifactType =
  | 'email-draft'
  | 'task-list'
  | 'event-summary'
  | 'contact-card'
  | 'research-pack'
  | 'markdown-document'
  | 'action-plan';

export interface ChatArtifact {
  id: string;
  type: ChatArtifactType;
  title: string;
  contentMarkdown: string;
  linkedEntityId?: string;
  linkedEntityType?: string;
  createdAt: string; // ISO 8601
  isEditable: boolean;
}

export interface ChatSuggestedAction {
  id: string;
  label: string;
  description: string | null;
  actionType:
    | 'create-task'
    | 'send-email'
    | 'create-event'
    | 'create-note'
    | 'create-research-pack'
    | 'open-email'
    | 'open-event'
    | 'web-search'
    | 'summarize'
    | 'dismiss';
  payload: Record<string, string | number | boolean | null>;
  isPrimary: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  type: ChatMessageType;
  textContent: string | null;
  searchResults?: WebSearchResult[];
  artifact?: ChatArtifact;
  suggestedActions?: ChatSuggestedAction[];
  researchPackSummaryId?: string;
  isStreaming: boolean;
  createdAt: string; // ISO 8601
  tokensUsed?: number;
  modelId?: string;
  error: string | null;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string | null;
  messages: ChatMessage[];
  contextResearchPackId?: string;
  contextEmailId?: string;
  contextEventId?: string;
  isArchived: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastMessageAt: string | null; // ISO 8601
  totalMessages: number;
}

// -----------------------------------------------------------------------------
// Workboard
// -----------------------------------------------------------------------------

export type WorkboardItemType =
  | 'email'
  | 'task'
  | 'event'
  | 'note'
  | 'contact'
  | 'research-pack'
  | 'web-result';

export interface WorkboardItem {
  id: string;
  type: WorkboardItemType;
  linkedEntityId: string;
  title: string;
  subtitle: string | null;
  snippet: string | null;
  iconUrl?: string;
  color?: string; // hex color
  addedAt: string; // ISO 8601
  sortOrder: number;
  isHighlighted: boolean;
  dueDate?: string | null; // ISO 8601
  tags: string[];
  metadata: Record<string, string | number | boolean>;
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------

export type NotificationType =
  | 'email-received'
  | 'email-reply'
  | 'task-due'
  | 'task-overdue'
  | 'event-starting'
  | 'event-invite'
  | 'connector-expired'
  | 'connector-error'
  | 'ai-insight'
  | 'research-pack-update'
  | 'system-alert'
  | 'plan-expiring'
  | 'contact-activity';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  deepLinkPath?: string;
  imageUrl?: string;
  isRead: boolean;
  isDismissed: boolean;
  readAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  expiresAt: string | null; // ISO 8601
  linkedEntityId?: string;
  linkedEntityType?: string;
  actionLabel?: string;
  actionPayload?: Record<string, string | number | boolean>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// -----------------------------------------------------------------------------
// Files
// -----------------------------------------------------------------------------

export type FileCategory =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'archive'
  | 'code'
  | 'other';

export interface MockFile {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  url: string;
  thumbnailUrl: string | null;
  uploadedAt: string; // ISO 8601
  uploadedByUserId: string;
  linkedResearchPackId?: string;
  linkedNoteId?: string;
  linkedEmailId?: string;
  isPublic: boolean;
  checksum: string; // SHA-256
  metadata: Record<string, string | number | boolean>;
}

// -----------------------------------------------------------------------------
// Permissions
// -----------------------------------------------------------------------------

export type PermissionType =
  | 'notifications'
  | 'microphone'
  | 'camera'
  | 'photos'
  | 'contacts'
  | 'files';

export type PermissionStatus =
  | 'not-requested'
  | 'allowed'
  | 'denied'
  | 'restricted';

export interface PermissionEntry {
  type: PermissionType;
  status: PermissionStatus;
  requestedAt: string | null; // ISO 8601
  grantedAt: string | null; // ISO 8601
  deniedAt: string | null; // ISO 8601
  canOpenSettings: boolean;
}

export type PermissionsState = Record<PermissionType, PermissionEntry>;

// -----------------------------------------------------------------------------
// Demo / Settings
// -----------------------------------------------------------------------------

export interface DemoConfig {
  isDemoMode: boolean;
  demoUserId: string | null;
  seedDataVersion: string | null;
  featuresEnabled: string[];
  featureFlagsOverrides: Record<string, boolean>;
  /** Whether mock requests are artificially delayed at all. */
  simulateLatency: boolean;
  mockLatencyMs: number;
  simulateErrors: boolean;
  /** Percentage of mock requests that fail while `simulateErrors` is on. */
  errorRatePercent: number;
  /** Serves empty data and shows the global offline banner. */
  offlineMode: boolean;
}

export interface NotificationPreferences {
  emailReceived: boolean;
  taskDue: boolean;
  eventStarting: boolean;
  eventStartingMinutesBefore: number;
  connectorIssues: boolean;
  aiInsights: boolean;
  /** Nudges about people you are waiting on. */
  waitingOnChases: boolean;
  /** Reminders to follow up on threads that went quiet. */
  followUps: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string; // HH:MM
}

export interface AppSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  accentColor: string; // hex color
  language: string; // BCP-47 locale
  timezone: string; // IANA timezone
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
  defaultEmailCategory: EmailCategory;
  aiAssistEnabled: boolean;
  aiAutoSummarize: boolean;
  aiAutoTagging: boolean;
  biometricLockEnabled: boolean;
  lockAfterSeconds: number;
  compactMode: boolean;
  notifications: NotificationPreferences;
  updatedAt: string; // ISO 8601
}

export interface AppVersion {
  semver: string; // e.g. "2.4.1"
  buildNumber: number;
  buildDate: string; // ISO 8601
  minSupportedSemver: string;
  releaseNotesUrl: string | null;
  updateUrl: string | null;
  isForceUpdate: boolean;
}

export type AppLifecycleState =
  | 'normal'
  | 'maintenance'
  | 'update-available'
  | 'force-update';

// -----------------------------------------------------------------------------
// Search
// -----------------------------------------------------------------------------

export type SearchCategory =
  | 'emails'
  | 'tasks'
  | 'events'
  | 'notes'
  | 'contacts'
  | 'research-packs'
  | 'files'
  | 'web';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  entityId: string;
  title: string;
  subtitle: string | null;
  snippet: string | null;
  score: number; // 0–1, relevance
  date: string | null; // ISO 8601
  iconName?: string;
  deepLinkPath: string;
  highlightedTitle?: string; // HTML-safe with <mark> tags
  highlightedSnippet?: string; // HTML-safe with <mark> tags
}

// -----------------------------------------------------------------------------
// Analytics
// -----------------------------------------------------------------------------

export type AnalyticsEventName =
  | 'app_open'
  | 'app_background'
  | 'screen_view'
  | 'connector_connect_start'
  | 'connector_connect_success'
  | 'connector_connect_failure'
  | 'connector_disconnect'
  | 'email_open'
  | 'email_archive'
  | 'email_delete'
  | 'email_reply_start'
  | 'email_reply_send'
  | 'task_create'
  | 'task_complete'
  | 'task_delete'
  | 'event_view'
  | 'event_create'
  | 'note_create'
  | 'note_edit'
  | 'note_delete'
  | 'contact_view'
  | 'research_pack_create'
  | 'research_pack_open'
  | 'research_pack_status_change'
  | 'chat_session_start'
  | 'chat_message_send'
  | 'chat_artifact_save'
  | 'search_query'
  | 'search_result_tap'
  | 'permission_prompt_shown'
  | 'permission_granted'
  | 'permission_denied'
  | 'settings_change'
  | 'biometric_auth_success'
  | 'biometric_auth_failure'
  | 'onboarding_step_complete'
  | 'onboarding_complete'
  | 'paywall_view'
  | 'subscription_start'
  | 'subscription_cancel';

export interface AnalyticsEvent {
  eventId: string;
  name: AnalyticsEventName;
  userId: string | null;
  sessionId: string | null;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  occurredAt: string; // ISO 8601
  screenName?: string;
  properties: Record<string, string | number | boolean | null>;
  durationMs?: number;
  isAnonymous: boolean;
}
