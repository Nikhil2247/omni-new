// ============================================================================
// MEDIA QUEUE - Media Processing Job Queue
// ============================================================================
// Manages media processing jobs with BullMQ
// Supports image optimization, video transcoding, and thumbnail generation
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue, JobsOptions } from 'bullmq'

export const MEDIA_QUEUE_NAME = 'media'

export enum MediaJobType {
  IMAGE_OPTIMIZE = 'image-optimize',
  IMAGE_RESIZE = 'image-resize',
  IMAGE_THUMBNAIL = 'image-thumbnail',
  VIDEO_TRANSCODE = 'video-transcode',
  VIDEO_THUMBNAIL = 'video-thumbnail',
  DOCUMENT_PROCESS = 'document-process',
  BATCH_OPTIMIZE = 'batch-optimize',
}

export interface ImageOptimizeJobData {
  type: MediaJobType.IMAGE_OPTIMIZE
  sourcePath: string
  destinationPath: string
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
  maxWidth?: number
  maxHeight?: number
  metadata?: Record<string, unknown>
}

export interface ImageResizeJobData {
  type: MediaJobType.IMAGE_RESIZE
  sourcePath: string
  destinationPath: string
  width: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  format?: 'jpeg' | 'png' | 'webp'
  quality?: number
  metadata?: Record<string, unknown>
}

export interface ImageThumbnailJobData {
  type: MediaJobType.IMAGE_THUMBNAIL
  sourcePath: string
  destinationPath: string
  sizes: Array<{
    width: number
    height?: number
    suffix: string
  }>
  format?: 'jpeg' | 'png' | 'webp'
  quality?: number
  metadata?: Record<string, unknown>
}

export interface VideoTranscodeJobData {
  type: MediaJobType.VIDEO_TRANSCODE
  sourcePath: string
  destinationPath: string
  codec?: 'h264' | 'h265' | 'vp9' | 'av1'
  resolution?: '480p' | '720p' | '1080p' | '4k'
  bitrate?: string
  format?: 'mp4' | 'webm'
  metadata?: Record<string, unknown>
}

export interface VideoThumbnailJobData {
  type: MediaJobType.VIDEO_THUMBNAIL
  sourcePath: string
  destinationPath: string
  timestamp?: string // e.g., '00:00:05'
  count?: number // Generate multiple thumbnails
  width?: number
  height?: number
  metadata?: Record<string, unknown>
}

export interface DocumentProcessJobData {
  type: MediaJobType.DOCUMENT_PROCESS
  sourcePath: string
  destinationPath?: string
  operation: 'extract-text' | 'convert-pdf' | 'generate-preview'
  metadata?: Record<string, unknown>
}

export interface BatchOptimizeJobData {
  type: MediaJobType.BATCH_OPTIMIZE
  files: Array<{
    sourcePath: string
    destinationPath: string
  }>
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  maxWidth?: number
  maxHeight?: number
  metadata?: Record<string, unknown>
}

export type MediaJobData =
  | ImageOptimizeJobData
  | ImageResizeJobData
  | ImageThumbnailJobData
  | VideoTranscodeJobData
  | VideoThumbnailJobData
  | DocumentProcessJobData
  | BatchOptimizeJobData

@Injectable()
export class MediaQueue {
  private readonly logger = new Logger(MediaQueue.name)

  constructor(@InjectQueue(MEDIA_QUEUE_NAME) private readonly queue: Queue) {}

  // ============================================================================
  // IMAGE PROCESSING
  // ============================================================================

  async optimizeImage(
    sourcePath: string,
    destinationPath: string,
    options?: {
      quality?: number
      format?: 'jpeg' | 'png' | 'webp' | 'avif'
      maxWidth?: number
      maxHeight?: number
    },
  ): Promise<string> {
    const job = await this.queue.add(
      MediaJobType.IMAGE_OPTIMIZE,
      {
        type: MediaJobType.IMAGE_OPTIMIZE,
        sourcePath,
        destinationPath,
        ...options,
      } as ImageOptimizeJobData,
      this.getDefaultOptions(),
    )

    this.logger.debug(`Image optimize job queued: ${job.id}`)
    return job.id as string
  }

  async resizeImage(
    sourcePath: string,
    destinationPath: string,
    width: number,
    options?: {
      height?: number
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
      format?: 'jpeg' | 'png' | 'webp'
      quality?: number
    },
  ): Promise<string> {
    const job = await this.queue.add(
      MediaJobType.IMAGE_RESIZE,
      {
        type: MediaJobType.IMAGE_RESIZE,
        sourcePath,
        destinationPath,
        width,
        ...options,
      } as ImageResizeJobData,
      this.getDefaultOptions(),
    )

    this.logger.debug(`Image resize job queued: ${job.id}`)
    return job.id as string
  }

  async generateThumbnails(
    sourcePath: string,
    destinationPath: string,
    sizes: Array<{ width: number; height?: number; suffix: string }>,
    options?: {
      format?: 'jpeg' | 'png' | 'webp'
      quality?: number
    },
  ): Promise<string> {
    const job = await this.queue.add(
      MediaJobType.IMAGE_THUMBNAIL,
      {
        type: MediaJobType.IMAGE_THUMBNAIL,
        sourcePath,
        destinationPath,
        sizes,
        ...options,
      } as ImageThumbnailJobData,
      this.getDefaultOptions(),
    )

    this.logger.debug(`Image thumbnail job queued: ${job.id}`)
    return job.id as string
  }

  async generateStandardThumbnails(
    sourcePath: string,
    basePath: string,
  ): Promise<string> {
    return this.generateThumbnails(sourcePath, basePath, [
      { width: 100, height: 100, suffix: '_thumb' },
      { width: 300, height: 300, suffix: '_small' },
      { width: 600, height: 600, suffix: '_medium' },
      { width: 1200, suffix: '_large' },
    ])
  }

  // ============================================================================
  // VIDEO PROCESSING
  // ============================================================================

  async transcodeVideo(
    sourcePath: string,
    destinationPath: string,
    options?: {
      codec?: 'h264' | 'h265' | 'vp9' | 'av1'
      resolution?: '480p' | '720p' | '1080p' | '4k'
      bitrate?: string
      format?: 'mp4' | 'webm'
    },
  ): Promise<string> {
    const job = await this.queue.add(
      MediaJobType.VIDEO_TRANSCODE,
      {
        type: MediaJobType.VIDEO_TRANSCODE,
        sourcePath,
        destinationPath,
        ...options,
      } as VideoTranscodeJobData,
      {
        ...this.getDefaultOptions(),
        attempts: 2,
      },
    )

    this.logger.debug(`Video transcode job queued: ${job.id}`)
    return job.id as string
  }

  async generateVideoThumbnail(
    sourcePath: string,
    destinationPath: string,
    options?: {
      timestamp?: string
      count?: number
      width?: number
      height?: number
    },
  ): Promise<string> {
    const job = await this.queue.add(
      MediaJobType.VIDEO_THUMBNAIL,
      {
        type: MediaJobType.VIDEO_THUMBNAIL,
        sourcePath,
        destinationPath,
        timestamp: options?.timestamp || '00:00:05',
        ...options,
      } as VideoThumbnailJobData,
      this.getDefaultOptions(),
    )

    this.logger.debug(`Video thumbnail job queued: ${job.id}`)
    return job.id as string
  }

  // ============================================================================
  // DOCUMENT PROCESSING
  // ============================================================================

  async processDocument(
    sourcePath: string,
    operation: 'extract-text' | 'convert-pdf' | 'generate-preview',
    destinationPath?: string,
  ): Promise<string> {
    const job = await this.queue.add(
      MediaJobType.DOCUMENT_PROCESS,
      {
        type: MediaJobType.DOCUMENT_PROCESS,
        sourcePath,
        destinationPath,
        operation,
      } as DocumentProcessJobData,
      this.getDefaultOptions(),
    )

    this.logger.debug(`Document process job queued: ${job.id}`)
    return job.id as string
  }

  // ============================================================================
  // BATCH PROCESSING
  // ============================================================================

  async batchOptimize(
    files: Array<{ sourcePath: string; destinationPath: string }>,
    options?: {
      quality?: number
      format?: 'jpeg' | 'png' | 'webp'
      maxWidth?: number
      maxHeight?: number
    },
  ): Promise<string> {
    const job = await this.queue.add(
      MediaJobType.BATCH_OPTIMIZE,
      {
        type: MediaJobType.BATCH_OPTIMIZE,
        files,
        ...options,
      } as BatchOptimizeJobData,
      {
        ...this.getDefaultOptions(),
      },
    )

    this.logger.debug(`Batch optimize job queued: ${job.id} for ${files.length} files`)
    return job.id as string
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  async getJobStatus(jobId: string): Promise<{
    id: string
    status: string
    progress: number
    data: MediaJobData
    failedReason?: string
    returnvalue?: unknown
  } | null> {
    const job = await this.queue.getJob(jobId)

    if (!job) return null

    const state = await job.getState()

    return {
      id: job.id as string,
      status: state,
      progress: job.progress as number,
      data: job.data as MediaJobData,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId)

    if (!job) return false

    const state = await job.getState()

    if (state === 'waiting' || state === 'delayed') {
      await job.remove()
      this.logger.debug(`Media job cancelled: ${jobId}`)
      return true
    }

    return false
  }

  async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ])

    return { waiting, active, completed, failed, delayed }
  }

  private getDefaultOptions(): JobsOptions {
    return {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    }
  }
}
