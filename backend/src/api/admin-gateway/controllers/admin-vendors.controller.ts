import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { PrismaService } from '../../../core/database/prisma.service';
import { CountryLookupService } from '../../../core/lookup/country-lookup.service';
import { AuditSensitive } from '../../../core/audit/audit.decorators';
import { VENDOR_EVENTS } from '../../../core/events/event-constants';
import {
  SearchAdminVendorsDto,
  UpdateAdminVendorStatusDto,
} from '../dto/admin-catalog.dto';

/**
 * Vendor listing management for admins: find, inspect, suspend/restore, archive or permanently delete vendors.
 *
 * "Delete" is an archive by default: the listing disappears from the site and from search but can be restored.
 * A permanent delete is only allowed for listings with no business history (no leads, payments, reviews...).
 */
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminVendorsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly countryLookup: CountryLookupService,
    private readonly events: EventEmitter2,
  ) {}

  private cityName(cityId?: string | null): string | null {
    if (!cityId) return null;
    return this.countryLookup.getCityById(cityId)?.name ?? null;
  }

  @Get()
  async list(@Query() query: SearchAdminVendorsDto) {
    const { page = 1, limit = 20, query: term, status, categoryId, cityId } = query;

    const where: Prisma.VendorProfileWhereInput = {
      ...(status && { status: status as Prisma.VendorProfileWhereInput['status'] }),
      ...(categoryId && { categoryId }),
      ...(cityId && { address: { cityId } }),
      ...(term && {
        OR: [
          { businessName: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { contactEmail: { contains: term, mode: 'insensitive' } },
          { contactPhone: { contains: term, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, vendors] = await this.prisma.$transaction([
      this.prisma.vendorProfile.count({ where }),
      this.prisma.vendorProfile.findMany({
        where,
        select: {
          id: true,
          businessName: true,
          slug: true,
          status: true,
          planTier: true,
          verifiedAt: true,
          contactEmail: true,
          contactPhone: true,
          leadCount: true,
          viewCount: true,
          totalReviews: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true, slug: true } },
          address: { select: { cityId: true } },
          user: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: vendors.map(({ address, ...vendor }) => ({
        ...vendor,
        cityId: address?.cityId ?? null,
        cityName: this.cityName(address?.cityId),
        claimed: Boolean(vendor.user),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /** Vendor counts per status, for the filter chips at the top of the page. */
  @Get('stats')
  async stats() {
    const groups = await this.prisma.vendorProfile.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const g of groups) {
      byStatus[g.status] = g._count._all;
      total += g._count._all;
    }
    return { total, byStatus };
  }

  @Get(':id')
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        address: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true, status: true } },
        _count: {
          select: {
            leads: true,
            reviews: true,
            portfolios: true,
            services: true,
            campaigns: true,
            payments: true,
          },
        },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return {
      ...vendor,
      cityName: this.cityName(vendor.address?.cityId),
    };
  }

  @Patch(':id/status')
  @AuditSensitive('STATUS_CHANGE', 'VendorProfile')
  async updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAdminVendorStatusDto,
  ) {
    const existing = await this.prisma.vendorProfile.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Vendor not found');

    const updated = await this.prisma.vendorProfile.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, status: true, businessName: true, slug: true },
    });

    // Keep the search index in sync: hidden statuses leave the index, visible ones are (re)indexed.
    const hidden = dto.status === 'SUSPENDED' || dto.status === 'ARCHIVED';
    this.events.emit(hidden ? VENDOR_EVENTS.SUSPENDED : VENDOR_EVENTS.UPDATED, {
      vendorProfileId: id,
    });

    return updated;
  }

  /**
   * Delete a vendor listing.
   *  - default: archive (hidden from the site and search, restorable)
   *  - ?permanent=true: remove the row, but only if the vendor has no business history.
   */
  @Delete(':id')
  @AuditSensitive('DELETE', 'VendorProfile')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('permanent') permanent?: string,
  ) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            leads: true,
            reviews: true,
            payments: true,
            payoutRecords: true,
            campaigns: true,
          },
        },
        subscription: { select: { id: true } },
        vendorContract: { select: { id: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (permanent !== 'true') {
      await this.prisma.vendorProfile.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
      this.events.emit(VENDOR_EVENTS.DELETED, { vendorProfileId: id });
      return { success: true, action: 'archived' };
    }

    const history = vendor._count;
    const hasHistory =
      history.leads > 0 ||
      history.reviews > 0 ||
      history.payments > 0 ||
      history.payoutRecords > 0 ||
      history.campaigns > 0 ||
      Boolean(vendor.subscription) ||
      Boolean(vendor.vendorContract);
    if (hasHistory) {
      throw new ConflictException(
        'This vendor has leads, reviews, payments or a subscription, so it cannot be permanently deleted. Archive it instead.',
      );
    }

    try {
      await this.prisma.vendorProfile.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'This vendor is still referenced by other records, so it cannot be permanently deleted. Archive it instead.',
        );
      }
      throw error;
    }

    this.events.emit(VENDOR_EVENTS.DELETED, { vendorProfileId: id });
    return { success: true, action: 'deleted' };
  }
}
