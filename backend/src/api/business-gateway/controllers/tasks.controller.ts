import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { OperationalTaskService } from '../../../domain/operations/services/operational-task.service'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator'

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class TasksController {
	constructor(private readonly taskService: OperationalTaskService) {}

	@Get()
	findByVendor(@Query('assignedToVendorId') assignedToVendorId: string) {
		return this.taskService.findByAssignee(undefined, assignedToVendorId)
	}
}
