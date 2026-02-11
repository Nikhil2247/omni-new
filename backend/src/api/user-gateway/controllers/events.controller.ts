import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { EventService } from '../../../domain/planning/services/event.service'
import { CreateEventDto, UpdateEventDto, SearchEventDto } from '../../../domain/planning/dto/event.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { UserAccess } from '../../../core/auth/decorators/roles.decorator'
import { UserId } from '../../../core/auth/decorators/current-user.decorator'
import { AuditCreate, AuditDelete, AuditUpdate } from '../../../core/audit/audit.decorators'

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class EventsController {
	constructor(private readonly eventService: EventService) {}

	@Post()
	@AuditCreate('Event')
	create(@Body() dto: CreateEventDto, @UserId() userId: string) {
		return this.eventService.create(dto, userId)
	}

	@Get(':id')
	findById(@Param('id') id: string) {
		return this.eventService.findById(id)
	}

	@Get()
	search(@Query() query: SearchEventDto, @UserId() userId: string) {
		return this.eventService.search(query, userId)
	}

	@Put(':id')
	@AuditUpdate('Event')
	update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
		return this.eventService.update(id, dto)
	}

	@Delete(':id')
	@AuditDelete('Event')
	async remove(@Param('id') id: string) {
		await this.eventService.delete(id)
		return { success: true }
	}
}

