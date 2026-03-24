import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { SystemAdminOnly } from '../../../core/auth/decorators/roles.decorator';
import {
  BulkUpdateFeatureFlagsDto,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from '../dto/feature-flag.dto';
import { FeatureFlagService } from '../services/feature-flag.service';

@ApiTags('Admin - Feature Flags')
@Controller('feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
@SystemAdminOnly()
export class FeatureFlagController {
  constructor(private readonly featureFlags: FeatureFlagService) {}

  @Get()
  @ApiOperation({ summary: 'List all feature flags' })
  list() {
    return this.featureFlags.list();
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get a feature flag by key' })
  getByKey(@Param('key') key: string) {
    return this.featureFlags.getByKey(key);
  }

  @Post()
  @ApiOperation({ summary: 'Create a feature flag' })
  create(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlags.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a feature flag' })
  update(@Param('id') id: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.featureFlags.update(id, dto);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update feature flags' })
  bulkUpdate(@Body() dto: BulkUpdateFeatureFlagsDto) {
    return this.featureFlags.bulkUpdate(dto);
  }
}
