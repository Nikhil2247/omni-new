// ============================================================================
// EVENT INDEXER - Search Index for Events
// ============================================================================
// Manages indexing of events for full-text search with Meilisearch
// Supports geo-search, filtering by category, date, price, etc.
// ============================================================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { MeilisearchService, IndexConfig } from '../meilisearch.service'
import { PrismaService } from '../../../core/database/prisma.service'

export const EVENT_INDEX_NAME = 'events'

export interface EventSearchDocument extends Record<string, unknown> {
  id: string
  name: string
  description: string
  status: string
  date?: number
  endDate?: number
  venueName?: string
  city?: string
  eventTypeId: string
  eventTypeName: string
  guestCount?: number
  createdAt: number
  updatedAt: number
}

@Injectable()
export class EventIndexer implements OnModuleInit {
  private readonly logger = new Logger(EventIndexer.name)

  constructor(
    private readonly search: MeilisearchService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureIndexExists()
  }

  private async ensureIndexExists(): Promise<void> {
    const exists = await this.search.indexExists(EVENT_INDEX_NAME)

    if (!exists) {
      const config: IndexConfig = {
        primaryKey: 'id',
        searchableAttributes: [
          'name',
          'description',
          'eventTypeName',
          'venueName',
          'city',
        ],
        filterableAttributes: [
          'status',
          'eventTypeId',
          'date',
          'city',
        ],
        sortableAttributes: [
          'date',
          'createdAt',
        ],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
          'date:asc',
        ],
        distinctAttribute: 'id',
      }

      await this.search.createIndex(EVENT_INDEX_NAME, config)
      this.logger.log('Events search index created')
    }
  }

  // ============================================================================
  // INDEXING OPERATIONS
  // ============================================================================

  async indexEvent(eventId: string): Promise<void> {
    const event = await this.fetchEventData(eventId)

    if (!event) {
      this.logger.warn(`Event not found for indexing: ${eventId}`)
      return
    }

    const document = this.transformToSearchDocument(event)
    await this.search.addDocumentsAndWait(EVENT_INDEX_NAME, [document])

    this.logger.debug(`Event indexed: ${eventId}`)
  }

  async indexEvents(eventIds: string[]): Promise<void> {
    const events = await this.fetchEventsData(eventIds)
    const documents = events.map((e) => this.transformToSearchDocument(e))

    if (documents.length > 0) {
      await this.search.addDocumentsAndWait(EVENT_INDEX_NAME, documents)
      this.logger.debug(`Indexed ${documents.length} events`)
    }
  }

  async updateEventIndex(eventId: string): Promise<void> {
    await this.indexEvent(eventId)
  }

  async removeFromIndex(eventId: string): Promise<void> {
    await this.search.deleteDocument(EVENT_INDEX_NAME, eventId)
    this.logger.debug(`Event removed from index: ${eventId}`)
  }

  async removeMultipleFromIndex(eventIds: string[]): Promise<void> {
    await this.search.deleteDocuments(EVENT_INDEX_NAME, eventIds)
    this.logger.debug(`Removed ${eventIds.length} events from index`)
  }

  // ============================================================================
  // FULL REINDEX
  // ============================================================================

  async reindexAll(batchSize: number = 100): Promise<void> {
    this.logger.log('Starting full event reindex...')

    // Clear existing index
    await this.search.deleteAllDocuments(EVENT_INDEX_NAME)

    // Get total count
    const totalCount = await this.prisma.event.count()

    let processed = 0

    while (processed < totalCount) {
      const events = await this.prisma.event.findMany({
        skip: processed,
        take: batchSize,
        include: {
          eventType: true,
          address: { include: { city: true } },
        },
      })

      const documents = events.map((e) => this.transformToSearchDocument(e))

      if (documents.length > 0) {
        await this.search.addDocumentsAndWait(EVENT_INDEX_NAME, documents)
      }

      processed += events.length
      this.logger.log(`Reindex progress: ${processed}/${totalCount}`)
    }

    this.logger.log(`Full event reindex completed: ${totalCount} events`)
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  @OnEvent('event.created')
  async handleEventCreated(payload: { eventId: string }): Promise<void> {
    await this.indexEvent(payload.eventId)
  }

  @OnEvent('event.updated')
  async handleEventUpdated(payload: { eventId: string }): Promise<void> {
    await this.updateEventIndex(payload.eventId)
  }

  @OnEvent('event.deleted')
  async handleEventDeleted(payload: { eventId: string }): Promise<void> {
    await this.removeFromIndex(payload.eventId)
  }

  @OnEvent('event.published')
  async handleEventPublished(payload: { eventId: string }): Promise<void> {
    await this.indexEvent(payload.eventId)
  }

  @OnEvent('event.unpublished')
  async handleEventUnpublished(payload: { eventId: string }): Promise<void> {
    await this.removeFromIndex(payload.eventId)
  }

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  private async fetchEventData(eventId: string): Promise<unknown> {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventType: true,
        address: { include: { city: true } },
      },
    })
  }

  private async fetchEventsData(eventIds: string[]): Promise<unknown[]> {
    return this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      include: {
        eventType: true,
        address: { include: { city: true } },
      },
    })
  }

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  private transformToSearchDocument(event: any): EventSearchDocument {
    const document: EventSearchDocument = {
      id: event.id,
      name: event.name,
      description: event.description || '',
      status: event.status,
      date: event.date ? new Date(event.date).getTime() : undefined,
      endDate: event.endDate ? new Date(event.endDate).getTime() : undefined,
      venueName: event.venueName,
      city: event.address?.city?.name,
      eventTypeId: event.eventTypeId,
      eventTypeName: event.eventType?.name || '',
      guestCount: event.guestCount ?? undefined,
      createdAt: new Date(event.createdAt).getTime(),
      updatedAt: new Date(event.updatedAt).getTime(),
    }

    return document
  }

  // ============================================================================
  // SEARCH HELPERS
  // ============================================================================

  async searchEvents(
    query: string,
    options?: {
      page?: number
      hitsPerPage?: number
      categoryId?: string
      startDateFrom?: Date
      startDateTo?: Date
      priceMin?: number
      priceMax?: number
      isOnline?: boolean
      city?: string
      country?: string
      sortBy?: 'startDate' | 'price' | 'rating' | 'popularity'
      sortOrder?: 'asc' | 'desc'
    },
  ) {
    const filters: string[] = ['status = "PUBLISHED"', 'visibility = "PUBLIC"']

    if (options?.categoryId) {
      filters.push(`categoryId = "${options.categoryId}"`)
    }

    if (options?.startDateFrom) {
      filters.push(`startDate >= ${options.startDateFrom.getTime()}`)
    }

    if (options?.startDateTo) {
      filters.push(`startDate <= ${options.startDateTo.getTime()}`)
    }

    if (options?.priceMin !== undefined) {
      filters.push(`minPrice >= ${options.priceMin}`)
    }

    if (options?.priceMax !== undefined) {
      filters.push(`maxPrice <= ${options.priceMax}`)
    }

    if (options?.isOnline !== undefined) {
      filters.push(`isOnline = ${options.isOnline}`)
    }

    if (options?.city) {
      filters.push(`venueCity = "${options.city}"`)
    }

    if (options?.country) {
      filters.push(`venueCountry = "${options.country}"`)
    }

    const sortField = {
      startDate: 'startDate',
      price: 'minPrice',
      rating: 'averageRating',
      popularity: 'ticketsSold',
    }[options?.sortBy || 'startDate']

    const sortOrder = options?.sortOrder || 'asc'

    return this.search.searchWithFilters<EventSearchDocument>(
      EVENT_INDEX_NAME,
      query,
      filters,
      {
        page: options?.page,
        hitsPerPage: options?.hitsPerPage,
        sort: [`${sortField}:${sortOrder}`],
      },
    )
  }

  async searchNearbyEvents(
    query: string,
    lat: number,
    lng: number,
    radiusInMeters: number = 50000, // 50km default
    options?: {
      page?: number
      hitsPerPage?: number
    },
  ) {
    return this.search.searchGeo<EventSearchDocument>(
      EVENT_INDEX_NAME,
      query,
      { lat, lng, radiusInMeters },
      {
        page: options?.page,
        hitsPerPage: options?.hitsPerPage,
        filter: 'status = "PUBLISHED" AND visibility = "PUBLIC"',
      },
    )
  }
}
