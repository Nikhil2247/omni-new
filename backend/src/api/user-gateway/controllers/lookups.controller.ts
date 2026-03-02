import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { EventTypeLookupService } from '../../../core/lookup/event-type-lookup.service';
import { CountryLookupService } from '../../../core/lookup/country-lookup.service';
import { CategoryLookupService } from '../../../core/lookup/category-lookup.service';
import { PrismaService } from '../../../core/database/prisma.service';

@Controller('lookups')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class LookupsController {
  constructor(
    private readonly eventTypeLookupService: EventTypeLookupService,
    private readonly countryLookupService: CountryLookupService,
    private readonly categoryLookupService: CategoryLookupService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('event-types')
  async getEventTypes() {
    let types = this.eventTypeLookupService.getAllEventTypes();
    if (!types.length) {
      await this.eventTypeLookupService.refresh();
      types = this.eventTypeLookupService.getAllEventTypes();
    }
    // Final fallback: query DB directly if cache is still empty
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

  @Get('categories')
  getCategories() {
    return this.categoryLookupService.getAllCategories();
  }
}
