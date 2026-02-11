import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator'
import { CurrentUser, CurrentUserData } from '../../../core/auth/decorators/current-user.decorator'
import { VendorReviewService } from '../../../domain/catalog/services/vendor-review.service'
import { RespondVendorReviewDto } from '../../../domain/catalog/dto/vendor-review.dto'

@Controller('vendor-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class VendorReviewsController {
  constructor(private readonly vendorReviewService: VendorReviewService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserData) {
    return this.vendorReviewService.listForVendorUser(user.id)
  }

  @Post(':id/respond')
  respond(@Param('id') id: string, @Body() dto: RespondVendorReviewDto, @CurrentUser() user: CurrentUserData) {
    return this.vendorReviewService.respond(user.id, id, dto)
  }
}
