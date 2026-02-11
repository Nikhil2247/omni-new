import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common'
import { KycVerificationService } from '../../../domain/operations/services/kyc-verification.service'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator'
import { AuditCreate, AuditSensitive } from '../../../core/audit/audit.decorators'

@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class KycController {
	constructor(private readonly kycService: KycVerificationService) {}

	@Post()
	@AuditCreate('VendorKYC')
	create(@Body('vendorProfileId') vendorProfileId: string) {
		return this.kycService.create(vendorProfileId)
	}

	@Get(':id')
	findById(@Param('id') id: string) {
		return this.kycService.findById(id)
	}

	@Get()
	findByVendor(@Query('vendorProfileId') vendorProfileId?: string) {
		if (!vendorProfileId) {
			return null
		}
		return this.kycService.findByVendorProfile(vendorProfileId)
	}

	@Put(':id/submit')
	@AuditSensitive('SUBMIT', 'VendorKYC')
	submit(@Param('id') id: string) {
		return this.kycService.submit(id)
	}

	@Put(':id/review')
	@AuditSensitive('REVIEW', 'VendorKYC')
	startReview(@Param('id') id: string, @Body('reviewerId') reviewerId: string) {
		return this.kycService.startReview(id, reviewerId)
	}

	@Put(':id/approve')
	@AuditSensitive('APPROVE', 'VendorKYC')
	approve(@Param('id') id: string, @Body('reviewerId') reviewerId: string) {
		return this.kycService.approve(id, reviewerId)
	}

	@Put(':id/reject')
	@AuditSensitive('REJECT', 'VendorKYC')
	reject(
		@Param('id') id: string,
		@Body('reviewerId') reviewerId: string,
		@Body('reason') reason: string,
	) {
		return this.kycService.reject(id, reviewerId, reason)
	}
}
