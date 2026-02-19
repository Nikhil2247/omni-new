// ============================================================================
// MESSAGING MODULE - Direct Messaging Domain Module
// ============================================================================
// Handles standalone conversations, messages, and receipts
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';

// Services
import { ConversationService, MessagingMessageService } from './services';

// Repositories
import {
  ConversationRepository,
  MessagingMessageRepository,
} from './repositories';

@Module({
  imports: [DatabaseModule],
  providers: [
    // Repositories
    ConversationRepository,
    MessagingMessageRepository,

    // Services
    ConversationService,
    MessagingMessageService,
  ],
  exports: [
    ConversationService,
    MessagingMessageService,
    ConversationRepository,
    MessagingMessageRepository,
  ],
})
export class MessagingModule {}
