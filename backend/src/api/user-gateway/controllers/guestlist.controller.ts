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
} from '@nestjs/common';
import { GuestlistService } from '../../../domain/planning/services/guestlist.service';
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
  constructor(private readonly guestlistService: GuestlistService) {}

  @Post()
  create(@Body() dto: CreateGuestlistDto) {
    return this.guestlistService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.guestlistService.findById(id);
  }

  @Get()
  findByEvent(@Query('eventId') eventId: string) {
    return this.guestlistService.findByEventId(eventId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGuestlistDto) {
    return this.guestlistService.update(id, dto);
  }

  @Post(':id/guests')
  addGuest(@Param('id') id: string, @Body() dto: CreateGuestDto) {
    return this.guestlistService.addGuest(id, dto);
  }

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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.guestlistService.delete(id);
    return { success: true };
  }
}
