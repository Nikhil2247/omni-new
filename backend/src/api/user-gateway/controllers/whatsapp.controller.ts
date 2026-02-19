// ============================================================================
// WHATSAPP CONTROLLER - User Gateway
// ============================================================================

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { WhatsAppService } from '../../../domain/planning/services/whatsapp.service';
import {
  SendWhatsAppInviteDto,
  SendWhatsAppBulkDto,
  WhatsAppTemplateResponseDto,
  WhatsAppMessageResponseDto,
  WhatsAppInviteResponseDto,
  WhatsAppSummaryResponseDto,
} from '../../../domain/planning/dto/whatsapp.dto';

@ApiTags('User - WhatsApp')
@ApiBearerAuth()
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get WhatsApp message templates' })
  @ApiResponse({ status: 200, type: [WhatsAppTemplateResponseDto] })
  async getTemplates(): Promise<WhatsAppTemplateResponseDto[]> {
    return this.whatsappService.getTemplates();
  }

  @Post('invite')
  @ApiOperation({ summary: 'Send WhatsApp invites to selected guests' })
  @ApiResponse({ status: 200, type: WhatsAppInviteResponseDto })
  async sendInvites(
    @Body() dto: SendWhatsAppInviteDto,
  ): Promise<WhatsAppInviteResponseDto> {
    return this.whatsappService.sendInvites(dto);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Send bulk WhatsApp invites to all matching guests',
  })
  @ApiResponse({ status: 200, type: WhatsAppInviteResponseDto })
  async sendBulkInvites(
    @Body() dto: SendWhatsAppBulkDto,
  ): Promise<WhatsAppInviteResponseDto> {
    return this.whatsappService.sendBulkInvites(dto);
  }

  @Get('history/:guestlistId')
  @ApiOperation({ summary: 'Get WhatsApp message history for a guestlist' })
  @ApiResponse({ status: 200, type: [WhatsAppMessageResponseDto] })
  async getHistory(
    @Param('guestlistId') guestlistId: string,
  ): Promise<WhatsAppMessageResponseDto[]> {
    return this.whatsappService.getHistory(guestlistId);
  }

  @Get('summary/:guestlistId')
  @ApiOperation({ summary: 'Get WhatsApp message summary for a guestlist' })
  @ApiResponse({ status: 200, type: WhatsAppSummaryResponseDto })
  async getSummary(
    @Param('guestlistId') guestlistId: string,
  ): Promise<WhatsAppSummaryResponseDto> {
    return this.whatsappService.getSummary(guestlistId);
  }
}
