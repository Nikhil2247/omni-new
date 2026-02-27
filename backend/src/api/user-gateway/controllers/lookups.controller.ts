import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { EventTypeLookupService } from '../../../core/lookup/event-type-lookup.service';
import { CountryLookupService } from '../../../core/lookup/country-lookup.service';

@Controller('lookups')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class LookupsController {
  constructor(
    private readonly eventTypeLookupService: EventTypeLookupService,
    private readonly countryLookupService: CountryLookupService,
  ) {}

  @Get('event-types')
  getEventTypes() {
    return this.eventTypeLookupService.getAllEventTypes();
  }

  @Get('cities')
  getCities() {
    return this.countryLookupService.getAllCities();
  }
}
