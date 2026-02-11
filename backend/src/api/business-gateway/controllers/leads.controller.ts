import { Controller, Get, Post, Body, Query, UseGuards, Param, Put, ForbiddenException } from '@nestjs/common'
import { LeadService } from '../../../domain/leads/services/lead.service'
import { CreateLeadFromConversationDto, SearchLeadsDto, UpdateLeadDto } from '../../../domain/leads/dto/lead.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator'
import { CurrentUser, CurrentUserData } from '../../../core/auth/decorators/current-user.decorator'
import { LeadConversionService } from '../../../domain/operations/services/lead-conversion.service'
import { ConvertLeadByVendorDto } from '../../../domain/operations/dto'
import { PrismaService } from '../../../core/database/prisma.service'

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class LeadsController {
	constructor(
		private readonly leadService: LeadService,
		private readonly leadConversionService: LeadConversionService,
		private readonly prisma: PrismaService,
	) {}

	@Post()
	async create(@Body() dto: CreateLeadFromConversationDto, @CurrentUser() user: CurrentUserData) {
		const vendorProfile = await this.prisma.vendorProfile.findUnique({
			where: { userId: user.id },
			select: { id: true },
		})

		if (!vendorProfile) {
			throw new ForbiddenException('Vendor profile required')
		}

		return this.leadService.create({
			...dto,
			vendorProfileId: vendorProfile.id,
		})
	}

	@Get()
	async search(@Query() query: SearchLeadsDto, @CurrentUser() user: CurrentUserData) {
		const vendorProfile = await this.prisma.vendorProfile.findUnique({
			where: { userId: user.id },
			select: { id: true },
		})

		if (!vendorProfile) {
			throw new ForbiddenException('Vendor profile required')
		}

		return this.leadService.search({
			...query,
			vendorProfileId: vendorProfile.id,
		})
	}

	@Get(':id')
	async getById(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		const lead = await this.leadService.findById(id)
		const vendorProfile = await this.prisma.vendorProfile.findUnique({
			where: { userId: user.id },
			select: { id: true },
		})

		if (!vendorProfile || lead.vendorProfileId !== vendorProfile.id) {
			throw new ForbiddenException('You do not have access to this lead')
		}

		return lead
	}

	@Put(':id/status')
	async updateStatus(
		@Param('id') id: string,
		@Body() dto: UpdateLeadDto,
		@CurrentUser() user: CurrentUserData,
	) {
		const lead = await this.leadService.findById(id)
		const vendorProfile = await this.prisma.vendorProfile.findUnique({
			where: { userId: user.id },
			select: { id: true },
		})

		if (!vendorProfile || lead.vendorProfileId !== vendorProfile.id) {
			throw new ForbiddenException('You do not have access to this lead')
		}

		return this.leadService.update(id, dto)
	}

	@Post(':id/accept')
	async acceptLead(
		@Param('id') id: string,
		@Body() dto: ConvertLeadByVendorDto,
		@CurrentUser() user: CurrentUserData,
	) {
		return this.leadConversionService.convertLeadByVendor({
			...dto,
			leadId: id,
		}, user.id)
	}
}
