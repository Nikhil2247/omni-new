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
import { ActiveEventService } from '../../../domain/operations/services/active-event.service';
import {
  CreateActiveEventDto,
  UpdateActiveEventDto,
  SearchActiveEventsDto,
} from '../../../domain/operations/dto/active-event.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';
import { UserId } from '../../../core/auth/decorators/current-user.decorator';
import {
  AuditCreate,
  AuditDelete,
  AuditSensitive,
  AuditUpdate,
} from '../../../core/audit/audit.decorators';

@Controller('active-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class ActiveEventsController {
  constructor(private readonly activeEventService: ActiveEventService) {}

  @Post()
  @AuditCreate('ActiveEvent')
  create(@Body() dto: CreateActiveEventDto, @UserId() opsAdminId: string) {
    return this.activeEventService.create(dto, opsAdminId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.activeEventService.findById(id);
  }

  @Get()
  search(@Query() query: SearchActiveEventsDto) {
    return this.activeEventService.search(query);
  }

  @Put(':id')
  @AuditUpdate('ActiveEvent')
  update(@Param('id') id: string, @Body() dto: UpdateActiveEventDto) {
    return this.activeEventService.update(id, dto);
  }

  @Put(':id/status')
  @AuditSensitive('STATUS_CHANGE', 'ActiveEvent')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.activeEventService.updateStatus(id, status);
  }

  @Put(':id/assign-manager')
  @AuditSensitive('ASSIGN_MANAGER', 'ActiveEvent')
  assignManager(
    @Param('id') id: string,
    @Body('opsManagerId') opsManagerId: string,
  ) {
    return this.activeEventService.assignManager(id, opsManagerId);
  }

  @Delete(':id')
  @AuditDelete('ActiveEvent')
  async remove(@Param('id') id: string) {
    await this.activeEventService.delete(id);
    return { success: true };
  }
}
