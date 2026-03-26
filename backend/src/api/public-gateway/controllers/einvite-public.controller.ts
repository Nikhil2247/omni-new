// ============================================================================
// E-INVITE PUBLIC CONTROLLER - Public Gateway (No Auth Required)
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { EInviteService } from '../../../domain/planning/services/einvite.service';
import { EInviteCategory } from '@prisma/client';

@Controller('einvites')
@ApiTags('E-Invites (Public)')
@Public()
export class EInvitePublicController {
  private readonly logger = new Logger(EInvitePublicController.name);

  constructor(private readonly einviteService: EInviteService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get all public e-invite templates' })
  @ApiQuery({ name: 'category', enum: EInviteCategory, required: false })
  async getTemplates(@Query('category') category?: EInviteCategory) {
    return this.einviteService.getAllTemplates(category);
  }

  @Get('view/:shareCode')
  @ApiOperation({ summary: 'View published e-invite by share code' })
  @ApiParam({ name: 'shareCode', description: 'E-invite share code' })
  async viewByShareCode(@Param('shareCode') shareCode: string) {
    const einvite = await this.einviteService.getByShareCode(shareCode);

    // Return only public-safe information
    return {
      id: einvite.id,
      canvasJson: einvite.canvasJson,
      eventName: einvite.eventName,
      eventDate: einvite.eventDate,
      eventTime: einvite.eventTime,
      eventVenue: einvite.eventVenue,
      eventAddress: einvite.eventAddress,
      hostNames: einvite.hostNames,
      customMessage: einvite.customMessage,
      previewUrl: einvite.previewUrl,
    };
  }

  @Post('view/:shareCode/track')
  @ApiOperation({ summary: 'Track e-invite view' })
  @ApiParam({ name: 'shareCode', description: 'E-invite share code' })
  @ApiQuery({ name: 'guestId', required: false, description: 'Guest ID for tracking' })
  async trackView(
    @Param('shareCode') shareCode: string,
    @Query('guestId') guestId?: string,
  ) {
    await this.einviteService.trackView(shareCode, guestId);
    return { success: true };
  }
}
