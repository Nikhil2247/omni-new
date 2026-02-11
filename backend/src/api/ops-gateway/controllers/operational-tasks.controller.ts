import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { OperationalTaskService } from '../../../domain/operations/services/operational-task.service'
import { CreateOperationalTaskDto } from '../../../domain/operations/dto/create-operational-task.dto'
import { UpdateOperationalTaskDto } from '../../../domain/operations/dto/operational-task.dto'
import { UpdateTaskStatusDto } from '../../../domain/operations/dto/update-task-status.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator'
import { AuditCreate, AuditDelete, AuditSensitive, AuditUpdate } from '../../../core/audit/audit.decorators'

@Controller('operational-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class OperationalTasksController {
	constructor(private readonly taskService: OperationalTaskService) {}

	@Post()
	@AuditCreate('OperationalTask')
	create(@Body() dto: CreateOperationalTaskDto) {
		return this.taskService.create(dto)
	}

	@Get(':id')
	findById(@Param('id') id: string) {
		return this.taskService.findById(id)
	}

	@Get()
	list(
		@Query('activeEventId') activeEventId?: string,
		@Query('assignedToUserId') assignedToUserId?: string,
		@Query('assignedToVendorId') assignedToVendorId?: string,
	) {
		if (activeEventId) {
			return this.taskService.findByActiveEvent(activeEventId)
		}

		if (assignedToUserId || assignedToVendorId) {
			return this.taskService.findByAssignee(assignedToUserId, assignedToVendorId)
		}

		return this.taskService.findAll()
	}

	@Put(':id')
	@AuditUpdate('OperationalTask')
	update(@Param('id') id: string, @Body() dto: UpdateOperationalTaskDto) {
		return this.taskService.update(id, dto)
	}

	@Put(':id/status')
	@AuditSensitive('STATUS_CHANGE', 'OperationalTask')
	updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
		return this.taskService.updateStatus(id, dto)
	}

	@Delete(':id')
	@AuditDelete('OperationalTask')
	async remove(@Param('id') id: string) {
		await this.taskService.delete(id)
		return { success: true }
	}
}
