// ============================================================================
// LEADS MODULE - Leads Domain
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { MessagingModule } from '../messaging/messaging.module';

// Services
import { LeadService, MessageService } from './services';

// Repositories
import { LeadRepository, MessageRepository } from './repositories';

// Event Handlers
import { LeadEventHandler } from './events';

@Module({
  imports: [DatabaseModule, MessagingModule],
  providers: [
    // Services
    LeadService,
    MessageService,

    // Repositories
    LeadRepository,
    MessageRepository,

    // Event Handlers
    LeadEventHandler,
  ],
  exports: [LeadService, MessageService],
})
export class LeadsModule {}
