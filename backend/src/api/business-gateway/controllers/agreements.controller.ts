import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VendorAgreementService } from '../../../domain/operations/services/vendor-agreement.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('agreements')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class AgreementsController {
  constructor(
    private readonly vendorAgreementService: VendorAgreementService,
  ) {}

  @Get()
  findByVendor(@Query('vendorProfileId') vendorProfileId: string) {
    return this.vendorAgreementService.findByVendor(vendorProfileId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.vendorAgreementService.findById(id);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.vendorAgreementService.markAsAccepted(id);
  }

  @Post(':id/decline')
  decline(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.vendorAgreementService.markAsDeclined(id, reason);
  }
}
