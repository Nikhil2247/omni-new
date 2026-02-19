import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { EventTypeLookupService } from '../../../core/lookup/event-type-lookup.service';

@Controller('lookups')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class LookupsController {
  constructor(
    private readonly eventTypeLookupService: EventTypeLookupService,
  ) {}

  @Get('event-types')
  getEventTypes() {
    return this.eventTypeLookupService.getAllEventTypes();
  }
}
