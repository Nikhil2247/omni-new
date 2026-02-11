import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common'
import { TimelineService } from '../../../domain/planning/services/timeline.service'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator'

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class CalendarController {
	constructor(private readonly timelineService: TimelineService) {}

	@Get()
	async list(@Query('eventId') eventId: string) {
		if (!eventId) {
			throw new BadRequestException('eventId is required')
		}
		return this.timelineService.findByEventId(eventId)
	}
}
