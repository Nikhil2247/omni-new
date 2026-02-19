// ============================================================================
// INFRASTRUCTURE MODULE - Core Infrastructure Layer
// ============================================================================
// Aggregates all infrastructure modules for easy import into the main app
// Provides: Cache, Storage, Search, Jobs, Resilience, Notifications, WebSockets
// ============================================================================

import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { StorageModule } from './storage/storage.module';
import { SearchModule } from './search/search.module';
import { JobsModule } from './jobs/jobs.module';
import { ResilienceModule } from './resilience/resilience.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebsocketsModule } from './websockets/websockets.module';

@Module({
  imports: [
    // Core caching with Dragonfly (Redis-compatible)
    CacheModule,

    // Object storage with MinIO (S3-compatible)
    StorageModule,

    // Full-text search with Meilisearch
    SearchModule,

    // Background job processing with BullMQ
    JobsModule,

    // Fault tolerance: Circuit Breaker, Retry, Timeout
    ResilienceModule,

    // Email and notification services
    NotificationsModule,

    // Real-time WebSocket communication
    WebsocketsModule,
  ],
  exports: [
    CacheModule,
    StorageModule,
    SearchModule,
    JobsModule,
    ResilienceModule,
    NotificationsModule,
    WebsocketsModule,
  ],
})
export class InfrastructureModule {}
