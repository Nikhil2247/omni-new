import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { CategoryLookupService } from '../../../core/lookup/category-lookup.service';

@Controller('lookups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUSINESS_ADMIN')
export class LookupsController {
  constructor(
    private readonly categoryLookupService: CategoryLookupService,
  ) {}

  @Get('categories')
  getCategories() {
    return this.categoryLookupService.getAllCategories();
  }
}
