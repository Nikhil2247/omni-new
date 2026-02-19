import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { VendorFollowService } from '../../../domain/catalog/services/vendor-follow.service';
import { ToggleVendorFollowDto } from '../../../domain/catalog/dto/vendor-follow.dto';

@Controller('vendors/follows')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class VendorFollowsController {
  constructor(private readonly vendorFollowService: VendorFollowService) {}

  @Post()
  toggle(
    @Body() dto: ToggleVendorFollowDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.vendorFollowService.toggle(user.id, dto.vendorProfileId);
  }

  @Get(':vendorProfileId')
  status(
    @Param('vendorProfileId') vendorProfileId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.vendorFollowService.status(user.id, vendorProfileId);
  }
}
