import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { KycVerificationService } from '../../../domain/operations/services/kyc-verification.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  AuditCreate,
  AuditSensitive,
} from '../../../core/audit/audit.decorators';

@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(private readonly kycService: KycVerificationService) {}

  @Post()
  @AuditCreate('VendorKYC')
  create(@Body('vendorProfileId') vendorProfileId: string) {
    return this.kycService.create(vendorProfileId);
  }

  @Get()
  async findAll(
    @Query('vendorProfileId') vendorProfileId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    this.logger.log(`KYC findAll called - vendorProfileId: ${vendorProfileId}, status: ${status}`);

    // If vendorProfileId is provided, return single KYC record
    if (vendorProfileId) {
      this.logger.log(`Fetching KYC by vendorProfileId: ${vendorProfileId}`);
      return this.kycService.findByVendorProfile(vendorProfileId);
    }

    // Otherwise return list of all KYC records
    this.logger.log('Fetching all KYC records');
    const statusArray = status?.split(',').filter(Boolean) as any;
    const result = await this.kycService.findAll({
      status: statusArray?.length ? statusArray : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
    this.logger.log(`Returning ${result?.length ?? 0} KYC records`);
    return result;
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.kycService.findById(id);
  }

  @Put(':id/submit')
  @AuditSensitive('SUBMIT', 'VendorKYC')
  submit(@Param('id') id: string) {
    return this.kycService.submit(id);
  }

  @Put(':id/review')
  @AuditSensitive('REVIEW', 'VendorKYC')
  startReview(@Param('id') id: string, @Body('reviewerId') reviewerId: string) {
    return this.kycService.startReview(id, reviewerId);
  }

  @Put(':id/approve')
  @AuditSensitive('APPROVE', 'VendorKYC')
  approve(@Param('id') id: string, @Body('reviewerId') reviewerId: string) {
    return this.kycService.approve(id, reviewerId);
  }

  @Put(':id/reject')
  @AuditSensitive('REJECT', 'VendorKYC')
  reject(
    @Param('id') id: string,
    @Body('reviewerId') reviewerId: string,
    @Body('reason') reason: string,
  ) {
    return this.kycService.reject(id, reviewerId, reason);
  }
}
