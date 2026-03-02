// ============================================================================
// EVENT TYPE LOOKUP SERVICE - Cached Event Type Data
// ============================================================================
// Provides fast lookup for event types (wedding, birthday, etc.)
// ============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface EventTypeLookup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  displayOrder: number;
}

@Injectable()
export class EventTypeLookupService implements OnModuleInit {
  private readonly logger = new Logger(EventTypeLookupService.name);

  private eventTypes: Map<string, EventTypeLookup> = new Map();
  private eventTypesBySlug: Map<string, EventTypeLookup> = new Map();
  private sortedEventTypes: EventTypeLookup[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadAllData();
  }

  private async loadAllData(): Promise<void> {
    this.logger.log('Loading event type lookup data...');

    try {
      const eventTypeRecords = await this.prisma.eventType.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      this.eventTypes.clear();
      this.eventTypesBySlug.clear();
      this.sortedEventTypes = [];

      for (const eventType of eventTypeRecords) {
        const lookup: EventTypeLookup = {
          id: eventType.id,
          name: eventType.name,
          slug: eventType.slug,
          description: eventType.description || undefined,
          iconUrl: eventType.icon || undefined,
          displayOrder: eventType.sortOrder,
        };

        this.eventTypes.set(eventType.id, lookup);
        this.eventTypesBySlug.set(eventType.slug, lookup);
        this.sortedEventTypes.push(lookup);
      }

      this.logger.log(`Loaded ${this.eventTypes.size} event types`);
    } catch (error) {
      this.logger.error('Failed to load event type lookup data', error);
    }
  }

  async refresh(): Promise<void> {
    await this.loadAllData();
  }

  // Lookups
  getAllEventTypes(): EventTypeLookup[] {
    return this.sortedEventTypes;
  }

  getEventTypeById(id: string): EventTypeLookup | undefined {
    return this.eventTypes.get(id);
  }

  getEventTypeBySlug(slug: string): EventTypeLookup | undefined {
    return this.eventTypesBySlug.get(slug);
  }

  // Get multiple event types by IDs
  getEventTypesByIds(ids: string[]): EventTypeLookup[] {
    return ids
      .map((id) => this.eventTypes.get(id))
      .filter((e): e is EventTypeLookup => e !== undefined);
  }

  // Validation
  isValidEventType(id: string): boolean {
    return this.eventTypes.has(id);
  }

  isValidEventTypeSlug(slug: string): boolean {
    return this.eventTypesBySlug.has(slug);
  }

  // Popular event types (for homepage)
  getPopularEventTypes(limit: number = 6): EventTypeLookup[] {
    return this.sortedEventTypes.slice(0, limit);
  }
}
