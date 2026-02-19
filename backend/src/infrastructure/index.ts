// ============================================================================
// INFRASTRUCTURE EXPORTS
// ============================================================================
// Central export point for all infrastructure services and types
// ============================================================================

// Main Module
export { InfrastructureModule } from './infrastructure.module';

// ============================================================================
// CACHE MODULE
// ============================================================================
export { CacheModule } from './cache/cache.module';
export { DragonflyService } from './cache/dragonfly.service';
export {
  CacheAsideStrategy,
  type CacheAsideOptions,
} from './cache/strategies/cache-aside.strategy';
export {
  ReadThroughStrategy,
  type ReadThroughOptions,
} from './cache/strategies/read-through.strategy';
export {
  WriteThroughStrategy,
  type WriteThroughOptions,
} from './cache/strategies/write-through.strategy';

// ============================================================================
// STORAGE MODULE
// ============================================================================
export { StorageModule } from './storage/storage.module';
export {
  MinioService,
  type UploadOptions,
  type PresignedUrlOptions,
  type ObjectInfo,
} from './storage/minio.service';
export {
  UploadService,
  FileCategory,
  type UploadedFile,
  type ChunkedUploadSession,
} from './storage/upload.service';
export { CdnService, type CdnConfig } from './storage/cdn.service';

// ============================================================================
// SEARCH MODULE
// ============================================================================
export { SearchModule } from './search/search.module';
export {
  MeilisearchService,
  type SearchOptions,
  type SearchResult,
  type GeoSearchOptions,
} from './search/meilisearch.service';
export {
  EventIndexer,
  type EventSearchDocument,
} from './search/indexers/event.indexer';
export {
  VendorIndexer,
  type VendorSearchDocument,
} from './search/indexers/vendor.indexer';

// ============================================================================
// JOBS MODULE
// ============================================================================
export { JobsModule } from './jobs/jobs.module';
export {
  EmailQueue,
  EmailJobType,
  type EmailJobData,
  type BulkEmailJobData,
} from './jobs/queues/email.queue';
export {
  MediaQueue,
  MediaJobType,
  type MediaJobData,
  type ImageResizeJobData,
  type VideoTranscodeJobData,
} from './jobs/queues/media.queue';

// ============================================================================
// RESILIENCE MODULE
// ============================================================================
export { ResilienceModule } from './resilience/resilience.module';
export {
  CircuitBreakerService,
  CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreakerStats,
} from './resilience/circuit-breaker.service';
export {
  RetryService,
  type BackoffStrategy,
  type RetryOptions,
  type RetryResult,
} from './resilience/retry.service';
export {
  TimeoutInterceptor,
  TimeoutService,
  TimeoutException,
  Timeout,
  NoTimeout,
  TIMEOUT_KEY,
  NO_TIMEOUT_KEY,
} from './resilience/timeout.interceptor';

// ============================================================================
// NOTIFICATIONS MODULE
// ============================================================================
export { NotificationsModule } from './notifications/notifications.module';
export {
  EmailService,
  type EmailOptions,
  type EmailAttachment,
  type EmailResult,
} from './notifications/email.service';

// ============================================================================
// WEBSOCKETS MODULE
// ============================================================================
export { WebsocketsModule } from './websockets/websockets.module';
export {
  NotificationGateway,
  type AuthenticatedSocket as NotificationSocket,
  type NotificationPayload,
  type ConnectionStats,
} from './websockets/notification.gateway';
export {
  MessagingGateway,
  MessageType,
  ConversationType,
  type AuthenticatedSocket as MessagingSocket,
  type Message,
  type MessageMetadata,
  type Conversation,
  type TypingIndicator,
  type ReadReceipt,
} from './websockets/messaging.gateway';
