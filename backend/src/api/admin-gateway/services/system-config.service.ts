import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { AuditCategory, AuditSeverity } from '../../../core/audit/audit.types';
import { PrismaService } from '../../../core/database/prisma.service';

export interface SystemConfigState {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  allowVendorOnboarding: boolean;
  supportEmail?: string;
}

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private getDefaults(): SystemConfigState {
    return {
      maintenanceMode: false,
      registrationEnabled: true,
      allowVendorOnboarding: true,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@omnicassion.com',
    };
  }

  async getConfig() {
    const existing = await this.prisma.systemConfig.findFirst();
    if (existing) {
      return existing;
    }

    const defaults = this.getDefaults();
    return this.prisma.systemConfig.create({
      data: defaults,
    });
  }

  async updateConfig(partial: Partial<SystemConfigState>, updatedBy?: string) {
    const current = await this.prisma.systemConfig.findFirst();
    const base = current ?? (await this.getConfig());

    const updatePayload = {
      ...partial,
      ...(updatedBy ? { updatedBy } : {}),
    };

    const updated = await this.prisma.systemConfig.upsert({
      where: { id: base.id },
      create: {
        ...this.getDefaults(),
        ...partial,
        ...(updatedBy ? { updatedBy } : {}),
      },
      update: updatePayload,
    });

    await this.auditService.log({
      category: AuditCategory.SYSTEM,
      action: 'CONFIG_UPDATE',
      entityType: 'SystemConfig',
      entityId: updated.id,
      oldValue: current ?? null,
      newValue: updated,
      severity: AuditSeverity.INFO,
    });

    return updated;
  }
}
