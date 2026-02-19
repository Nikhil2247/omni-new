// ============================================================================
// OPERATIONAL TASK SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OperationalTask } from '@prisma/client';
import { OperationalTaskRepository } from '../repositories';
import {
  CreateOperationalTaskDto,
  UpdateOperationalTaskDto,
  UpdateTaskStatusDto,
} from '../dto';

@Injectable()
export class OperationalTaskService {
  private readonly logger = new Logger(OperationalTaskService.name);

  constructor(
    private readonly taskRepository: OperationalTaskRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateOperationalTaskDto): Promise<OperationalTask> {
    this.logger.log(
      `Creating operational task for event: ${dto.activeEventId}`,
    );

    const task = await this.taskRepository.create({
      activeEvent: { connect: { id: dto.activeEventId } },
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority ?? 'NORMAL',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignedToUserId: dto.assignedToUserId,
      assignedToVendorId: dto.assignedToVendorId,
      assignedBy: dto.assignedBy,
      status:
        dto.assignedToUserId || dto.assignedToVendorId ? 'ASSIGNED' : 'PENDING',
    });

    this.eventEmitter.emit('operational-task.created', {
      taskId: task.id,
      activeEventId: dto.activeEventId,
    });
    return task;
  }

  async findById(id: string): Promise<OperationalTask> {
    const task = await this.taskRepository.findById(id, { attachments: true });
    if (!task) {
      throw new NotFoundException('Operational task not found');
    }
    return task;
  }

  async findByActiveEvent(activeEventId: string) {
    return this.taskRepository.findByActiveEvent(activeEventId);
  }

  async findByAssignee(userId?: string, vendorId?: string) {
    return this.taskRepository.findByAssignee(userId, vendorId);
  }

  async findAll() {
    return this.taskRepository.findMany({
      where: {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    dto: UpdateOperationalTaskDto,
  ): Promise<OperationalTask> {
    const existing = await this.findById(id);

    const updated = await this.taskRepository.update(id, {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignedToUserId: dto.assignedToUserId,
      assignedToVendorId: dto.assignedToVendorId,
      status: dto.status,
    });

    if (
      dto.assignedToUserId &&
      dto.assignedToUserId !== existing.assignedToUserId
    ) {
      this.eventEmitter.emit('operational-task.assigned', {
        taskId: id,
        activeEventId: existing.activeEventId,
        assignedToUserId: dto.assignedToUserId,
        assignedBy: existing.assignedBy,
      });
    }

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
  ): Promise<OperationalTask> {
    const task = await this.findById(id);

    if (task.status === 'COMPLETED' && dto.status !== 'COMPLETED') {
      throw new ConflictException('Completed tasks cannot change status');
    }

    const updated = await this.taskRepository.update(id, {
      status: dto.status,
      reviewNotes: dto.reviewNotes,
      reviewedBy: dto.reviewedBy,
      reviewedAt: dto.reviewedBy ? new Date() : undefined,
      submittedAt: dto.status === 'SUBMITTED' ? new Date() : undefined,
      completedAt: dto.status === 'COMPLETED' ? new Date() : undefined,
    });

    this.eventEmitter.emit('operational-task.status-changed', {
      taskId: id,
      status: dto.status,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.taskRepository.delete(id);
    this.eventEmitter.emit('operational-task.deleted', { taskId: id });
  }

  async getOverdueTasks() {
    return this.taskRepository.getOverdueTasks();
  }
}
