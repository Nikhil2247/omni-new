import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common'
import { DisputeService } from '../../../domain/operations/services/dispute.service'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator'

@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class DisputesController {
	constructor(private readonly disputeService: DisputeService) {}

	@Post()
	create(@Body() dto: any) {
		return this.disputeService.create(dto)
	}

	@Get(':id')
	findById(@Param('id') id: string) {
		return this.disputeService.findById(id)
	}

	@Get()
	list(@Query('vendorProfileId') vendorProfileId?: string, @Query('reporterId') reporterId?: string) {
		if (vendorProfileId) {
			return this.disputeService.findByVendor(vendorProfileId)
		}
		if (reporterId) {
			return this.disputeService.findByReporter(reporterId)
		}
		return this.disputeService.findAll()
	}

	@Put(':id/investigate')
	investigate(@Param('id') id: string) {
		return this.disputeService.startInvestigation(id)
	}

	@Put(':id/resolve')
	resolve(@Param('id') id: string, @Body('resolution') resolution: string, @Body('resolvedBy') resolvedBy: string) {
		return this.disputeService.resolve(id, resolution, resolvedBy)
	}
}
