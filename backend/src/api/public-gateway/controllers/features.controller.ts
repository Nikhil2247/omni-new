import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { PrismaService } from '../../../core/database/prisma.service';

@ApiTags('Features')
@Controller('features')
@Public()
export class FeaturesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get enabled feature flags' })
  async getEnabledFeatures() {
    const flags = await this.prisma.featureFlag.findMany({
      where: { enabled: true },
      select: { key: true },
    });

    return {
      features: flags.map((f) => f.key),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all feature flags with details' })
  async getAllFeatures() {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return { flags, timestamp: new Date().toISOString() };
  }
}
