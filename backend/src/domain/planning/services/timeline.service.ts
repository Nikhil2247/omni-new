// ============================================================================
// TIMELINE SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Timeline } from '@prisma/client';
import { TimelineRepository } from '../repositories/timeline.repository';
import { CreateTimelineDto } from '../dto/create-timeline.dto';
import { randomUUID } from 'crypto';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  duration?: number;
  isCompleted: boolean;
  completedAt?: Date;
}

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(
    private readonly timelineRepository: TimelineRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateTimelineDto): Promise<Timeline> {
    this.logger.log(`Creating timeline for event: ${dto.eventId}`);

    const timeline = await this.timelineRepository.create({
      event: { connect: { id: dto.eventId } },
      name: dto.name,
      date: new Date(dto.eventDate),
      items: dto.items
        ? dto.items.map((item) => ({
            id: randomUUID(),
            title: item.title,
            description: item.description,
            scheduledTime: item.scheduledTime,
            duration: item.duration,
            isCompleted: false,
          }))
        : [],
    });

    this.eventEmitter.emit('timeline.created', {
      timelineId: timeline.id,
      eventId: dto.eventId,
    });
    return timeline;
  }

  async findById(id: string): Promise<Timeline> {
    const timeline = await this.timelineRepository.findById(id);
    if (!timeline) {
      throw new NotFoundException('Timeline not found');
    }
    return timeline;
  }

  async findByEventId(eventId: string): Promise<Timeline | null> {
    return this.timelineRepository.findByEventId(eventId);
  }

  async update(
    id: string,
    dto: { name?: string; eventDate?: string },
  ): Promise<Timeline> {
    await this.findById(id);
    const updateData: Record<string, string | Date> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.eventDate) updateData.date = new Date(dto.eventDate);

    const timeline = await this.timelineRepository.update(id, updateData);
    this.eventEmitter.emit('timeline.updated', { timelineId: id });
    return timeline;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.timelineRepository.delete(id);
    this.eventEmitter.emit('timeline.deleted', { timelineId: id });
  }

  async addItem(
    timelineId: string,
    item: {
      title: string;
      description?: string;
      scheduledTime: string;
      duration?: number;
    },
  ) {
    const timeline = await this.findById(timelineId);
    const items = Array.isArray(timeline.items) ? [...timeline.items] : [];
    const newItem = {
      id: randomUUID(),
      title: item.title,
      description: item.description,
      scheduledTime: item.scheduledTime,
      duration: item.duration,
      isCompleted: false,
    };

    items.push(newItem);

    await this.timelineRepository.update(timelineId, {
      items: items as unknown as Prisma.InputJsonValue,
    });

    return newItem;
  }

  async updateItem(
    timelineId: string,
    itemId: string,
    updates: {
      title?: string;
      description?: string;
      scheduledTime?: string;
      duration?: number;
      isCompleted?: boolean;
    },
  ) {
    const timeline = await this.findById(timelineId);
    const items = Array.isArray(timeline.items)
      ? ([...timeline.items] as unknown as TimelineItem[])
      : [];
    const itemIndex = items.findIndex(
      (item: TimelineItem) => item.id === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Timeline item not found');
    }

    const currentItem = items[itemIndex];
    items[itemIndex] = {
      ...currentItem,
      ...updates,
      completedAt:
        updates.isCompleted && !currentItem.isCompleted
          ? new Date()
          : currentItem.completedAt,
    };

    await this.timelineRepository.update(timelineId, { items: items as unknown as Prisma.InputJsonValue });
    return items[itemIndex];
  }

  async removeItem(timelineId: string, itemId: string) {
    const timeline = await this.findById(timelineId);
    const items = Array.isArray(timeline.items)
      ? ([...timeline.items] as unknown as TimelineItem[])
      : [];
    const filteredItems = items.filter((item: TimelineItem) => item.id !== itemId);

    if (filteredItems.length === items.length) {
      throw new NotFoundException('Timeline item not found');
    }

    await this.timelineRepository.update(timelineId, { items: filteredItems as unknown as Prisma.InputJsonValue });
    return { success: true };
  }

  async getUpcomingItems(timelineId: string) {
    const timeline = await this.findById(timelineId);
    const now = new Date();
    const items = Array.isArray(timeline.items)
      ? (timeline.items as unknown as TimelineItem[])
      : [];

    return items.filter((item: TimelineItem) => {
      if (!item?.scheduledTime) return false;
      return new Date(item.scheduledTime) >= now;
    });
  }
}
