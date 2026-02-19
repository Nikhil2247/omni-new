import { Controller, Post, Body } from '@nestjs/common';
import { GuestlistService } from '../../../domain/planning/services/guestlist.service';
import { UpdateRSVPDto } from '../../../domain/planning/dto/guestlist.dto';
import { Public } from '../../../core/auth/decorators/public.decorator';

@Controller('rsvp')
@Public()
export class RsvpController {
  constructor(private readonly guestlistService: GuestlistService) {}

  @Post()
  update(@Body('guestId') guestId: string, @Body() dto: UpdateRSVPDto) {
    return this.guestlistService.updateRSVP(guestId, dto);
  }
}
