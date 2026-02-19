// ============================================================================
// OPS GATEWAY - LEADS CONTROLLER
// ============================================================================
// Operations team lead management and conversion
// Routes: GET /api/ops/leads, GET /api/ops/leads/:id
// Authorized Roles: OPERATIONAL_ADMIN, OPERATIONAL_MANAGER
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LeadService } from '../../../domain/leads/services/lead.service';
import { MessageService } from '../../../domain/leads/services/message.service';
import {
  SearchLeadsDto,
  UpdateLeadDto,
} from '../../../domain/leads/dto/lead.dto';
import { CreateMessageDto } from '../../../domain/leads/dto/message.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class LeadsController {
  constructor(
    private readonly leadService: LeadService,
    private readonly messageService: MessageService,
  ) {}

  /**
   * Get all leads (with search/filter)
   * For Ops Admin: View all leads for conversion to events
   * For Ops Manager: View leads relevant to their assigned events
   */
  @Get()
  searchLeads(@Query() query: SearchLeadsDto) {
    return this.leadService.search(query);
  }

  /**
   * Get lead by ID with full details
   * Includes messages, event info, vendor profile
   */
  @Get(':id')
  getLeadById(@Param('id') id: string) {
    return this.leadService.findById(id);
  }

  /**
   * Update lead status
   * For marking as contacted, qualified, etc.
   */
  @Patch(':id')
  updateLead(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadService.update(id, dto);
  }

  /**
   * Send message to lead
   * For ops team to communicate with planners/vendors
   */
  @Post(':id/messages')
  sendMessage(@Param('id') leadId: string, @Body() dto: CreateMessageDto) {
    return this.messageService.create({
      ...dto,
      leadId,
    });
  }
}
