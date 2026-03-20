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
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { UserSubscriptionGuard } from '../../../domain/subscription/guards/user-subscription.guard';
import {
  CheckMemoryUploadsLimit,
  RequireBasicPlan,
} from '../../../domain/subscription/decorators/user-subscription.decorators';
import { UserUsageService } from '../../../domain/subscription/services/user-usage.service';

@Controller('memories')
@UseGuards(JwtAuthGuard, RolesGuard, UserSubscriptionGuard)
@UserAccess()
export class MemoriesController {
  constructor(
    private readonly memoryService: EventMemoryService,
    private readonly userUsageService: UserUsageService,
  ) {}

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
