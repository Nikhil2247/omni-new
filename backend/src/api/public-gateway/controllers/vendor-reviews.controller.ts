import { Controller, Get, Param } from '@nestjs/common'
import { VendorReviewService } from '../../../domain/catalog/services/vendor-review.service'

@Controller('vendor-reviews')
export class VendorReviewsController {
  constructor(private readonly vendorReviewService: VendorReviewService) {}

  @Get(':vendorProfileId')
  list(@Param('vendorProfileId') vendorProfileId: string) {
    return this.vendorReviewService.listForVendor(vendorProfileId)
  }
}
