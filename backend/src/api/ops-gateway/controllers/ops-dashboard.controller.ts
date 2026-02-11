import { Controller, Get, UseGuards } from '@nestjs/common'
import { OpsDashboardService } from '../../../domain/operations/services/ops-dashboard.service'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator'

@Controller('ops-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class OpsDashboardController {
	constructor(private readonly opsDashboardService: OpsDashboardService) {}

	@Get('metrics')
	getMetrics() {
		return this.opsDashboardService.getMetrics()
	}
}
