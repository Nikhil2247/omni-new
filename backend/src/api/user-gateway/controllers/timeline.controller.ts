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
import { TimelineService } from '../../../domain/planning/services/timeline.service';
import {
  CreateTimelineDto,
  CreateTimelineItemDto,
  UpdateTimelineDto,
  UpdateTimelineItemDto,
} from '../../../domain/planning/dto/timeline.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('timeline')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Post()
  create(@Body() dto: CreateTimelineDto) {
    return this.timelineService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.timelineService.findById(id);
  }

  @Get()
  findByEvent(@Query('eventId') eventId: string) {
    return this.timelineService.findByEventId(eventId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTimelineDto,
  ) {
    return this.timelineService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.timelineService.delete(id);
    return { success: true };
  }

  // Timeline Items Management
  @Post(':id/items')
  addItem(
    @Param('id') timelineId: string,
    @Body()
    item: CreateTimelineItemDto,
  ) {
    return this.timelineService.addItem(timelineId, item);
  }

  @Put(':id/items/:itemId')
  updateItem(
    @Param('id') timelineId: string,
    @Param('itemId') itemId: string,
    @Body() updates: UpdateTimelineItemDto,
  ) {
    return this.timelineService.updateItem(timelineId, itemId, updates);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') timelineId: string, @Param('itemId') itemId: string) {
    return this.timelineService.removeItem(timelineId, itemId);
  }
}
