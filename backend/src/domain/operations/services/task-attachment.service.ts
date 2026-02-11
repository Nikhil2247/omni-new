// ============================================================================
// TASK ATTACHMENT SERVICE - Operations Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { TaskAttachment } from '@prisma/client'
import { TaskAttachmentRepository } from '../repositories'
import { CreateTaskAttachmentDto } from '../dto'


@Injectable()
export class TaskAttachmentService {
	private readonly logger = new Logger(TaskAttachmentService.name)

	constructor(
		private readonly attachmentRepository: TaskAttachmentRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async create(dto: CreateTaskAttachmentDto): Promise<TaskAttachment> {
		this.logger.log(`Creating task attachment for task: ${dto.taskId}`)

		const attachment = await this.attachmentRepository.create({
			task: { connect: { id: dto.taskId } },
			type: dto.type,
			url: dto.url,
			fileName: dto.fileName,
			fileSize: dto.fileSize,
			mimeType: dto.mimeType,
			description: dto.description,
			uploadedBy: dto.uploadedBy,
		})

		this.eventEmitter.emit('task-attachment.created', { attachmentId: attachment.id, taskId: dto.taskId })
		return attachment
	}

	async findById(id: string): Promise<TaskAttachment> {
		const attachment = await this.attachmentRepository.findById(id)
		if (!attachment) {
			throw new NotFoundException('Task attachment not found')
		}
		return attachment
	}

	async findByTask(taskId: string) {
		return this.attachmentRepository.findByTask(taskId)
	}

	async delete(id: string): Promise<void> {
		await this.findById(id)
		await this.attachmentRepository.delete(id)
		this.eventEmitter.emit('task-attachment.deleted', { attachmentId: id })
	}
}
