// ============================================================================
// GUEST UPLOAD SERVICE - Planning Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GuestUpload, UploadStatus, PlanningMediaType } from '@prisma/client';
import { GuestUploadRepository } from '../repositories/guest-upload.repository';
import { EventMemoryRepository } from '../repositories/event-memory.repository';
import { PrismaService } from '../../../core/database/prisma.service';

export interface CreateGuestUploadInput {
  eventMemoryId: string;
  uploaderName?: string;
  uploaderEmail?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: PlanningMediaType;
  fileSize: number;
  caption?: string;
}

@Injectable()
export class GuestUploadService {
  private readonly logger = new Logger(GuestUploadService.name);

  constructor(
    private readonly guestUploadRepository: GuestUploadRepository,
    private readonly eventMemoryRepository: EventMemoryRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(input: CreateGuestUploadInput): Promise<GuestUpload> {
    this.logger.log(`Creating guest upload for memory: ${input.eventMemoryId}`);

    // Validate memory exists and is active
    const memory = await this.eventMemoryRepository.findById(
      input.eventMemoryId,
    );
    if (!memory) {
      throw new NotFoundException('Event memory not found');
    }

    if (!memory.isActive) {
      throw new BadRequestException('Event memory is not active');
    }

    if (!memory.allowUploads) {
      throw new BadRequestException('Uploads are not allowed for this event');
    }

    if (memory.expiresAt && new Date(memory.expiresAt) < new Date()) {
      throw new BadRequestException('Event memory has expired');
    }

    // Determine initial status based on approval settings
    const initialStatus: UploadStatus = memory.requireApproval
      ? 'PENDING'
      : 'APPROVED';

    const upload = await this.guestUploadRepository.create({
      eventMemory: { connect: { id: input.eventMemoryId } },
      uploaderName: input.uploaderName,
      uploaderEmail: input.uploaderEmail,
      mediaUrl: input.mediaUrl,
      thumbnailUrl: input.thumbnailUrl,
      mediaType: input.mediaType,
      fileSize: input.fileSize,
      caption: input.caption,
      status: initialStatus,
      approvedAt: initialStatus === 'APPROVED' ? new Date() : null,
    });

    this.eventEmitter.emit('guest-upload.created', {
      uploadId: upload.id,
      eventMemoryId: input.eventMemoryId,
      status: initialStatus,
    });

    return upload;
  }

  async findById(id: string): Promise<GuestUpload> {
    const upload = await this.guestUploadRepository.findById(id);
    if (!upload) {
      throw new NotFoundException('Guest upload not found');
    }
    return upload;
  }

  async findByMemory(
    eventMemoryId: string,
    status?: UploadStatus,
  ): Promise<GuestUpload[]> {
    return this.guestUploadRepository.findByMemory(eventMemoryId, status);
  }

  async findApproved(eventMemoryId: string): Promise<GuestUpload[]> {
    return this.guestUploadRepository.findApproved(eventMemoryId);
  }

  async countPending(eventMemoryId: string): Promise<number> {
    return this.guestUploadRepository.countPending(eventMemoryId);
  }

  async approve(id: string): Promise<GuestUpload> {
    const upload = await this.findById(id);

    if (upload.status === 'APPROVED') {
      return upload;
    }

    const approved = await this.guestUploadRepository.approve(id);

    this.eventEmitter.emit('guest-upload.approved', {
      uploadId: id,
      eventMemoryId: upload.eventMemoryId,
    });

    return approved;
  }

  async reject(id: string): Promise<GuestUpload> {
    const upload = await this.findById(id);

    if (upload.status === 'REJECTED') {
      return upload;
    }

    const rejected = await this.guestUploadRepository.reject(id);

    this.eventEmitter.emit('guest-upload.rejected', {
      uploadId: id,
      eventMemoryId: upload.eventMemoryId,
    });

    return rejected;
  }

  async delete(id: string): Promise<void> {
    const upload = await this.findById(id);
    await this.guestUploadRepository.delete(id);

    this.eventEmitter.emit('guest-upload.deleted', {
      uploadId: id,
      eventMemoryId: upload.eventMemoryId,
    });
  }

  async bulkApprove(ids: string[]): Promise<GuestUpload[]> {
    const results: GuestUpload[] = [];
    for (const id of ids) {
      const approved = await this.approve(id);
      results.push(approved);
    }
    return results;
  }

  async bulkReject(ids: string[]): Promise<GuestUpload[]> {
    const results: GuestUpload[] = [];
    for (const id of ids) {
      const rejected = await this.reject(id);
      results.push(rejected);
    }
    return results;
  }

  async findByEventCode(qrCode: string): Promise<GuestUpload[]> {
    const memory = await this.prisma.eventMemory.findUnique({
      where: { qrCode },
    });

    if (!memory) {
      throw new NotFoundException('Event not found');
    }

    return this.findApproved(memory.id);
  }

  async getMemoryByCode(qrCode: string) {
    const memory = await this.prisma.eventMemory.findUnique({
      where: { qrCode },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            userId: true, // Include owner ID for subscription limit checks
          },
        },
      },
    });

    if (!memory) {
      throw new NotFoundException('Event not found');
    }

    return memory;
  }
}
