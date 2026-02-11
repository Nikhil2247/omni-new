// ============================================================================
// CDN SERVICE - Content Delivery Network Integration
// ============================================================================
// Manages CDN URLs, caching headers, and asset optimization
// Supports multiple CDN providers and fallback to origin
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MinioService } from './minio.service'
import { DragonflyService } from '../cache/dragonfly.service'
import * as crypto from 'crypto'

export interface CdnConfig {
  enabled: boolean
  baseUrl: string
  provider: 'cloudflare' | 'cloudfront' | 'bunny' | 'custom' | 'none'
  signedUrls: boolean
  signedUrlSecret?: string
  cacheTtl: number // Default cache TTL in seconds
}

export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  blur?: number
  grayscale?: boolean
}

export interface CdnCacheOptions {
  ttl?: number // Cache TTL in seconds
  private?: boolean // Whether to use private caching
  staleWhileRevalidate?: number
  staleIfError?: number
}

@Injectable()
export class CdnService {
  private readonly logger = new Logger(CdnService.name)
  private readonly config: CdnConfig

  constructor(
    private readonly configService: ConfigService,
    private readonly minioService: MinioService,
    private readonly cache: DragonflyService,
  ) {
    this.config = {
      enabled: this.configService.get<boolean>('CDN_ENABLED', false),
      baseUrl: this.configService.get<string>('CDN_BASE_URL', ''),
      provider: this.configService.get('CDN_PROVIDER', 'none') as CdnConfig['provider'],
      signedUrls: this.configService.get<boolean>('CDN_SIGNED_URLS', false),
      signedUrlSecret: this.configService.get<string>('CDN_SIGNED_URL_SECRET'),
      cacheTtl: this.configService.get<number>('CDN_CACHE_TTL', 86400), // 24 hours
    }

    if (this.config.enabled) {
      this.logger.log(`CDN enabled: ${this.config.provider} at ${this.config.baseUrl}`)
    }
  }

  // ============================================================================
  // URL GENERATION
  // ============================================================================

  async getUrl(filePath: string, options?: CdnCacheOptions): Promise<string> {
    if (!this.config.enabled) {
      return this.getOriginUrl(filePath)
    }

    const baseUrl = this.config.baseUrl.replace(/\/$/, '')
    let url = `${baseUrl}/${filePath}`

    if (this.config.signedUrls && this.config.signedUrlSecret) {
      url = this.signUrl(url, options?.ttl || this.config.cacheTtl)
    }

    return url
  }

  async getImageUrl(filePath: string, transform?: ImageTransformOptions): Promise<string> {
    if (!this.config.enabled) {
      return this.getOriginUrl(filePath)
    }

    let url = await this.getUrl(filePath)

    if (transform && Object.keys(transform).length > 0) {
      url = this.buildImageTransformUrl(url, transform)
    }

    return url
  }

  async getOriginUrl(filePath: string): Promise<string> {
    return this.minioService.getFileUrl(filePath)
  }

  async getSignedOriginUrl(filePath: string, expiresIn?: number): Promise<string> {
    return this.minioService.getPresignedGetUrl(filePath, {
      expiresIn: expiresIn || 3600,
    })
  }

  // ============================================================================
  // IMAGE TRANSFORMATIONS (CDN-specific)
  // ============================================================================

  private buildImageTransformUrl(url: string, options: ImageTransformOptions): string {
    switch (this.config.provider) {
      case 'cloudflare':
        return this.buildCloudflareImageUrl(url, options)
      case 'cloudfront':
        return this.buildCloudfrontImageUrl(url, options)
      case 'bunny':
        return this.buildBunnyImageUrl(url, options)
      default:
        return url
    }
  }

  private buildCloudflareImageUrl(url: string, options: ImageTransformOptions): string {
    // Cloudflare Image Resizing format
    const params: string[] = []

    if (options.width) params.push(`width=${options.width}`)
    if (options.height) params.push(`height=${options.height}`)
    if (options.quality) params.push(`quality=${options.quality}`)
    if (options.format && options.format !== 'auto') params.push(`format=${options.format}`)
    if (options.fit) params.push(`fit=${options.fit}`)
    if (options.blur) params.push(`blur=${options.blur}`)
    if (options.grayscale) params.push('grayscale=true')

    if (params.length === 0) return url

    const cfParams = params.join(',')
    const urlObj = new URL(url)

    return `${urlObj.protocol}//${urlObj.host}/cdn-cgi/image/${cfParams}${urlObj.pathname}`
  }

  private buildCloudfrontImageUrl(url: string, options: ImageTransformOptions): string {
    // CloudFront with Lambda@Edge format
    const params = new URLSearchParams()

    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    if (options.quality) params.set('q', options.quality.toString())
    if (options.format && options.format !== 'auto') params.set('f', options.format)
    if (options.fit) params.set('fit', options.fit)

    const queryString = params.toString()

    return queryString ? `${url}?${queryString}` : url
  }

  private buildBunnyImageUrl(url: string, options: ImageTransformOptions): string {
    // Bunny CDN Image Optimization format
    const params = new URLSearchParams()

    if (options.width) params.set('width', options.width.toString())
    if (options.height) params.set('height', options.height.toString())
    if (options.quality) params.set('quality', options.quality.toString())
    if (options.format && options.format !== 'auto') params.set('format', options.format)
    if (options.fit) params.set('aspect_ratio', options.fit)
    if (options.blur) params.set('blur', options.blur.toString())
    if (options.grayscale) params.set('grayscale', 'true')

    const queryString = params.toString()

    return queryString ? `${url}?${queryString}` : url
  }

  // ============================================================================
  // URL SIGNING
  // ============================================================================

  private signUrl(url: string, expiresIn: number): string {
    if (!this.config.signedUrlSecret) {
      return url
    }

    const expires = Math.floor(Date.now() / 1000) + expiresIn
    const urlWithExpiry = `${url}?expires=${expires}`

    const signature = crypto
      .createHmac('sha256', this.config.signedUrlSecret)
      .update(urlWithExpiry)
      .digest('hex')

    return `${urlWithExpiry}&signature=${signature}`
  }

  verifySignedUrl(url: string): boolean {
    if (!this.config.signedUrlSecret) {
      return true
    }

    try {
      const urlObj = new URL(url)
      const expires = urlObj.searchParams.get('expires')
      const signature = urlObj.searchParams.get('signature')

      if (!expires || !signature) {
        return false
      }

      // Check expiry
      const expiryTime = parseInt(expires, 10)
      if (Date.now() / 1000 > expiryTime) {
        return false
      }

      // Verify signature
      urlObj.searchParams.delete('signature')
      const expectedSignature = crypto
        .createHmac('sha256', this.config.signedUrlSecret)
        .update(urlObj.toString())
        .digest('hex')

      return signature === expectedSignature
    } catch {
      return false
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  async invalidateCache(filePaths: string | string[]): Promise<void> {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths]

    // Invalidate local URL cache
    for (const path of paths) {
      await this.cache.delete(`cdn:url:${path}`)
    }

    // CDN-specific invalidation
    switch (this.config.provider) {
      case 'cloudflare':
        await this.invalidateCloudflareCache(paths)
        break
      case 'cloudfront':
        await this.invalidateCloudfrontCache(paths)
        break
      case 'bunny':
        await this.invalidateBunnyCache(paths)
        break
    }

    this.logger.log(`Cache invalidated for ${paths.length} paths`)
  }

  private async invalidateCloudflareCache(paths: string[]): Promise<void> {
    const zoneId = this.configService.get<string>('CLOUDFLARE_ZONE_ID')
    const apiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN')

    if (!zoneId || !apiToken) {
      this.logger.warn('Cloudflare credentials not configured for cache purge')
      return
    }

    // Cloudflare API call would go here
    // For now, just log
    this.logger.debug(`Would purge Cloudflare cache for zone ${zoneId}: ${paths.length} files`)
  }

  private async invalidateCloudfrontCache(paths: string[]): Promise<void> {
    const distributionId = this.configService.get<string>('CLOUDFRONT_DISTRIBUTION_ID')

    if (!distributionId) {
      this.logger.warn('CloudFront distribution ID not configured for cache invalidation')
      return
    }

    // AWS CloudFront API call would go here
    this.logger.debug(`Would invalidate CloudFront distribution ${distributionId}: ${paths.length} files`)
  }

  private async invalidateBunnyCache(paths: string[]): Promise<void> {
    const pullZoneId = this.configService.get<string>('BUNNY_PULL_ZONE_ID')
    const apiKey = this.configService.get<string>('BUNNY_API_KEY')

    if (!pullZoneId || !apiKey) {
      this.logger.warn('Bunny CDN credentials not configured for cache purge')
      return
    }

    // Bunny CDN API call would go here
    this.logger.debug(`Would purge Bunny CDN zone ${pullZoneId}: ${paths.length} files`)
  }

  // ============================================================================
  // CACHE HEADERS
  // ============================================================================

  getCacheHeaders(options?: CdnCacheOptions): Record<string, string> {
    const headers: Record<string, string> = {}
    const ttl = options?.ttl ?? this.config.cacheTtl

    const directives: string[] = []

    if (options?.private) {
      directives.push('private')
    } else {
      directives.push('public')
    }

    directives.push(`max-age=${ttl}`)

    if (options?.staleWhileRevalidate) {
      directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`)
    }

    if (options?.staleIfError) {
      directives.push(`stale-if-error=${options.staleIfError}`)
    }

    headers['Cache-Control'] = directives.join(', ')

    return headers
  }

  // ============================================================================
  // BATCH URL GENERATION
  // ============================================================================

  async getUrls(
    filePaths: string[],
    options?: CdnCacheOptions,
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>()

    // Check cache first
    const cacheKeys = filePaths.map((p) => `cdn:url:${p}`)
    const cached = await this.cache.mget<string>(cacheKeys)

    const uncachedPaths: string[] = []

    filePaths.forEach((path, index) => {
      if (cached[index]) {
        results.set(path, cached[index] as string)
      } else {
        uncachedPaths.push(path)
      }
    })

    // Generate URLs for uncached paths
    for (const path of uncachedPaths) {
      const url = await this.getUrl(path, options)
      results.set(path, url)

      // Cache the URL
      await this.cache.set(`cdn:url:${path}`, url, {
        ttl: options?.ttl ?? this.config.cacheTtl,
      })
    }

    return results
  }

  // ============================================================================
  // RESPONSIVE IMAGES
  // ============================================================================

  async getResponsiveImageUrls(
    filePath: string,
    widths: number[] = [320, 640, 768, 1024, 1280, 1920],
    format: 'webp' | 'avif' | 'auto' = 'webp',
  ): Promise<{ srcset: string; sizes: string }> {
    if (!this.config.enabled) {
      const url = await this.getOriginUrl(filePath)
      return {
        srcset: url,
        sizes: '100vw',
      }
    }

    const srcsetParts: string[] = []

    for (const width of widths) {
      const url = await this.getImageUrl(filePath, {
        width,
        format,
        quality: 80,
      })
      srcsetParts.push(`${url} ${width}w`)
    }

    return {
      srcset: srcsetParts.join(', '),
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    }
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  isEnabled(): boolean {
    return this.config.enabled
  }

  getProvider(): string {
    return this.config.provider
  }

  getBaseUrl(): string {
    return this.config.baseUrl
  }

  getDefaultCacheTtl(): number {
    return this.config.cacheTtl
  }
}
