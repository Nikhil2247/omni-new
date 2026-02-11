import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ServiceService } from '../../../domain/catalog/services/service.service'
import { CreateServiceDto, UpdateServiceDto } from '../../../domain/catalog/dto/service.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator'

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class ServicesController {
	constructor(private readonly serviceService: ServiceService) {}

	@Post()
	create(@Body() dto: CreateServiceDto) {
		return this.serviceService.create(dto)
	}

	@Get(':id')
	findById(@Param('id') id: string) {
		return this.serviceService.findById(id)
	}

	@Get()
	findByVendor(@Query('vendorProfileId') vendorProfileId: string) {
		return this.serviceService.findByVendorProfile(vendorProfileId, true)
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
		return this.serviceService.update(id, dto)
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		await this.serviceService.delete(id)
		return { success: true }
	}
}
