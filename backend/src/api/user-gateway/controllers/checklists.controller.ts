import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChecklistService } from '../../../domain/planning/services/checklist.service';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
} from '../../../domain/planning/dto/checklist.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('checklists')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class ChecklistsController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  create(@Body() dto: CreateChecklistDto) {
    return this.checklistService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.checklistService.findById(id);
  }

  @Get()
  findByEvent(@Query('eventId') eventId: string) {
    return this.checklistService.findByEventId(eventId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChecklistDto) {
    return this.checklistService.update(id, dto);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: CreateChecklistItemDto) {
    return this.checklistService.addItem(id, dto);
  }

  @Put('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.checklistService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  async deleteItem(@Param('itemId') itemId: string) {
    await this.checklistService.deleteItem(itemId);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.checklistService.delete(id);
    return { success: true };
  }
}
