// ============================================================================
// PUBLIC RSVP CONTROLLER - Public Gateway
// ============================================================================
// Handles public RSVP submissions via token-based links
// ============================================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GuestlistService } from '../../../domain/planning/services/guestlist.service';
import { TimelineService } from '../../../domain/planning/services/timeline.service';
import { UpdateRSVPDto } from '../../../domain/planning/dto/guestlist.dto';
import { PublicRsvpSubmitDto } from '../dto/public-rsvp.dto';
import { Public } from '../../../core/auth/decorators/public.decorator';

// Dietary options available for selection
const DIETARY_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Halal',
  'Kosher',
  'Dairy-Free',
  'Nut-Free',
  'Other',
];

@Controller('rsvp')
@ApiTags('Public RSVP')
@Public()
export class RsvpController {
  constructor(
    private readonly guestlistService: GuestlistService,
    private readonly timelineService: TimelineService,
  ) {}

  /**
   * Legacy endpoint - Update RSVP by guest ID
   * @deprecated Use token-based endpoints instead
   */
  @Post()
  @ApiOperation({ summary: 'Update RSVP (legacy)' })
  update(@Body('guestId') guestId: string, @Body() dto: UpdateRSVPDto) {
    return this.guestlistService.updateRSVP(guestId, dto);
  }

  /**
   * Get RSVP details for a guest via their unique token
   * Returns event info, guest info, timeline, and dietary options
   */
  @Get(':token')
  @ApiOperation({ summary: 'Get RSVP page details by token' })
  @ApiResponse({
    status: 200,
    description: 'Returns event and guest details for RSVP page',
  })
  @ApiResponse({ status: 404, description: 'Invalid or expired RSVP link' })
  async getRsvpDetails(@Param('token') token: string) {
    const guest = await this.guestlistService.findByToken(token);

    if (!guest) {
      throw new NotFoundException('Invalid RSVP link');
    }

    // Get event details from the included relation
    const guestWithRelations = guest as any;
    const guestlist = guestWithRelations.guestlist;
    const event = guestlist?.event;

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Try to get timeline for the event
    let timeline: any[] = [];
    try {
      const timelineData = await this.timelineService.findByEventId(event.id);
      if (timelineData?.items) {
        timeline = Array.isArray(timelineData.items) ? timelineData.items : [];
      }
    } catch {
      // Timeline is optional, continue without it
    }

    return {
      guest: {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        rsvpStatus: guest.rsvpStatus,
        plusOne: guest.plusOne,
        dietaryReq: guest.dietaryReq,
        rsvpAt: guest.rsvpAt,
      },
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        venueName: event.venueName,
        address: event.address,
      },
      timeline: timeline.map((item: any) => ({
        title: item.title,
        description: item.description,
        scheduledTime: item.scheduledTime,
        duration: item.duration,
      })),
      dietaryOptions: DIETARY_OPTIONS,
    };
  }

  /**
   * Submit RSVP response via public token link
   */
  @Post(':token')
  @ApiOperation({ summary: 'Submit RSVP response' })
  @ApiResponse({ status: 200, description: 'RSVP submitted successfully' })
  @ApiResponse({ status: 404, description: 'Invalid or expired RSVP link' })
  async submitRsvp(
    @Param('token') token: string,
    @Body() dto: PublicRsvpSubmitDto,
  ) {
    const guest = await this.guestlistService.submitPublicRsvp(token, {
      rsvpStatus: dto.rsvpStatus,
      plusOne: dto.plusOne,
      dietaryReq: dto.dietaryReq,
      message: dto.message,
    });

    return {
      success: true,
      message: 'Thank you for your response!',
      guest: {
        firstName: guest.firstName,
        rsvpStatus: guest.rsvpStatus,
      },
    };
  }
}
