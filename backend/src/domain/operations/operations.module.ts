// ============================================================================
// OPERATIONS MODULE - Operations Domain
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { LeadsModule } from '../leads/leads.module';
import { PlanningModule } from '../planning/planning.module';

// Services
import { ActiveEventService } from './services/active-event.service';
import { KycVerificationService } from './services/kyc-verification.service';
import { DisputeService } from './services/dispute.service';
import { BillingService } from './services/billing.service';
import { LeadConversionService } from './services/lead-conversion.service';
import { EventNoteService } from './services/event-note.service';
import { RequirementSheetService } from './services/requirement-sheet.service';
import { VendorAgreementService } from './services/vendor-agreement.service';
import { ProvisionalInvoiceService } from './services/provisional-invoice.service';
import { OperationalTaskService } from './services/operational-task.service';
import { TaskAttachmentService } from './services/task-attachment.service';
import { OpsDashboardService } from './services/ops-dashboard.service';
import { OpsTeamService } from './services/ops-team.service';

// Repositories
import { ActiveEventRepository } from './repositories/active-event.repository';
import { RequirementSheetRepository } from './repositories/requirement-sheet.repository';
import { VendorAgreementRepository } from './repositories/vendor-agreement.repository';
import { OperationalTaskRepository } from './repositories/operational-task.repository';
import { ProvisionalInvoiceRepository } from './repositories/provisional-invoice.repository';
import { KycVerificationRepository } from './repositories/kyc-verification.repository';
import { DisputeRepository } from './repositories/dispute.repository';
import { EventNoteRepository } from './repositories/event-note.repository';
import { BillingRepository } from './repositories/billing.repository';
import { TaskAttachmentRepository } from './repositories/task-attachment.repository';
import { OpsTeamRepository } from './repositories/ops-team.repository';

// Event Listeners
import { ActiveEventListener } from './events/active-event.listener';
import { OperationalTaskListener } from './events/operational-task.listener';
import { VendorAgreementListener } from './events/vendor-agreement.listener';
import { KYCEventListener } from './events/kyc.listener';

@Module({
  imports: [DatabaseModule, LeadsModule, PlanningModule],
  providers: [
    // Services
    ActiveEventService,
    KycVerificationService,
    DisputeService,
    BillingService,
    LeadConversionService,
    EventNoteService,
    RequirementSheetService,
    VendorAgreementService,
    ProvisionalInvoiceService,
    OperationalTaskService,
    TaskAttachmentService,
    OpsDashboardService,
    OpsTeamService,

    // Repositories
    ActiveEventRepository,
    RequirementSheetRepository,
    VendorAgreementRepository,
    OperationalTaskRepository,
    ProvisionalInvoiceRepository,
    KycVerificationRepository,
    DisputeRepository,
    EventNoteRepository,
    BillingRepository,
    TaskAttachmentRepository,
    OpsTeamRepository,

    // Event Listeners
    ActiveEventListener,
    OperationalTaskListener,
    VendorAgreementListener,
    KYCEventListener,
  ],
  exports: [
    ActiveEventService,
    KycVerificationService,
    DisputeService,
    BillingService,
    LeadConversionService,
    EventNoteService,
    RequirementSheetService,
    VendorAgreementService,
    ProvisionalInvoiceService,
    OperationalTaskService,
    TaskAttachmentService,
    OpsDashboardService,
    OpsTeamService,
  ],
})
export class OperationsModule {}
