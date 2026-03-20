// ============================================================================
// WHATSAPP CONTROLLER - User Gateway
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { UserSubscriptionGuard } from '../../../domain/subscription/guards/user-subscription.guard';
import {
  RequireBasicPlan,
  CheckWhatsAppInvitesLimit,
} from '../../../domain/subscription/decorators/user-subscription.decorators';
import { UserUsageService } from '../../../domain/subscription/services/user-usage.service';
import { WhatsAppService } from '../../../domain/planning/services/whatsapp.service';
import { GuestlistService } from '../../../domain/planning/services/guestlist.service';
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
@UseGuards(JwtAuthGuard, RolesGuard, UserSubscriptionGuard)
@UserAccess()
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly guestlistService: GuestlistService,
    private readonly userUsageService: UserUsageService,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get WhatsApp message templates' })
  @ApiResponse({ status: 200, type: [WhatsAppTemplateResponseDto] })
  async getTemplates(): Promise<WhatsAppTemplateResponseDto[]> {
    return this.whatsappService.getTemplates();
  }

  @Post('invite')
  @RequireBasicPlan()
  @CheckWhatsAppInvitesLimit()
  @ApiOperation({ summary: 'Send WhatsApp invites to selected guests' })
  @ApiResponse({ status: 200, type: WhatsAppInviteResponseDto })
  async sendInvites(
    @Body() dto: SendWhatsAppInviteDto,
    @CurrentUser('id') userId: string,
  ): Promise<WhatsAppInviteResponseDto> {
    // Send the invites first - the service will validate guests exist
    const result = await this.whatsappService.sendInvites(dto);

    // Record usage for successfully sent invites
    if (result.sent > 0) {
      try {
        // Get guestlistId from the service response to find eventId
        const extendedResult = result as any;
        if (extendedResult.guestlistId) {
          const guestlist = await this.guestlistService.findById(
            extendedResult.guestlistId,
          );

          // Check if user exceeded limit (post-check for specific invite case)
          const status = await this.userUsageService.checkFeatureLimit(
            userId,
            guestlist.eventId,
            'whatsapp_invites_per_event',
          );

          if (!status.isUnlimited && result.sent > status.remaining) {
            throw new ForbiddenException(
              `You can only send ${status.remaining} more WhatsApp invites for this event. ` +
                `Please upgrade your subscription to send more invites.`,
            );
          }

          await this.userUsageService.recordUsage(
            userId,
            guestlist.eventId,
            'whatsapp_invites_per_event',
            result.sent,
          );
        }
      } catch (error) {
        // Re-throw ForbiddenException, but don't fail for other errors
        if (error instanceof ForbiddenException) {
          throw error;
        }
        // Don't fail the request if usage recording fails
      }
    }

    return result;
  }

  @Post('bulk')
  @RequireBasicPlan()
  @CheckWhatsAppInvitesLimit()
  @ApiOperation({
    summary: 'Send bulk WhatsApp invites to all matching guests',
  })
  @ApiResponse({ status: 200, type: WhatsAppInviteResponseDto })
  async sendBulkInvites(
    @Body() dto: SendWhatsAppBulkDto,
    @CurrentUser('id') userId: string,
  ): Promise<WhatsAppInviteResponseDto> {
    // Get guestlist to retrieve eventId
    const guestlist = await this.guestlistService.findById(dto.guestlistId);

    // Check remaining capacity for bulk invites
    // For bulk operations, we check if there's ANY capacity remaining
    // The actual count will be validated after getting the guest count
    const status = await this.userUsageService.checkFeatureLimit(
      userId,
      guestlist.eventId,
      'whatsapp_invites_per_event',
    );

    if (!status.isUnlimited && status.remaining <= 0) {
      throw new ForbiddenException(
        `You have reached the WhatsApp invite limit for this event. ` +
          `Please upgrade your subscription to send more invites.`,
      );
    }

    // Send the invites
    const result = await this.whatsappService.sendBulkInvites(dto);

    // Record usage for successfully sent invites
    if (result.sent > 0) {
      try {
        await this.userUsageService.recordUsage(
          userId,
          guestlist.eventId,
          'whatsapp_invites_per_event',
          result.sent,
        );
      } catch {
        // Don't fail the request if usage recording fails
      }
    }

    return result;
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
