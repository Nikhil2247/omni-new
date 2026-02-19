import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class VendorsController {
  constructor(private readonly vendorProfileService: VendorProfileService) {}

  @Get()
  async list(@Query() query: any) {
    const result = await this.vendorProfileService.search({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
      status: query.status || 'ACTIVE',
      ...query,
    });
    return result.data;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.vendorProfileService.findById(id);
  }
}
