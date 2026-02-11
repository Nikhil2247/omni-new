// ============================================================================
// MEILISEARCH SERVICE - Full-Text Search Engine
// ============================================================================
// High-performance search service using Meilisearch for full-text search
// Supports indexing, filtering, faceting, and geo-search
// ============================================================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MeiliSearch, Index, SearchParams, Settings } from 'meilisearch'

export interface IndexConfig {
  primaryKey: string
  searchableAttributes?: string[]
  filterableAttributes?: string[]
  sortableAttributes?: string[]
  rankingRules?: string[]
  distinctAttribute?: string
  displayedAttributes?: string[]
  stopWords?: string[]
  synonyms?: Record<string, string[]>
  typoTolerance?: {
    enabled?: boolean
    minWordSizeForTypos?: {
      oneTypo?: number
      twoTypos?: number
    }
  }
}

export interface SearchOptions extends Omit<SearchParams, 'q'> {
  page?: number
  hitsPerPage?: number
}

export interface SearchResult<T> {
  hits: T[]
  query: string
  processingTimeMs: number
  totalHits: number
  page: number
  hitsPerPage: number
  totalPages: number
  facetDistribution?: Record<string, Record<string, number>>
}

export interface GeoSearchOptions {
  lat: number
  lng: number
  radiusInMeters?: number
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name)
  private client: MeiliSearch
  private readonly indexPrefix: string

  constructor(private readonly configService: ConfigService) {
    this.indexPrefix = this.configService.get<string>('MEILISEARCH_INDEX_PREFIX', 'omni_')
  }

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('MEILISEARCH_HOST', 'http://localhost:7700')
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY')

    this.client = new MeiliSearch({
      host,
      apiKey,
    })

    try {
      const health = await this.client.health()
      this.logger.log(`Connected to Meilisearch at ${host} (status: ${health.status})`)
    } catch (error) {
      this.logger.error('Failed to connect to Meilisearch', error)
      throw error
    }
  }

  // ============================================================================
  // INDEX MANAGEMENT
  // ============================================================================

  private getFullIndexName(indexName: string): string {
    return `${this.indexPrefix}${indexName}`
  }

  async createIndex(indexName: string, config: IndexConfig): Promise<Index> {
    const fullName = this.getFullIndexName(indexName)

    try {
      const task = await this.client.createIndex(fullName, {
        primaryKey: config.primaryKey,
      })

      await this.waitForTask(task.taskUid)

      const index = this.client.index(fullName)

      // Configure index settings
      await this.updateIndexSettings(indexName, config)

      this.logger.log(`Index created: ${fullName}`)

      return index
    } catch (error) {
      this.logger.error(`Failed to create index: ${fullName}`, error)
      throw error
    }
  }

  async updateIndexSettings(indexName: string, config: Partial<IndexConfig>): Promise<void> {
    const fullName = this.getFullIndexName(indexName)
    const index = this.client.index(fullName)

    const settings: Settings = {}

    if (config.searchableAttributes) {
      settings.searchableAttributes = config.searchableAttributes
    }
    if (config.filterableAttributes) {
      settings.filterableAttributes = config.filterableAttributes
    }
    if (config.sortableAttributes) {
      settings.sortableAttributes = config.sortableAttributes
    }
    if (config.rankingRules) {
      settings.rankingRules = config.rankingRules
    }
    if (config.distinctAttribute) {
      settings.distinctAttribute = config.distinctAttribute
    }
    if (config.displayedAttributes) {
      settings.displayedAttributes = config.displayedAttributes
    }
    if (config.stopWords) {
      settings.stopWords = config.stopWords
    }
    if (config.synonyms) {
      settings.synonyms = config.synonyms
    }
    if (config.typoTolerance) {
      settings.typoTolerance = config.typoTolerance
    }

    const task = await index.updateSettings(settings)
    await this.waitForTask(task.taskUid)

    this.logger.debug(`Index settings updated: ${fullName}`)
  }

  async deleteIndex(indexName: string): Promise<void> {
    const fullName = this.getFullIndexName(indexName)

    try {
      const task = await this.client.deleteIndex(fullName)
      await this.waitForTask(task.taskUid)
      this.logger.log(`Index deleted: ${fullName}`)
    } catch (error) {
      this.logger.error(`Failed to delete index: ${fullName}`, error)
      throw error
    }
  }

  async indexExists(indexName: string): Promise<boolean> {
    const fullName = this.getFullIndexName(indexName)

    try {
      await this.client.getIndex(fullName)
      return true
    } catch {
      return false
    }
  }

  async listIndexes(): Promise<string[]> {
    const indexes = await this.client.getIndexes()
    return indexes.results
      .map((i) => i.uid)
      .filter((uid) => uid.startsWith(this.indexPrefix))
      .map((uid) => uid.replace(this.indexPrefix, ''))
  }

  getIndex(indexName: string): Index {
    return this.client.index(this.getFullIndexName(indexName))
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      const health = await this.client.health()
      return health?.status === 'available' || health?.status === 'ok'
    } catch {
      return false
    }
  }

  // ============================================================================
  // DOCUMENT OPERATIONS
  // ============================================================================

  async addDocuments<T extends Record<string, unknown>>(
    indexName: string,
    documents: T[],
    options?: { primaryKey?: string },
  ): Promise<any> {
    const index = this.getIndex(indexName)

    try {
      const task = await index.addDocuments(documents, options)
      this.logger.debug(`Added ${documents.length} documents to ${indexName}`)
      return task
    } catch (error) {
      this.logger.error(`Failed to add documents to ${indexName}`, error)
      throw error
    }
  }

  async addDocumentsAndWait<T extends Record<string, unknown>>(
    indexName: string,
    documents: T[],
    options?: { primaryKey?: string },
  ): Promise<void> {
    const task = await this.addDocuments(indexName, documents, options)
    await this.waitForTask(task.taskUid)
  }

  async updateDocuments<T extends Record<string, unknown>>(
    indexName: string,
    documents: T[],
    options?: { primaryKey?: string },
  ): Promise<any> {
    const index = this.getIndex(indexName)

    try {
      const task = await index.updateDocuments(documents, options)
      this.logger.debug(`Updated ${documents.length} documents in ${indexName}`)
      return task
    } catch (error) {
      this.logger.error(`Failed to update documents in ${indexName}`, error)
      throw error
    }
  }

  async updateDocumentsAndWait<T extends Record<string, unknown>>(
    indexName: string,
    documents: T[],
    options?: { primaryKey?: string },
  ): Promise<void> {
    const task = await this.updateDocuments(indexName, documents, options)
    await this.waitForTask(task.taskUid)
  }

  async deleteDocument(indexName: string, documentId: string | number): Promise<any> {
    const index = this.getIndex(indexName)

    try {
      const task = await index.deleteDocument(documentId)
      this.logger.debug(`Deleted document ${documentId} from ${indexName}`)
      return task
    } catch (error) {
      this.logger.error(`Failed to delete document ${documentId} from ${indexName}`, error)
      throw error
    }
  }

  async deleteDocuments(indexName: string, documentIds: (string | number)[]): Promise<any> {
    const index = this.getIndex(indexName)

    try {
      const task = await index.deleteDocuments(documentIds.map((id) => String(id)))
      this.logger.debug(`Deleted ${documentIds.length} documents from ${indexName}`)
      return task
    } catch (error) {
      this.logger.error(`Failed to delete documents from ${indexName}`, error)
      throw error
    }
  }

  async deleteAllDocuments(indexName: string): Promise<any> {
    const index = this.getIndex(indexName)

    try {
      const task = await index.deleteAllDocuments()
      this.logger.log(`Deleted all documents from ${indexName}`)
      return task
    } catch (error) {
      this.logger.error(`Failed to delete all documents from ${indexName}`, error)
      throw error
    }
  }

  async getDocument<T>(indexName: string, documentId: string | number): Promise<T | null> {
    const index = this.getIndex(indexName)

    try {
      return await index.getDocument(documentId) as T
    } catch {
      return null
    }
  }

  async getDocuments<T>(
    indexName: string,
    options?: { limit?: number; offset?: number; fields?: string[] },
  ): Promise<T[]> {
    const index = this.getIndex(indexName)

    const result = await index.getDocuments({
      limit: options?.limit,
      offset: options?.offset,
      fields: options?.fields as any,
    })

    return result.results as T[]
  }

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================

  async search<T>(
    indexName: string,
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult<T>> {
    const index = this.getIndex(indexName)

    const page = options?.page ?? 1
    const hitsPerPage = options?.hitsPerPage ?? 20

    const searchParams: SearchParams = {
      ...options,
      page,
      hitsPerPage,
    }

    try {
      const response = await index.search(query, searchParams) as any

      return {
        hits: response.hits as T[],
        query: response.query,
        processingTimeMs: response.processingTimeMs,
        totalHits: response.estimatedTotalHits || response.hits.length,
        page,
        hitsPerPage,
        totalPages: Math.ceil((response.estimatedTotalHits || response.hits.length) / hitsPerPage),
        facetDistribution: response.facetDistribution,
      }
    } catch (error) {
      this.logger.error(`Search failed in ${indexName}`, error)
      throw error
    }
  }

  async searchWithFilters<T>(
    indexName: string,
    query: string,
    filters: string | string[],
    options?: SearchOptions,
  ): Promise<SearchResult<T>> {
    const filterString = Array.isArray(filters) ? filters.join(' AND ') : filters

    return this.search<T>(indexName, query, {
      ...options,
      filter: filterString,
    })
  }

  async searchWithFacets<T>(
    indexName: string,
    query: string,
    facets: string[],
    options?: SearchOptions,
  ): Promise<SearchResult<T>> {
    return this.search<T>(indexName, query, {
      ...options,
      facets,
    })
  }

  async searchGeo<T>(
    indexName: string,
    query: string,
    geo: GeoSearchOptions,
    options?: SearchOptions,
  ): Promise<SearchResult<T>> {
    const geoFilter = geo.radiusInMeters
      ? `_geoRadius(${geo.lat}, ${geo.lng}, ${geo.radiusInMeters})`
      : undefined

    const existingFilter = options?.filter

    let combinedFilter: string | undefined

    if (geoFilter && existingFilter) {
      combinedFilter = `${existingFilter} AND ${geoFilter}`
    } else {
      combinedFilter = geoFilter || (existingFilter as string)
    }

    return this.search<T>(indexName, query, {
      ...options,
      filter: combinedFilter,
      sort: [`_geoPoint(${geo.lat}, ${geo.lng}):asc`, ...(options?.sort || [])],
    })
  }

  async multiSearch<T>(
    queries: Array<{
      indexName: string
      query: string
      options?: SearchOptions
    }>,
  ): Promise<SearchResult<T>[]> {
    const results: SearchResult<T>[] = []

    // Meilisearch supports multi-search
    for (const { indexName, query, options } of queries) {
      const result = await this.search<T>(indexName, query, options)
      results.push(result)
    }

    return results
  }

  // ============================================================================
  // SUGGESTIONS & AUTOCOMPLETE
  // ============================================================================

  async getSuggestions(
    indexName: string,
    query: string,
    limit: number = 5,
  ): Promise<string[]> {
    const result = await this.search<{ id: string; title?: string; name?: string }>(
      indexName,
      query,
      {
        hitsPerPage: limit,
        attributesToRetrieve: ['title', 'name'],
      },
    )

    return result.hits
      .map((hit) => hit.title || hit.name || '')
      .filter((s) => s.length > 0)
  }

  // ============================================================================
  // TASK MANAGEMENT
  // ============================================================================

  private async fetchTask(taskUid: number): Promise<any> {
    const client = this.client as any

    if (typeof client.getTask === 'function') {
      return client.getTask(taskUid)
    }

    if (client.tasks && typeof client.tasks.getTask === 'function') {
      return client.tasks.getTask(taskUid)
    }

    throw new Error('Meilisearch client does not support getTask')
  }

  private async fetchTasks(options?: {
    indexUid?: string
    status?: 'enqueued' | 'processing' | 'succeeded' | 'failed'
    limit?: number
  }): Promise<any> {
    const client = this.client as any
    const payload = {
      indexUids: options?.indexUid ? [this.getFullIndexName(options.indexUid)] : undefined,
      statuses: options?.status ? [options.status] : undefined,
      limit: options?.limit,
    }

    if (typeof client.getTasks === 'function') {
      return client.getTasks(payload)
    }

    if (client.tasks && typeof client.tasks.getTasks === 'function') {
      return client.tasks.getTasks(payload)
    }

    throw new Error('Meilisearch client does not support getTasks')
  }

  async waitForTask(taskUid: number, timeoutMs: number = 30000): Promise<any> {
    const client = this.client as any
    if (typeof client.waitForTask === 'function') {
      return client.waitForTask(taskUid, { timeOutMs: timeoutMs })
    }

    const startTime = Date.now()
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const task = await this.fetchTask(taskUid)
        
        if (task.status === 'succeeded') {
          return task
        }
        
        if (task.status === 'failed') {
          throw new Error(`Task ${taskUid} failed: ${task.error?.message || 'Unknown error'}`)
        }
        
        // Wait 100ms before checking again
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        if (Date.now() - startTime >= timeoutMs) {
          throw new Error(`Task ${taskUid} timeout after ${timeoutMs}ms`)
        }
        throw error
      }
    }
    
    throw new Error(`Task ${taskUid} timeout after ${timeoutMs}ms`)
  }

  async getTask(taskUid: number): Promise<any> {
    return this.fetchTask(taskUid)
  }

  async getTasks(options?: {
    indexUid?: string
    status?: 'enqueued' | 'processing' | 'succeeded' | 'failed'
    limit?: number
  }): Promise<any[]> {
    const result = await this.fetchTasks(options)
    return result.results || result
  }

  // ============================================================================
  // STATS & HEALTH
  // ============================================================================

  async getIndexStats(indexName: string): Promise<{
    numberOfDocuments: number
    isIndexing: boolean
    fieldDistribution: Record<string, number>
  }> {
    const index = this.getIndex(indexName)
    return index.getStats()
  }

  async getStats(): Promise<Record<string, unknown>> {
    return this.client.getStats()
  }

  async health(): Promise<{ status: string }> {
    return this.client.health()
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  getClient(): MeiliSearch {
    return this.client
  }

  getIndexPrefix(): string {
    return this.indexPrefix
  }
}
