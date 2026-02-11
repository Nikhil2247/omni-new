import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common'
import { VendorMetricsService } from '../../../domain/insights/services/vendor-metrics.service'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator'
import { VendorProfileService } from 'src/domain'

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class AnalyticsController {
	constructor(
		private readonly vendorProfileService: VendorProfileService,
		private readonly vendorMetricsService: VendorMetricsService,
	) {}

	@Get('summary')
	async summary(@Query('days') days: string | undefined, @Request() req: any) {
		const profile = await this.vendorProfileService.findByUserId(req.user.id)
		const parsedDays = Number(days)
		return this.vendorMetricsService.getVendorSummary(
			profile.id,
			Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 30,
		)
	}

	@Get('metrics')
	async metrics(
		@Query('startDate') startDate: string | undefined,
		@Query('endDate') endDate: string | undefined,
		@Request() req: any,
	) {
		const profile = await this.vendorProfileService.findByUserId(req.user.id)
		const end = endDate ? new Date(endDate) : new Date()
		const start = startDate
			? new Date(startDate)
			: new Date(new Date(end).setDate(end.getDate() - 30))
		return this.vendorMetricsService.getVendorMetrics(profile.id, start, end)
	}
}
