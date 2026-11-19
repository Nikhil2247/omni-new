import {
  BadRequestException,
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
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditSensitive } from '../../../core/audit/audit.decorators';
import { CATEGORY_EVENTS } from '../../../core/events/event-constants';
import {
  CreateAdminCategoryDto,
  UpdateAdminCategoryDto,
} from '../dto/admin-catalog.dto';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Vendor category management. Changes emit the category events the rest of the platform already listens to, so the
 * in-memory lookup cache and the search index update, and the public site (filters, category pages, sitemap) follows.
 */
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminCategoriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  @Get()
  async list() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { vendors: true, children: true, serviceTypes: true } },
      },
    });
    return { data: categories };
  }

  @Post()
  @AuditSensitive('CREATE', 'Category')
  async create(@Body() dto: CreateAdminCategoryDto) {
    const slug = dto.slug || slugify(dto.name);
    if (!slug) throw new BadRequestException('A valid name or slug is required');

    await this.assertUnique({ name: dto.name, slug });

    const created = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        icon: dto.icon?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        parentId: dto.parentId ?? null,
      },
    });

    this.events.emit(CATEGORY_EVENTS.CREATED, { categoryId: created.id });
    return created;
  }

  @Patch(':id')
  @AuditSensitive('UPDATE', 'Category')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAdminCategoryDto,
  ) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    await this.assertUnique({ name: dto.name, slug: dto.slug }, id);

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.icon !== undefined && { icon: dto.icon?.trim() || null }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
    });

    this.events.emit(CATEGORY_EVENTS.UPDATED, { categoryId: id });
    return updated;
  }

  @Delete(':id')
  @AuditSensitive('DELETE', 'Category')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { vendors: true, children: true, serviceTypes: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');

    const { vendors, children, serviceTypes } = category._count;
    if (vendors > 0) {
      throw new ConflictException(
        `${vendors} vendor(s) use this category. Move them to another category first, or deactivate this one instead.`,
      );
    }
    if (children > 0) {
      throw new ConflictException(
        `This category has ${children} subcategor${children === 1 ? 'y' : 'ies'}. Remove or move them first.`,
      );
    }
    if (serviceTypes > 0) {
      throw new ConflictException(
        `This category has ${serviceTypes} service type(s). Remove them first, or deactivate the category instead.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });
    this.events.emit(CATEGORY_EVENTS.DELETED, { categoryId: id });
    return { success: true };
  }

  private async assertUnique(
    fields: { name?: string; slug?: string },
    excludeId?: string,
  ) {
    const or = [
      ...(fields.name ? [{ name: { equals: fields.name.trim(), mode: 'insensitive' as const } }] : []),
      ...(fields.slug ? [{ slug: fields.slug }] : []),
    ];
    if (!or.length) return;

    const clash = await this.prisma.category.findFirst({
      where: { OR: or, ...(excludeId && { NOT: { id: excludeId } }) },
      select: { name: true, slug: true },
    });
    if (clash) {
      throw new ConflictException(
        `A category named "${clash.name}" (slug "${clash.slug}") already exists.`,
      );
    }
  }
}
