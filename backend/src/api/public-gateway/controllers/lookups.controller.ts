import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { EventTypeLookupService } from '../../../core/lookup/event-type-lookup.service';
import { CountryLookupService } from '../../../core/lookup/country-lookup.service';
import { PrismaService } from '../../../core/database/prisma.service';

/**
 * Read-only reference data (event types, cities) for logged-out visitors, e.g. the home page planner.
 * Mirrors the signed-in /user/lookups endpoints; it exposes nothing user-specific.
 */
@Controller('lookups')
@Public()
export class PublicLookupsController {
  constructor(
    private readonly eventTypeLookupService: EventTypeLookupService,
    private readonly countryLookupService: CountryLookupService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('event-types')
  async getEventTypes() {
    let types = this.eventTypeLookupService.getAllEventTypes();
    if (!types.length) {
      await this.eventTypeLookupService.refresh();
      types = this.eventTypeLookupService.getAllEventTypes();
    }
    // Final fallback: query the DB directly if the cache is still empty
    if (!types.length) {
      const rows = await this.prisma.eventType.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description ?? undefined,
        iconUrl: r.icon ?? undefined,
        displayOrder: r.sortOrder,
      }));
    }
    return types;
  }

  @Get('cities')
  getCities() {
    return this.countryLookupService.getAllCities();
  }
}
