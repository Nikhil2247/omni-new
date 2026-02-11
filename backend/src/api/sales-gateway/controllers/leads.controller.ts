import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { LeadService } from '../../../domain/leads/services/lead.service'
import { CreateLeadDto, SearchLeadsDto } from '../../../domain/leads/dto/lead.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { SalesAccess } from '../../../core/auth/decorators/roles.decorator'

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@SalesAccess()
export class LeadsController {
	constructor(private readonly leadService: LeadService) {}

	@Post()
	create(@Body() dto: CreateLeadDto) {
		return this.leadService.create(dto)
	}

	@Get()
	search(@Query() query: SearchLeadsDto) {
		return this.leadService.search(query)
	}
}
