import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { LeadService } from '../../../domain/leads/services/lead.service';
import { MessageService } from '../../../domain/leads/services/message.service';
import {
  CreateLeadDto,
  SearchLeadsDto,
} from '../../../domain/leads/dto/lead.dto';
import { CreateMessageDto } from '../../../domain/leads/dto/message.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { EmailVerifiedGuard } from '../../../core/auth/guards/email-verified.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { Audited } from '../../../core/audit/audit.decorators';
import { AuditSeverity } from '../../../core/audit/audit.types';
import {
  PerUserRateLimit,
  PerUserRateLimits,
} from '../../../infrastructure/rate-limiting/per-user-rate-limit.decorator';
import { PerUserRateLimitGuard } from '../../../infrastructure/rate-limiting/per-user-rate-limit.guard';

@Controller('interactions')
@UseGuards(JwtAuthGuard, RolesGuard, EmailVerifiedGuard, PerUserRateLimitGuard)
@UserAccess()
export class InteractionsController {
  constructor(
    private readonly leadService: LeadService,
    private readonly messageService: MessageService,
  ) {}

  @Post('leads')
  @PerUserRateLimit(PerUserRateLimits.LEAD_CREATION) // 10 leads per hour per user
  @Audited({
    action: 'CREATE',
    entityType: 'Lead',
    getEntityId: (_req, res) => res?.id,
    includeRequestBody: true,
    includeResponseBody: true,
    severity: AuditSeverity.INFO,
  })
  createLead(@Body() dto: CreateLeadDto) {
    return this.leadService.create(dto);
  }

  @Get('leads')
  searchLeads(@Query() query: SearchLeadsDto) {
    return this.leadService.search(query);
  }

  @Get('leads/:id')
  async getLeadById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const lead = await this.leadService.findById(id);
    if (lead.plannerId !== user.id) {
      throw new ForbiddenException('You do not have access to this lead');
    }
    return lead;
  }

  @Post('messages')
  @PerUserRateLimit(PerUserRateLimits.MESSAGE_SEND) // 30 messages per minute per user
  @Audited({
    action: 'CREATE',
    entityType: 'Message',
    getEntityId: (_req, res) => res?.id,
    includeRequestBody: true,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  sendMessage(@Body() dto: CreateMessageDto) {
    return this.messageService.create(dto);
  }
}
