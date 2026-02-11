import { Controller, Get } from '@nestjs/common'
import { Public } from '../../../core/auth/decorators/public.decorator'
import { PrismaService } from '../../../core/database/prisma.service'

@Controller('system')
@Public()
export class SystemStatusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('status')
  async getStatus() {
    const existing = await this.prisma.systemConfig.findFirst()

    if (existing) {
      return {
        maintenanceMode: existing.maintenanceMode,
        supportEmail: existing.supportEmail ?? undefined,
        updatedAt: existing.updatedAt?.toISOString(),
      }
    }

    const defaults = {
      maintenanceMode: false,
      registrationEnabled: true,
      allowVendorOnboarding: true,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@omnicassion.com',
    }

    const created = await this.prisma.systemConfig.create({ data: defaults })

    return {
      maintenanceMode: created.maintenanceMode,
      supportEmail: created.supportEmail ?? undefined,
      updatedAt: created.updatedAt?.toISOString(),
    }
  }
}