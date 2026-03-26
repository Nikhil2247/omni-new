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
  ForbiddenException,
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
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { UserSubscriptionGuard } from '../../../domain/subscription/guards/user-subscription.guard';
import { UserUsageService } from '../../../domain/subscription/services/user-usage.service';

@Controller('guestlist')
@UseGuards(JwtAuthGuard, RolesGuard, UserSubscriptionGuard)
@UserAccess()
export class GuestlistController {
  constructor(
    private readonly guestlistService: GuestlistService,
    private readonly guestImportService: GuestImportService,
    private readonly userUsageService: UserUsageService,
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
  // Note: Limit checking is done manually below since we need to lookup eventId from guestlist
  async addGuest(
    @Param('id') id: string,
    @Body() dto: CreateGuestDto,
    @CurrentUser('id') userId: string,
  ) {
    // Get guestlist to retrieve eventId
    const guestlist = await this.guestlistService.findById(id);

    // Check if user has capacity for 1 guest (including plus ones)
    const guestCount = 1 + (dto.plusOne ?? 0);
    const status = await this.userUsageService.checkFeatureLimit(
      userId,
      guestlist.eventId,
      'guests_per_event',
    );
    if (!status.isUnlimited && status.remaining < guestCount) {
      throw new ForbiddenException(
        `You can only add ${status.remaining} more guests to this event. ` +
          `Please upgrade your subscription to add more guests.`,
      );
    }

    // Add the guest
    const guest = await this.guestlistService.addGuest(id, dto);

    // Record usage (guest count + plus ones)
    await this.userUsageService.recordUsage(
      userId,
      guestlist.eventId,
      'guests_per_event',
      guestCount,
    );

    return guest;
  }

  /**
   * Import guests from CSV content
   */
  @Post(':id/import')
  // Note: Limit checking is done manually below since we need to lookup eventId from guestlist
  async importGuests(
    @Param('id') guestlistId: string,
    @Body('csvContent') csvContent: string,
    @CurrentUser('id') userId: string,
  ) {
    // Get guestlist to retrieve eventId
    const guestlist = await this.guestlistService.findById(guestlistId);

    // Parse CSV to count guests before importing
    const parsedGuests = this.guestImportService.parseCSV(csvContent);
    const totalGuestsToAdd = parsedGuests.reduce(
      (sum, guest) => sum + 1 + (guest.plusOne ?? 0),
      0,
    );

    // Check if user has capacity for all guests
    const status = await this.userUsageService.checkFeatureLimit(
      userId,
      guestlist.eventId,
      'guests_per_event',
    );
    if (!status.isUnlimited && status.remaining < totalGuestsToAdd) {
      throw new ForbiddenException(
        `You can only add ${status.remaining} more guests to this event. ` +
          `The CSV contains ${totalGuestsToAdd} guests (including plus ones). ` +
          `Please upgrade your subscription to add more guests.`,
      );
    }

    // Import the guests
    const result = await this.guestImportService.importGuests(
      guestlistId,
      csvContent,
    );

    // Record usage for imported guests (only count successfully imported)
    if (result.imported > 0) {
      await this.userUsageService.recordUsage(
        userId,
        guestlist.eventId,
        'guests_per_event',
        result.imported,
      );
    }

    return result;
  }

  /**
   * Generate RSVP tokens for guests that don't have one
   */
  @Post(':id/generate-tokens')
  async generateMissingTokens(@Param('id') guestlistId: string) {
    return this.guestlistService.generateMissingTokens(guestlistId);
  }
}
