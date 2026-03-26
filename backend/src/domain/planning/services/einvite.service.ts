// ============================================================================
// E-INVITE SERVICE
// ============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EInvite,
  EInviteTemplate,
  EInviteSent,
  EInviteCategory,
  EInviteChannel,
} from '@prisma/client';
import { EInviteRepository } from '../repositories/einvite.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  CreateEInviteDto,
  UpdateEInviteDto,
  CreateEInviteTemplateDto,
  UpdateEInviteTemplateDto,
  SendEInviteDto,
  BulkSendEInviteDto,
} from '../dto/einvite.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class EInviteService {
  private readonly logger = new Logger(EInviteService.name);

  constructor(
    private readonly einviteRepository: EInviteRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // TEMPLATE METHODS
  // ============================================================================

  async createTemplate(dto: CreateEInviteTemplateDto): Promise<EInviteTemplate> {
    this.logger.log(`Creating e-invite template: ${dto.name}`);

    return this.einviteRepository.createTemplate({
      name: dto.name,
      category: dto.category,
      thumbnailUrl: dto.thumbnailUrl,
      canvasJson: dto.canvasJson,
      defaultColors: dto.defaultColors,
      isPremium: dto.isPremium ?? false,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async updateTemplate(
    id: string,
    dto: UpdateEInviteTemplateDto,
  ): Promise<EInviteTemplate> {
    const template = await this.einviteRepository.findTemplateById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.einviteRepository.updateTemplate(id, dto);
  }

  async getTemplateById(id: string): Promise<EInviteTemplate> {
    const template = await this.einviteRepository.findTemplateById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async getAllTemplates(category?: EInviteCategory): Promise<EInviteTemplate[]> {
    return this.einviteRepository.findAllTemplates(category);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.einviteRepository.findTemplateById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    await this.einviteRepository.deleteTemplate(id);
  }

  // ============================================================================
  // E-INVITE METHODS
  // ============================================================================

  async create(userId: string, dto: CreateEInviteDto): Promise<EInvite> {
    this.logger.log(`Creating e-invite for event: ${dto.eventId}`);

    // Verify event belongs to user
    const event = await this.prisma.event.findFirst({
      where: { id: dto.eventId, userId },
      include: {
        address: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if e-invite already exists for this event
    const existing = await this.einviteRepository.findByEventId(dto.eventId);
    if (existing) {
      throw new BadRequestException('E-invite already exists for this event. Use update instead.');
    }

    // Generate unique share code
    const shareCode = this.generateShareCode();

    // Get template if provided
    let templateCanvas = dto.canvasJson;
    if (dto.templateId) {
      const template = await this.einviteRepository.findTemplateById(dto.templateId);
      if (template) {
        // Merge template canvas with user customizations
        templateCanvas = dto.canvasJson || template.canvasJson;
      }
    }

    const einvite = await this.einviteRepository.create({
      event: { connect: { id: dto.eventId } },
      template: dto.templateId ? { connect: { id: dto.templateId } } : undefined,
      title: dto.title,
      canvasJson: templateCanvas,
      eventName: dto.eventName || event.name,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : event.date,
      eventTime: dto.eventTime,
      eventVenue: dto.eventVenue || event.venueName,
      eventAddress: dto.eventAddress || (event.address ? `${event.address.addressLine1}${event.address.addressLine2 ? ', ' + event.address.addressLine2 : ''}` : undefined),
      hostNames: dto.hostNames,
      customMessage: dto.customMessage,
      shareCode,
    });

    this.eventEmitter.emit('einvite.created', {
      einviteId: einvite.id,
      eventId: dto.eventId,
      userId,
    });

    return einvite;
  }

  async update(userId: string, einviteId: string, dto: UpdateEInviteDto): Promise<EInvite> {
    const einvite = await this.einviteRepository.findById(einviteId);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: einvite.eventId, userId },
    });
    if (!event) {
      throw new ForbiddenException('You do not have permission to update this e-invite');
    }

    return this.einviteRepository.update(einviteId, {
      title: dto.title,
      canvasJson: dto.canvasJson,
      previewUrl: dto.previewUrl,
      eventName: dto.eventName,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      eventTime: dto.eventTime,
      eventVenue: dto.eventVenue,
      eventAddress: dto.eventAddress,
      hostNames: dto.hostNames,
      customMessage: dto.customMessage,
      isPublished: dto.isPublished,
    });
  }

  async getById(userId: string, einviteId: string): Promise<EInvite & { sentCount?: number; viewedCount?: number }> {
    const einvite = await this.einviteRepository.findById(einviteId);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: einvite.eventId, userId },
    });
    if (!event) {
      throw new ForbiddenException('You do not have permission to view this e-invite');
    }

    // Get sent/viewed counts
    const counts = await this.einviteRepository.countSentByEInvite(einviteId);

    return {
      ...einvite,
      sentCount: counts.sent,
      viewedCount: counts.viewed,
    };
  }

  async getByEventId(userId: string, eventId: string): Promise<EInvite | null> {
    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, userId },
    });
    if (!event) {
      throw new ForbiddenException('You do not have permission to view this event');
    }

    return this.einviteRepository.findByEventId(eventId);
  }

  async getByShareCode(shareCode: string): Promise<EInvite> {
    const einvite = await this.einviteRepository.findByShareCode(shareCode);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    if (!einvite.isPublished) {
      throw new NotFoundException('E-invite is not published');
    }

    return einvite;
  }

  async delete(userId: string, einviteId: string): Promise<void> {
    const einvite = await this.einviteRepository.findById(einviteId);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: einvite.eventId, userId },
    });
    if (!event) {
      throw new ForbiddenException('You do not have permission to delete this e-invite');
    }

    await this.einviteRepository.delete(einviteId);
  }

  async publish(userId: string, einviteId: string): Promise<EInvite> {
    return this.update(userId, einviteId, { isPublished: true });
  }

  async unpublish(userId: string, einviteId: string): Promise<EInvite> {
    return this.update(userId, einviteId, { isPublished: false });
  }

  // ============================================================================
  // SEND METHODS
  // ============================================================================

  async sendToGuests(
    userId: string,
    einviteId: string,
    dto: SendEInviteDto,
  ): Promise<EInviteSent[]> {
    const einvite = await this.einviteRepository.findById(einviteId);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: einvite.eventId, userId },
      include: { guestlist: true },
    });
    if (!event) {
      throw new ForbiddenException('You do not have permission to send this e-invite');
    }

    // Validate guests belong to this event's guestlist
    const guests = await this.prisma.guest.findMany({
      where: {
        id: { in: dto.guestIds },
        guestlistId: event.guestlist?.id,
      },
    });

    if (guests.length === 0) {
      throw new BadRequestException('No valid guests found');
    }

    const results: EInviteSent[] = [];

    for (const guest of guests) {
      try {
        // Create/update sent record
        const sentRecord = await this.einviteRepository.upsertSentRecord(
          einviteId,
          guest.id,
          dto.channel,
          {
            status: 'PENDING',
          },
        );

        // Emit event for actual sending (handled by WhatsApp/Email service)
        this.eventEmitter.emit('einvite.send', {
          einviteId,
          einviteSentId: sentRecord.id,
          guestId: guest.id,
          channel: dto.channel,
          guest: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            phone: guest.phone,
            email: guest.email,
          },
          shareCode: einvite.shareCode,
          eventName: einvite.eventName,
          customMessage: dto.customMessage,
        });

        results.push(sentRecord);
      } catch (error) {
        this.logger.error(`Failed to send e-invite to guest ${guest.id}:`, error);
      }
    }

    return results;
  }

  async sendToAllGuests(
    userId: string,
    einviteId: string,
    dto: BulkSendEInviteDto,
  ): Promise<{ sent: number; skipped: number }> {
    const einvite = await this.einviteRepository.findById(einviteId);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    // Verify ownership and get guestlist
    const event = await this.prisma.event.findFirst({
      where: { id: einvite.eventId, userId },
      include: { guestlist: true },
    });
    if (!event || !event.guestlist) {
      throw new ForbiddenException('Event or guestlist not found');
    }

    let guestIds: string[];

    if (dto.excludeAlreadySent) {
      guestIds = await this.einviteRepository.getGuestsNotSent(
        einviteId,
        event.guestlist.id,
      );
    } else {
      const guests = await this.prisma.guest.findMany({
        where: { guestlistId: event.guestlist.id },
        select: { id: true },
      });
      guestIds = guests.map((g) => g.id);
    }

    if (guestIds.length === 0) {
      return { sent: 0, skipped: 0 };
    }

    const results = await this.sendToGuests(userId, einviteId, {
      guestIds,
      channel: dto.channel,
      customMessage: dto.customMessage,
    });

    return {
      sent: results.length,
      skipped: guestIds.length - results.length,
    };
  }

  async getSentHistory(userId: string, einviteId: string): Promise<EInviteSent[]> {
    const einvite = await this.einviteRepository.findById(einviteId);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: einvite.eventId, userId },
    });
    if (!event) {
      throw new ForbiddenException('You do not have permission to view this e-invite');
    }

    return this.einviteRepository.findSentByEInvite(einviteId);
  }

  async trackView(shareCode: string, guestId?: string): Promise<void> {
    await this.einviteRepository.markAsViewed(shareCode, guestId);

    this.eventEmitter.emit('einvite.viewed', {
      shareCode,
      guestId,
      viewedAt: new Date(),
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateShareCode(): string {
    // Generate a short, URL-safe code
    return `inv-${randomBytes(6).toString('hex')}`;
  }

  async regenerateShareCode(userId: string, einviteId: string): Promise<EInvite> {
    const einvite = await this.einviteRepository.findById(einviteId);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: einvite.eventId, userId },
    });
    if (!event) {
      throw new ForbiddenException('You do not have permission to update this e-invite');
    }

    const newShareCode = this.generateShareCode();

    return this.einviteRepository.update(einviteId, {
      shareCode: newShareCode,
    });
  }

  async getShareUrl(einviteId: string, baseUrl: string): Promise<string> {
    const einvite = await this.einviteRepository.findById(einviteId);
    if (!einvite) {
      throw new NotFoundException('E-invite not found');
    }

    return `${baseUrl}/invite/${einvite.shareCode}`;
  }
}
