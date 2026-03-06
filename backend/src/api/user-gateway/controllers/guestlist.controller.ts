import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { GuestlistService } from '../../../domain/planning/services/guestlist.service';
import { GuestImportService } from '../../../domain/planning/services/guest-import.service';
import {
  CreateGuestlistDto,
  UpdateGuestlistDto,
  CreateGuestDto,
  UpdateGuestDto,
  UpdateRSVPDto,
} from '../../../domain/planning/dto/guestlist.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('guestlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class GuestlistController {
  constructor(
    private readonly guestlistService: GuestlistService,
    private readonly guestImportService: GuestImportService,
  ) {}

  // ============================================================================
  // STATIC ROUTES - Must be defined BEFORE parameterized routes
  // ============================================================================

  @Post()
  create(@Body() dto: CreateGuestlistDto) {
    return this.guestlistService.create(dto);
  }

  @Get()
  findByEvent(@Query('eventId') eventId: string) {
    return this.guestlistService.findByEventId(eventId);
  }

  /**
   * Download CSV template for guest import
   */
  @Get('template/csv')
  downloadTemplate(@Res() res: Response) {
    const template = this.guestImportService.generateTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=guest-import-template.csv');
    res.send(template);
  }

  // ============================================================================
  // GUEST ROUTES - /guests/:guestId before /:id
  // ============================================================================

  @Put('guests/:guestId')
  updateGuest(@Param('guestId') guestId: string, @Body() dto: UpdateGuestDto) {
    return this.guestlistService.updateGuest(guestId, dto);
  }

  @Put('guests/:guestId/rsvp')
  updateRsvp(@Param('guestId') guestId: string, @Body() dto: UpdateRSVPDto) {
    return this.guestlistService.updateRSVP(guestId, dto);
  }

  @Delete('guests/:guestId')
  async deleteGuest(@Param('guestId') guestId: string) {
    await this.guestlistService.deleteGuest(guestId);
    return { success: true };
  }

  // ============================================================================
  // PARAMETERIZED ROUTES - /:id routes
  // ============================================================================

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.guestlistService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGuestlistDto) {
    return this.guestlistService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.guestlistService.delete(id);
    return { success: true };
  }

  @Post(':id/guests')
  addGuest(@Param('id') id: string, @Body() dto: CreateGuestDto) {
    return this.guestlistService.addGuest(id, dto);
  }

  /**
   * Import guests from CSV content
   */
  @Post(':id/import')
  async importGuests(
    @Param('id') guestlistId: string,
    @Body('csvContent') csvContent: string,
  ) {
    return this.guestImportService.importGuests(guestlistId, csvContent);
  }

  /**
   * Generate RSVP tokens for guests that don't have one
   */
  @Post(':id/generate-tokens')
  async generateMissingTokens(@Param('id') guestlistId: string) {
    return this.guestlistService.generateMissingTokens(guestlistId);
  }
}
