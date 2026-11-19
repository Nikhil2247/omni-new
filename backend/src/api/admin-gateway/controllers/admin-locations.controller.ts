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
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { PrismaService } from '../../../core/database/prisma.service';
import { CountryLookupService } from '../../../core/lookup/country-lookup.service';
import { AuditSensitive } from '../../../core/audit/audit.decorators';
import {
  CreateAdminCityDto,
  CreateAdminCountryDto,
  CreateAdminStateDto,
  SearchAdminCitiesDto,
  UpdateAdminCityDto,
  UpdateAdminCountryDto,
  UpdateAdminStateDto,
} from '../dto/admin-catalog.dto';

/**
 * Location management: countries, states and cities. These feed the city pickers, vendor addresses and the
 * public "vendors in <city>" pages. Every write refreshes the in-memory lookup cache so changes show up immediately.
 */
@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminLocationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly countryLookup: CountryLookupService,
  ) {}

  private refresh() {
    return this.countryLookup.refresh();
  }

  /** Turns Prisma unique-constraint failures into a readable 409. */
  private async guarded<T>(task: () => Promise<T>, what: string): Promise<T> {
    try {
      return await task();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`${what} already exists.`);
      }
      throw error;
    }
  }

  // ───────────────────────────── Countries ─────────────────────────────

  @Get('countries')
  async listCountries() {
    const countries = await this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { states: true } } },
    });
    return { data: countries };
  }

  @Post('countries')
  @AuditSensitive('CREATE', 'Country')
  async createCountry(@Body() dto: CreateAdminCountryDto) {
    const created = await this.guarded(
      () =>
        this.prisma.country.create({
          data: {
            name: dto.name.trim(),
            code: dto.code.toUpperCase(),
            code2: dto.code2.toUpperCase(),
            dialCode: dto.dialCode?.trim() || null,
            currency: dto.currency?.toUpperCase() || null,
            isActive: dto.isActive ?? true,
          },
        }),
      'A country with this name or code',
    );
    await this.refresh();
    return created;
  }

  @Patch('countries/:id')
  @AuditSensitive('UPDATE', 'Country')
  async updateCountry(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAdminCountryDto,
  ) {
    await this.ensureExists(this.prisma.country.findUnique({ where: { id } }), 'Country');
    const updated = await this.guarded(
      () =>
        this.prisma.country.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name.trim() }),
            ...(dto.code !== undefined && { code: dto.code.toUpperCase() }),
            ...(dto.code2 !== undefined && { code2: dto.code2.toUpperCase() }),
            ...(dto.dialCode !== undefined && { dialCode: dto.dialCode?.trim() || null }),
            ...(dto.currency !== undefined && { currency: dto.currency?.toUpperCase() || null }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          },
        }),
      'A country with this name or code',
    );
    await this.refresh();
    return updated;
  }

  @Delete('countries/:id')
  @AuditSensitive('DELETE', 'Country')
  async deleteCountry(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: { _count: { select: { states: true } } },
    });
    if (!country) throw new NotFoundException('Country not found');
    if (country._count.states > 0) {
      throw new ConflictException(
        `This country has ${country._count.states} state(s). Delete them first, or deactivate the country instead.`,
      );
    }
    await this.prisma.country.delete({ where: { id } });
    await this.refresh();
    return { success: true };
  }

  // ────────────────────────────── States ──────────────────────────────

  @Get('states')
  async listStates(@Query('countryId') countryId?: string) {
    const states = await this.prisma.state.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: [{ country: { name: 'asc' } }, { name: 'asc' }],
      include: {
        country: { select: { id: true, name: true } },
        _count: { select: { cities: true } },
      },
    });
    return { data: states };
  }

  @Post('states')
  @AuditSensitive('CREATE', 'State')
  async createState(@Body() dto: CreateAdminStateDto) {
    await this.ensureExists(
      this.prisma.country.findUnique({ where: { id: dto.countryId } }),
      'Country',
    );
    const created = await this.guarded(
      () =>
        this.prisma.state.create({
          data: {
            name: dto.name.trim(),
            code: dto.code?.trim() || null,
            countryId: dto.countryId,
            isActive: dto.isActive ?? true,
          },
        }),
      'A state with this name in this country',
    );
    await this.refresh();
    return created;
  }

  @Patch('states/:id')
  @AuditSensitive('UPDATE', 'State')
  async updateState(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAdminStateDto,
  ) {
    await this.ensureExists(this.prisma.state.findUnique({ where: { id } }), 'State');
    const updated = await this.guarded(
      () =>
        this.prisma.state.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name.trim() }),
            ...(dto.code !== undefined && { code: dto.code?.trim() || null }),
            ...(dto.countryId !== undefined && { countryId: dto.countryId }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          },
        }),
      'A state with this name in this country',
    );
    await this.refresh();
    return updated;
  }

  @Delete('states/:id')
  @AuditSensitive('DELETE', 'State')
  async deleteState(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const state = await this.prisma.state.findUnique({
      where: { id },
      include: { _count: { select: { cities: true } } },
    });
    if (!state) throw new NotFoundException('State not found');
    if (state._count.cities > 0) {
      throw new ConflictException(
        `This state has ${state._count.cities} city(ies). Delete them first, or deactivate the state instead.`,
      );
    }
    await this.prisma.state.delete({ where: { id } });
    await this.refresh();
    return { success: true };
  }

  // ────────────────────────────── Cities ──────────────────────────────

  @Get('cities')
  async listCities(@Query() query: SearchAdminCitiesDto) {
    const { page = 1, limit = 50, query: term, stateId, countryId } = query;

    const where: Prisma.CityWhereInput = {
      ...(stateId && { stateId }),
      ...(countryId && { state: { countryId } }),
      ...(term && { name: { contains: term, mode: 'insensitive' } }),
    };

    const [total, cities] = await this.prisma.$transaction([
      this.prisma.city.count({ where }),
      this.prisma.city.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          state: { select: { id: true, name: true, country: { select: { id: true, name: true } } } },
          _count: { select: { addresses: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: cities,
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

  @Post('cities')
  @AuditSensitive('CREATE', 'City')
  async createCity(@Body() dto: CreateAdminCityDto) {
    await this.ensureExists(
      this.prisma.state.findUnique({ where: { id: dto.stateId } }),
      'State',
    );

    const duplicate = await this.prisma.city.findFirst({
      where: { stateId: dto.stateId, name: { equals: dto.name.trim(), mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('This city already exists in the selected state.');

    const created = await this.prisma.city.create({
      data: {
        name: dto.name.trim(),
        stateId: dto.stateId,
        isActive: dto.isActive ?? true,
      },
    });
    await this.refresh();
    return created;
  }

  @Patch('cities/:id')
  @AuditSensitive('UPDATE', 'City')
  async updateCity(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAdminCityDto,
  ) {
    const existing = await this.prisma.city.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('City not found');

    const name = dto.name?.trim() ?? existing.name;
    const stateId = dto.stateId ?? existing.stateId;
    if (dto.name !== undefined || dto.stateId !== undefined) {
      const duplicate = await this.prisma.city.findFirst({
        where: {
          stateId,
          name: { equals: name, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('This city already exists in the selected state.');
    }

    const updated = await this.prisma.city.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name }),
        ...(dto.stateId !== undefined && { stateId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    await this.refresh();
    return updated;
  }

  @Delete('cities/:id')
  @AuditSensitive('DELETE', 'City')
  async deleteCity(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: { _count: { select: { addresses: true } } },
    });
    if (!city) throw new NotFoundException('City not found');
    if (city._count.addresses > 0) {
      throw new ConflictException(
        `${city._count.addresses} address(es) (vendors, events) use this city. Deactivate it instead of deleting.`,
      );
    }
    await this.prisma.city.delete({ where: { id } });
    await this.refresh();
    return { success: true };
  }

  private async ensureExists<T>(lookup: Promise<T | null>, label: string): Promise<T> {
    const found = await lookup;
    if (!found) throw new NotFoundException(`${label} not found`);
    return found;
  }
}
