import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { AuditCategory, AuditSeverity } from '../../../core/audit/audit.types';
import { PrismaService } from '../../../core/database/prisma.service';
import {
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
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async create(dto: CreateFeatureFlagDto) {
    const created = await this.prisma.featureFlag.create({
      data: {
        key: dto.key,
        description: dto.description,
        enabled: dto.enabled ?? false,
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
        description: dto.description ?? current.description,
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
}
