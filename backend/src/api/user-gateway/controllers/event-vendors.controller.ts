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
import { EventVendorService } from '../../../domain/planning/services/event-vendor.service';
import {
  AddEventVendorDto,
  UpdateEventVendorDto,
  EventVendorStatus,
} from '../../../domain/planning/dto/event-vendor.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('event-vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class EventVendorsController {
  constructor(private readonly eventVendorService: EventVendorService) {}

  @Post()
  add(@Body() dto: AddEventVendorDto) {
    return this.eventVendorService.add(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.eventVendorService.findById(id);
  }

  @Get()
  findByEvent(
    @Query('eventId') eventId: string,
    @Query('status') status?: EventVendorStatus,
  ) {
    if (status) {
      return this.eventVendorService.findByStatus(eventId, status);
    }
    return this.eventVendorService.findByEvent(eventId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventVendorDto) {
    return this.eventVendorService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.eventVendorService.remove(id);
    return { success: true };
  }
}
