// ============================================================================
// E-INVITE CONTROLLER - User Gateway (Auth Required)
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { EInviteService } from '../../../domain/planning/services/einvite.service';
import {
  CreateEInviteDto,
  UpdateEInviteDto,
  SendEInviteDto,
  BulkSendEInviteDto,
} from '../../../domain/planning/dto/einvite.dto';
import { EInviteCategory } from '@prisma/client';

interface JwtUser {
  id: string;
  email: string;
}

@Controller('einvites')
@ApiTags('E-Invites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EInviteController {
  private readonly logger = new Logger(EInviteController.name);

  constructor(private readonly einviteService: EInviteService) {}

  // ============================================================================
  // TEMPLATE ENDPOINTS
  // ============================================================================

  @Get('templates')
  @ApiOperation({ summary: 'Get all e-invite templates' })
  @ApiQuery({ name: 'category', enum: EInviteCategory, required: false })
  async getTemplates(@Query('category') category?: EInviteCategory) {
    return this.einviteService.getAllTemplates(category);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get e-invite template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async getTemplate(@Param('id') id: string) {
    return this.einviteService.getTemplateById(id);
  }

  // ============================================================================
  // E-INVITE CRUD ENDPOINTS
  // ============================================================================

  @Post()
  @ApiOperation({ summary: 'Create e-invite for an event' })
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateEInviteDto) {
    return this.einviteService.create(user.id, dto);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get e-invite by event ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  async getByEvent(
    @CurrentUser() user: JwtUser,
    @Param('eventId') eventId: string,
  ) {
    return this.einviteService.getByEventId(user.id, eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get e-invite by ID' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async getById(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.einviteService.getById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update e-invite' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateEInviteDto,
  ) {
    return this.einviteService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete e-invite' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async delete(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    await this.einviteService.delete(user.id, id);
    return { success: true, message: 'E-invite deleted successfully' };
  }

  // ============================================================================
  // PUBLISH ENDPOINTS
  // ============================================================================

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish e-invite (make it shareable)' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async publish(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.einviteService.publish(user.id, id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish e-invite' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async unpublish(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.einviteService.unpublish(user.id, id);
  }

  @Post(':id/regenerate-code')
  @ApiOperation({ summary: 'Regenerate share code' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async regenerateShareCode(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    return this.einviteService.regenerateShareCode(user.id, id);
  }

  // ============================================================================
  // SEND ENDPOINTS
  // ============================================================================

  @Post(':id/send')
  @ApiOperation({ summary: 'Send e-invite to specific guests' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async sendToGuests(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: SendEInviteDto,
  ) {
    return this.einviteService.sendToGuests(user.id, id, dto);
  }

  @Post(':id/send-all')
  @ApiOperation({ summary: 'Send e-invite to all guests in guestlist' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async sendToAllGuests(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: BulkSendEInviteDto,
  ) {
    return this.einviteService.sendToAllGuests(user.id, id, dto);
  }

  @Get(':id/sent-history')
  @ApiOperation({ summary: 'Get sent history for e-invite' })
  @ApiParam({ name: 'id', description: 'E-Invite ID' })
  async getSentHistory(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.einviteService.getSentHistory(user.id, id);
  }
}
