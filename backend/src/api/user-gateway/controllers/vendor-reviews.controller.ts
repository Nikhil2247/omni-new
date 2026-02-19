import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { VendorReviewService } from '../../../domain/catalog/services/vendor-review.service';
import {
  CreateVendorReviewDto,
  UpdateVendorReviewDto,
} from '../../../domain/catalog/dto/vendor-review.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class VendorReviewsController {
  constructor(private readonly vendorReviewService: VendorReviewService) {}

  @Post()
  create(
    @Body() dto: CreateVendorReviewDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.vendorReviewService.create(user.id, dto);
  }

  @Get()
  listMine(@CurrentUser() user: CurrentUserData) {
    return this.vendorReviewService.listByReviewer(user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVendorReviewDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.vendorReviewService.update(user.id, id, dto);
  }
}
