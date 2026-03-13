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
  PlannerInsightsService,
} from './services';
import { VibeQuizService } from './services/vibe-quiz.service';
import { WeddingIdentityService } from './services/wedding-identity.service';
import { WhatsAppService } from './services/whatsapp.service';
import { GuestImportService } from './services/guest-import.service';

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

// Tasks
import { PlanningRemindersTask } from './tasks/planning-reminders.task';

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
    PlannerInsightsService,
    VibeQuizService,
    WeddingIdentityService,
    WhatsAppService,
    GuestImportService,

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

    // Tasks
    PlanningRemindersTask,
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
    PlannerInsightsService,
    VibeQuizService,
    WeddingIdentityService,
    WhatsAppService,
    GuestImportService,
  ],
})
export class PlanningModule {}
