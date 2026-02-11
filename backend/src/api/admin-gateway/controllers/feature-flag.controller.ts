import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { SystemAdminOnly } from '../../../core/auth/decorators/roles.decorator'
import { CreateFeatureFlagDto, UpdateFeatureFlagDto } from '../dto/feature-flag.dto'
import { FeatureFlagService } from '../services/feature-flag.service'

@Controller('feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
@SystemAdminOnly()
export class FeatureFlagController {
  constructor(private readonly featureFlags: FeatureFlagService) {}

  @Get()
  list() {
    return this.featureFlags.list()
  }

  @Post()
  create(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlags.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.featureFlags.update(id, dto)
  }
}
