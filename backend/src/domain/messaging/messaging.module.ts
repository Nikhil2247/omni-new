// ============================================================================
// MESSAGING MODULE - Direct Messaging Domain Module
// ============================================================================
// Handles standalone conversations, messages, and receipts
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { NotificationsModule } from '../../infrastructure/notifications/notifications.module';

// Services
import { ConversationService, MessagingMessageService } from './services';

// Repositories
import {
  ConversationRepository,
  MessagingMessageRepository,
} from './repositories';

// Event Handlers
import { MessagingEventHandler } from './events';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [
    // Repositories
    ConversationRepository,
    MessagingMessageRepository,

    // Services
    ConversationService,
    MessagingMessageService,

    // Event Handlers
    MessagingEventHandler,
  ],
  exports: [
    ConversationService,
    MessagingMessageService,
    ConversationRepository,
    MessagingMessageRepository,
  ],
})
export class MessagingModule {}
