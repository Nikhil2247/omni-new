import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventMemoryService } from '../../../domain/planning/services/event-memory.service';
import { CreateEventMemoryDto } from '../../../domain/planning/dto/event-memory.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('memories')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class MemoriesController {
  constructor(private readonly memoryService: EventMemoryService) {}

  @Post()
  create(@Body() dto: CreateEventMemoryDto) {
    return this.memoryService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.memoryService.findById(id);
  }

  @Get()
  findByEvent(
    @Query('eventId') eventId: string,
    @Query('type') type?: 'PHOTO' | 'VIDEO',
  ) {
    if (type) {
      return this.memoryService.findByType(eventId, type);
    }
    return this.memoryService.findByEvent(eventId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.memoryService.delete(id);
    return { success: true };
  }
}
