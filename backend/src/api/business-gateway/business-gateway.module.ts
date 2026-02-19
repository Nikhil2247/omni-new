// ============================================================================
// BUSINESS GATEWAY MODULE - Vendor/Business API Gateway
// ============================================================================
// API endpoints for vendor profile management, leads, analytics, etc.
// ============================================================================

import { Module } from '@nestjs/common';
import { ProfileController } from './controllers/profile.controller';
import { PortfolioController } from './controllers/portfolio.controller';
import { ServicesController } from './controllers/services.controller';
import { LeadsController } from './controllers/leads.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { CalendarController } from './controllers/calendar.controller';
import { AgreementsController } from './controllers/agreements.controller';
import { TasksController } from './controllers/tasks.controller';
import { MessagingController } from './controllers/messaging.controller';
import { VendorReviewsController } from './controllers/vendor-reviews.controller';
import { MediaTagsController } from './controllers/media-tags.controller';
import { CatalogModule } from '../../domain/catalog/catalog.module';
import { LeadsModule } from '../../domain/leads/leads.module';
import { OperationsModule } from '../../domain/operations/operations.module';
import { InsightsModule } from '../../domain/insights/insights.module';
import { PlanningModule } from '../../domain/planning/planning.module';
import { MessagingModule } from '../../domain/messaging/messaging.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { NotificationService } from 'src/infrastructure/notifications/notification.service';
import { AuditService } from 'src/core/audit';

@Module({
  imports: [
    CatalogModule,
    LeadsModule,
    OperationsModule,
    InsightsModule,
    PlanningModule,
    MessagingModule,
    StorageModule,
  ],
  controllers: [
    ProfileController,
    PortfolioController,
    ServicesController,
    LeadsController,
    AnalyticsController,
    CalendarController,
    AgreementsController,
    TasksController,
    MessagingController,
    VendorReviewsController,
    MediaTagsController,
  ],
  providers: [NotificationService, AuditService],
})
export class BusinessGatewayModule {}
