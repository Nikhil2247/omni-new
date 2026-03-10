// ============================================================================
// EVENTS MODULE - Event-Driven Architecture
// ============================================================================
// Provides event handlers for domain events
// ============================================================================

import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheInvalidationHandler } from './handlers/cache-invalidation.handler';
import { SearchIndexHandler } from './handlers/search-index.handler';
import { EmailEventHandler } from './handlers/email.handler';
import { ChatbotAnalyticsHandler } from './handlers/chatbot-analytics.handler';
import { NotificationsModule } from '../../infrastructure/notifications/notifications.module';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards for event matching
      wildcard: true,
      // Use delimiter for namespaced events
      delimiter: '.',
      // Emit events synchronously by default for better error handling
      newListener: false,
      removeListener: false,
      // Set max listeners to avoid memory leak warnings
      maxListeners: 20,
      // Verbose logging in development
      verboseMemoryLeak: process.env.NODE_ENV === 'development',
      // Ignore errors in event handlers (log them instead)
      ignoreErrors: false,
    }),
    NotificationsModule,
  ],
  providers: [
    CacheInvalidationHandler,
    SearchIndexHandler,
    EmailEventHandler,
    ChatbotAnalyticsHandler,
  ],
  exports: [EventEmitterModule],
})
export class EventsModule {}
