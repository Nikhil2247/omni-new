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
import { BudgetService } from '../../../domain/planning/services/budget.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  CreateBudgetItemDto,
  UpdateBudgetItemDto,
} from '../../../domain/planning/dto/budget.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('budget')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.budgetService.findById(id);
  }

  @Get()
  findByEvent(@Query('eventId') eventId: string) {
    return this.budgetService.findByEventId(eventId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetService.update(id, dto);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: CreateBudgetItemDto) {
    return this.budgetService.addItem(id, dto);
  }

  @Put('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateBudgetItemDto,
  ) {
    return this.budgetService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  async deleteItem(@Param('itemId') itemId: string) {
    await this.budgetService.deleteItem(itemId);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.budgetService.delete(id);
    return { success: true };
  }
}
