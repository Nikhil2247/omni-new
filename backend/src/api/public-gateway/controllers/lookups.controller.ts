import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { EventTypeLookupService } from '../../../core/lookup/event-type-lookup.service';
import { CountryLookupService } from '../../../core/lookup/country-lookup.service';
import { PrismaService } from '../../../core/database/prisma.service';

/**
 * Read-only reference data (event types, cities) for logged-out visitors, e.g. the home page planner.
 * Mirrors the signed-in /user/lookups endpoints; it exposes nothing user-specific.
 */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export interface VendorLandingPage {
  categorySlug: string;
  categoryName: string;
  citySlug: string;
  cityId: string;
  cityName: string;
  state: string | null;
  vendorCount: number;
}

@Controller('lookups')
@Public()
export class PublicLookupsController {
  private landingCache: { at: number; data: VendorLandingPage[] } | null = null;

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

  /**
   * Which (category, city) combinations actually have live vendors. Used to build indexable landing pages and the
   * sitemap, so only pages with real content are exposed to search engines. Cached for an hour.
   */
  @Get('vendor-landing-pages')
  async getVendorLandingPages(): Promise<VendorLandingPage[]> {
    if (this.landingCache && Date.now() - this.landingCache.at < 60 * 60 * 1000) {
      return this.landingCache.data;
    }

    const vendors = await this.prisma.vendorProfile.findMany({
      where: { status: { in: ['ACTIVE', 'UNCLAIMED'] }, address: { isNot: null } },
      select: {
        category: { select: { slug: true, name: true } },
        address: { select: { cityId: true } },
      },
    });

    const groups = new Map<string, VendorLandingPage>();
    for (const vendor of vendors) {
      const cityId = vendor.address?.cityId;
      if (!cityId || !vendor.category?.slug) continue;
      const location = this.countryLookupService.getLocationPath(cityId);
      if (!location) continue;

      const citySlug = slugify(location.city);
      const key = `${vendor.category.slug}|${citySlug}`;
      const existing = groups.get(key);
      if (existing) {
        existing.vendorCount += 1;
      } else {
        groups.set(key, {
          categorySlug: vendor.category.slug,
          categoryName: vendor.category.name,
          citySlug,
          cityId,
          cityName: location.city,
          state: location.state ?? null,
          vendorCount: 1,
        });
      }
    }

    const data = Array.from(groups.values()).sort((a, b) => b.vendorCount - a.vendorCount);
    this.landingCache = { at: Date.now(), data };
    return data;
  }
}
