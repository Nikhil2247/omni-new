import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { AuditCategory, AuditSeverity } from '../../../core/audit/audit.types';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  BulkUpdateFeatureFlagsDto,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from '../dto/feature-flag.dto';

@Injectable()
export class FeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  list() {
    return this.prisma.featureFlag.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async create(dto: CreateFeatureFlagDto) {
    const created = await this.prisma.featureFlag.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        category: dto.category ?? 'system',
        enabled: dto.enabled ?? false,
        isSystem: dto.isSystem ?? false,
      },
    });

    await this.auditService.log({
      category: AuditCategory.SYSTEM,
      action: 'FEATURE_FLAG_CREATE',
      entityType: 'FeatureFlag',
      entityId: created.id,
      newValue: created,
      severity: AuditSeverity.INFO,
    });

    return created;
  }

  async update(id: string, dto: UpdateFeatureFlagDto) {
    const current = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Feature flag not found');
    }

    const updated = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        name: dto.name ?? current.name,
        description: dto.description ?? current.description,
        category: dto.category ?? current.category,
        enabled: dto.enabled ?? current.enabled,
      },
    });

    await this.auditService.log({
      category: AuditCategory.SYSTEM,
      action: 'FEATURE_FLAG_UPDATE',
      entityType: 'FeatureFlag',
      entityId: updated.id,
      oldValue: current,
      newValue: updated,
      severity: AuditSeverity.INFO,
    });

    return updated;
  }

  async bulkUpdate(dto: BulkUpdateFeatureFlagsDto) {
    const result = await this.prisma.featureFlag.updateMany({
      where: { id: { in: dto.ids } },
      data: { enabled: dto.enabled },
    });

    await this.auditService.log({
      category: AuditCategory.SYSTEM,
      action: 'FEATURE_FLAG_BULK_UPDATE',
      entityType: 'FeatureFlag',
      entityId: dto.ids.join(','),
      newValue: { ids: dto.ids, enabled: dto.enabled },
      severity: AuditSeverity.INFO,
    });

    return { updated: result.count };
  }
}
