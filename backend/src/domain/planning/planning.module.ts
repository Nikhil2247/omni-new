// ============================================================================
// PLANNING MODULE - Event Planning Domain
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';

// Services
import {
  EventService,
  ChecklistService,
  ChecklistItemService,
  GuestlistService,
  GuestService,
  BudgetService,
  BudgetItemService,
  TimelineService,
  WishlistService,
  EventMemoryService,
  EventVendorService,
  GuestUploadService,
} from './services';
import { VibeQuizService } from './services/vibe-quiz.service';
import { WeddingIdentityService } from './services/wedding-identity.service';
import { WhatsAppService } from './services/whatsapp.service';

// Repositories
import {
  EventRepository,
  ChecklistRepository,
  ChecklistItemRepository,
  GuestlistRepository,
  GuestRepository,
  BudgetRepository,
  BudgetItemRepository,
  TimelineRepository,
  WishlistRepository,
  WishlistItemRepository,
  EventMemoryRepository,
  EventVendorRepository,
  GuestUploadRepository,
} from './repositories';
import { VibeQuizRepository } from './repositories/vibe-quiz.repository';
import { WeddingIdentityRepository } from './repositories/wedding-identity.repository';
import { WhatsAppRepository } from './repositories/whatsapp.repository';

// Event Handlers
import { EventEventHandler } from './events';

@Module({
  imports: [DatabaseModule],
  providers: [
    // Services
    EventService,
    ChecklistService,
    ChecklistItemService,
    GuestlistService,
    GuestService,
    BudgetService,
    BudgetItemService,
    TimelineService,
    WishlistService,
    EventMemoryService,
    EventVendorService,
    GuestUploadService,
    VibeQuizService,
    WeddingIdentityService,
    WhatsAppService,

    // Repositories
    EventRepository,
    ChecklistRepository,
    ChecklistItemRepository,
    GuestlistRepository,
    GuestRepository,
    BudgetRepository,
    BudgetItemRepository,
    TimelineRepository,
    WishlistRepository,
    WishlistItemRepository,
    EventMemoryRepository,
    EventVendorRepository,
    GuestUploadRepository,
    VibeQuizRepository,
    WeddingIdentityRepository,
    WhatsAppRepository,

    // Event Handlers
    EventEventHandler,
  ],
  exports: [
    EventService,
    ChecklistService,
    ChecklistItemService,
    GuestlistService,
    GuestService,
    BudgetService,
    BudgetItemService,
    TimelineService,
    WishlistService,
    EventMemoryService,
    EventVendorService,
    GuestUploadService,
    VibeQuizService,
    WeddingIdentityService,
    WhatsAppService,
  ],
})
export class PlanningModule {}
