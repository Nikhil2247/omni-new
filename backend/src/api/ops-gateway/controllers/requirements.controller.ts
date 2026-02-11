import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { RequirementSheetService } from '../../../domain/operations/services/requirement-sheet.service'
import { CreateRequirementSheetDto, UpdateRequirementSheetDto } from '../../../domain/operations/dto/requirement-sheet.dto'
import { CreateRequirementItemDto, UpdateRequirementItemDto } from '../../../domain/operations/dto/requirement-item.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator'
import { UserId } from '../../../core/auth/decorators/current-user.decorator'

@Controller('requirements')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class RequirementsController {
	constructor(private readonly requirementSheetService: RequirementSheetService) {}

	@Post()
	create(@Body() dto: CreateRequirementSheetDto, @UserId() opsManagerId: string) {
		return this.requirementSheetService.create(dto, opsManagerId)
	}

	@Get(':id')
	findById(@Param('id') id: string) {
		return this.requirementSheetService.findById(id)
	}

	@Get()
	findByActiveEvent(@Query('activeEventId') activeEventId: string) {
		if (!activeEventId) {
			return null
		}
		return this.requirementSheetService.findByActiveEvent(activeEventId)
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() dto: UpdateRequirementSheetDto) {
		return this.requirementSheetService.update(id, dto)
	}

	@Post(':id/items')
	addItem(@Param('id') id: string, @Body() dto: CreateRequirementItemDto) {
		return this.requirementSheetService.addItem(id, dto)
	}

	@Put('items/:itemId')
	updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateRequirementItemDto) {
		return this.requirementSheetService.updateItem(itemId, dto)
	}

	@Delete('items/:itemId')
	async deleteItem(@Param('itemId') itemId: string) {
		await this.requirementSheetService.deleteItem(itemId)
		return { success: true }
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		await this.requirementSheetService.delete(id)
		return { success: true }
	}
}
