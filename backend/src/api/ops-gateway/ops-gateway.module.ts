// ============================================================================
// OPS GATEWAY MODULE - Operations Team API Gateway
// ============================================================================
// API endpoints for operational event management and vendor coordination
// ============================================================================

import { Module } from '@nestjs/common';
import { KycController } from './controllers/kyc.controller';
import { DisputesController } from './controllers/disputes.controller';
import { ModerationController } from './controllers/moderation.controller';
import { VendorsController } from './controllers/vendors.controller';
import { SupportController } from './controllers/support.controller';
import { ActiveEventsController } from './controllers/active-events.controller';
import { LeadConversionController } from './controllers/lead-conversion.controller';
import { RequirementsController } from './controllers/requirements.controller';
import { VendorAgreementsController } from './controllers/vendor-agreements.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { OperationalTasksController } from './controllers/operational-tasks.controller';
import { TaskAttachmentsController } from './controllers/task-attachments.controller';
import { OpsDashboardController } from './controllers/ops-dashboard.controller';
import { LeadsController } from './controllers/leads.controller';
import { OpsTeamController } from './controllers/ops-team.controller';
import { OperationsModule } from '../../domain/operations/operations.module';
import { LeadsModule } from '../../domain/leads/leads.module';
import { CatalogModule } from '../../domain/catalog/catalog.module';
import { NotificationService } from 'src/infrastructure/notifications/notification.service';
import { AuditService } from 'src/core/audit';


@Module({
  imports: [
    OperationsModule,
    LeadsModule,
    CatalogModule,
  ],
  controllers: [
    KycController,
    DisputesController,
    ModerationController,
    VendorsController,
    SupportController,
    ActiveEventsController,
    LeadConversionController,
    LeadsController,
    OpsTeamController,
    RequirementsController,
    VendorAgreementsController,
    InvoicesController,
    OperationalTasksController,
    TaskAttachmentsController,
    OpsDashboardController
  ],
  providers: [
    NotificationService, AuditService
  ]
})
export class OpsGatewayModule {}
