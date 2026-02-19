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
import { TaskAttachmentService } from '../../../domain/operations/services/task-attachment.service';
import { CreateTaskAttachmentDto } from '../../../domain/operations/dto/task-attachment.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('task-attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class TaskAttachmentsController {
  constructor(private readonly attachmentService: TaskAttachmentService) {}

  @Post()
  create(@Body() dto: CreateTaskAttachmentDto) {
    return this.attachmentService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.attachmentService.findById(id);
  }

  @Get()
  findByTask(@Query('taskId') taskId: string) {
    return this.attachmentService.findByTask(taskId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.attachmentService.delete(id);
    return { success: true };
  }
}
