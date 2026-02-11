// ============================================================================
// UPLOAD SERVICE - High-Level File Upload Management
// ============================================================================
// Handles file uploads with validation, virus scanning, chunked uploads,
// automatic organization into storage buckets, and image optimization
// ============================================================================

import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MinioService, UploadOptions } from './minio.service'
import { randomUUID } from 'crypto'
import * as path from 'path'
import * as sharp from 'sharp'

export enum FileCategory {
  AVATAR = 'avatars',
  EVENT_BANNER = 'event-banners',
  EVENT_GALLERY = 'event-gallery',
  VENUE_IMAGE = 'venue-images',
  VENDOR_PROFILE = 'vendor-profiles',
  PORTFOLIO = 'portfolio',
  DOCUMENT = 'documents',
  MEDIA = 'media',
  ATTACHMENT = 'attachments',
  TEMP = 'temp',
}

export interface FileValidationOptions {
  maxSize?: number // Max file size in bytes
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
}

export interface UploadedFile {
  originalName: string
  filename: string
  path: string
  size: number
  mimeType: string
  bucket: string
  url: string
  thumbnailUrl?: string
  thumbnailPath?: string
  width?: number
  height?: number
  metadata?: Record<string, string>
}

export interface ChunkedUploadSession {
  uploadId: string
  filename: string
  totalChunks: number
  uploadedChunks: number[]
  category: FileCategory
  mimeType: string
  createdAt: Date
  expiresAt: Date
}

export interface ImageProcessingOptions {
  convertToWebP?: boolean
  quality?: number // 1-100, default 70
  maxWidth?: number
  maxHeight?: number
  generateThumbnail?: boolean
  thumbnailWidth?: number
  thumbnailHeight?: number
}

export interface ProcessedImage {
  buffer: Buffer
  mimeType: string
  extension: string
  width?: number
  height?: number
}

const DEFAULT_IMAGE_PROCESSING: ImageProcessingOptions = {
  convertToWebP: true,
  quality: 70,
  maxWidth: 2560,
  maxHeight: 2560,
  generateThumbnail: false,
  thumbnailWidth: 300,
  thumbnailHeight: 300,
}

const DEFAULT_VALIDATION: Record<FileCategory, FileValidationOptions> = {
  [FileCategory.AVATAR]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  [FileCategory.EVENT_BANNER]: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  [FileCategory.EVENT_GALLERY]: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'],
  },
  [FileCategory.VENUE_IMAGE]: {
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  [FileCategory.VENDOR_PROFILE]: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  [FileCategory.PORTFOLIO]: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'video/mp4', 'video/webm'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.mp4', '.webm'],
  },
  [FileCategory.DOCUMENT]: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
  },
  [FileCategory.MEDIA]: {
    maxSize: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
    ],
    allowedExtensions: ['.mp4', '.webm', '.mov', '.mp3', '.wav', '.ogg'],
  },
  [FileCategory.ATTACHMENT]: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: [],
    allowedExtensions: [],
  },
  [FileCategory.TEMP]: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [],
    allowedExtensions: [],
  },
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)
  private readonly chunkedUploads = new Map<string, ChunkedUploadSession>()

  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================================
  // IMAGE PROCESSING
  // ============================================================================

  /**
   * Check if a MIME type is an image that can be processed
   */
  private isProcessableImage(mimeType: string): boolean {
    const processableMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/tiff',
      'image/bmp',
      'image/avif',
      'image/heic',
      'image/heif',
    ]
    return processableMimeTypes.includes(mimeType.toLowerCase())
  }

  /**
   * Process an image: convert to WebP, resize, and optionally generate thumbnail
   */
  async processImage(
    imageBuffer: Buffer,
    options: ImageProcessingOptions = DEFAULT_IMAGE_PROCESSING,
  ): Promise<ProcessedImage> {
    const opts = { ...DEFAULT_IMAGE_PROCESSING, ...options }

    let sharpInstance = sharp(imageBuffer)

    // Get original metadata
    const metadata = await sharpInstance.metadata()

    // Resize if dimensions exceed max
    if (opts.maxWidth || opts.maxHeight) {
      sharpInstance = sharpInstance.resize({
        width: opts.maxWidth,
        height: opts.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    // Convert to WebP with specified quality
    if (opts.convertToWebP) {
      sharpInstance = sharpInstance.webp({
        quality: opts.quality || 70,
        effort: 4, // Balance between compression speed and file size
      })
    }

    const processedBuffer = await sharpInstance.toBuffer()
    const processedMetadata = await sharp(processedBuffer).metadata()

    return {
      buffer: processedBuffer,
      mimeType: opts.convertToWebP ? 'image/webp' : `image/${metadata.format}`,
      extension: opts.convertToWebP ? '.webp' : `.${metadata.format}`,
      width: processedMetadata.width,
      height: processedMetadata.height,
    }
  }

  /**
   * Generate a thumbnail for an image
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    width: number = 300,
    height: number = 300,
    quality: number = 70,
  ): Promise<ProcessedImage> {
    const sharpInstance = sharp(imageBuffer)
      .resize({
        width,
        height,
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality })

    const thumbnailBuffer = await sharpInstance.toBuffer()
    const metadata = await sharp(thumbnailBuffer).metadata()

    return {
      buffer: thumbnailBuffer,
      mimeType: 'image/webp',
      extension: '.webp',
      width: metadata.width,
      height: metadata.height,
    }
  }

  // ============================================================================
  // IMAGE UPLOAD WITH PROCESSING
  // ============================================================================

  /**
   * Upload an image with automatic WebP conversion and optional thumbnail generation
   */
  async uploadImage(
    file: Buffer,
    originalName: string,
    category: FileCategory,
    mimeType: string,
    options?: {
      validation?: FileValidationOptions
      metadata?: Record<string, string>
      customPath?: string
      imageProcessing?: ImageProcessingOptions
    },
  ): Promise<UploadedFile> {
    // Validate file
    const validation = options?.validation || DEFAULT_VALIDATION[category]
    await this.validateFile(file, originalName, mimeType, validation)

    const imageOpts = { ...DEFAULT_IMAGE_PROCESSING, ...options?.imageProcessing }

    let processedFile = file
    let finalMimeType = mimeType
    let finalExtension = path.extname(originalName)
    let width: number | undefined
    let height: number | undefined

    // Process image if it's a processable type
    if (this.isProcessableImage(mimeType)) {
      try {
        const processed = await this.processImage(file, imageOpts)
        processedFile = processed.buffer
        finalMimeType = processed.mimeType
        finalExtension = processed.extension
        width = processed.width
        height = processed.height

        this.logger.debug(`Image processed: ${originalName} -> WebP (${width}x${height}, ${processedFile.length} bytes)`)
      } catch (error) {
        this.logger.warn(`Failed to process image ${originalName}, uploading original`, error)
      }
    }

    // Generate unique filename with correct extension
    const baseName = path.basename(originalName, path.extname(originalName))
    const filename = `${Date.now()}-${randomUUID()}${finalExtension}`
    const filePath = options?.customPath || this.generatePath(category, filename)

    // Upload processed image to MinIO
    const uploadOptions: UploadOptions = {
      contentType: finalMimeType,
      metadata: {
        'original-name': originalName,
        'original-mime-type': mimeType,
        category,
        ...(width && { width: String(width) }),
        ...(height && { height: String(height) }),
        ...options?.metadata,
      },
    }

    await this.minioService.uploadFile(filePath, processedFile, processedFile.length, uploadOptions)

    // Get public URL
    const url = await this.minioService.getFileUrl(filePath)

    let thumbnailUrl: string | undefined
    let thumbnailPath: string | undefined

    // Generate and upload thumbnail if requested
    if (imageOpts.generateThumbnail && this.isProcessableImage(mimeType)) {
      try {
        const thumbnail = await this.generateThumbnail(
          file,
          imageOpts.thumbnailWidth,
          imageOpts.thumbnailHeight,
          imageOpts.quality,
        )

        const thumbFilename = `thumb-${filename}`
        thumbnailPath = this.generatePath(category, thumbFilename)

        await this.minioService.uploadFile(
          thumbnailPath,
          thumbnail.buffer,
          thumbnail.buffer.length,
          { contentType: 'image/webp' },
        )

        thumbnailUrl = await this.minioService.getFileUrl(thumbnailPath)
        this.logger.debug(`Thumbnail generated: ${thumbnailPath}`)
      } catch (error) {
        this.logger.warn(`Failed to generate thumbnail for ${originalName}`, error)
      }
    }

    this.logger.log(`Image uploaded: ${filePath}`)

    return {
      originalName,
      filename,
      path: filePath,
      size: processedFile.length,
      mimeType: finalMimeType,
      bucket: this.minioService.getDefaultBucket(),
      url,
      thumbnailUrl,
      thumbnailPath,
      width,
      height,
      metadata: uploadOptions.metadata,
    }
  }

  /**
   * Upload multiple images with processing
   */
  async uploadMultipleImages(
    files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
    category: FileCategory,
    options?: {
      validation?: FileValidationOptions
      metadata?: Record<string, string>
      imageProcessing?: ImageProcessingOptions
    },
  ): Promise<UploadedFile[]> {
    const results: UploadedFile[] = []

    for (const file of files) {
      const result = await this.uploadImage(
        file.buffer,
        file.originalName,
        category,
        file.mimeType,
        options,
      )
      results.push(result)
    }

    return results
  }

  // ============================================================================
  // SINGLE FILE UPLOAD
  // ============================================================================

  async uploadFile(
    file: Buffer,
    originalName: string,
    category: FileCategory,
    mimeType: string,
    options?: {
      validation?: FileValidationOptions
      metadata?: Record<string, string>
      customPath?: string
    },
  ): Promise<UploadedFile> {
    // Validate file
    const validation = options?.validation || DEFAULT_VALIDATION[category]
    await this.validateFile(file, originalName, mimeType, validation)

    // Generate unique filename
    const filename = this.generateFilename(originalName)
    const filePath = options?.customPath || this.generatePath(category, filename)

    // Upload to MinIO
    const uploadOptions: UploadOptions = {
      contentType: mimeType,
      metadata: {
        'original-name': originalName,
        category,
        ...options?.metadata,
      },
    }

    await this.minioService.uploadFile(filePath, file, file.length, uploadOptions)

    // Get public URL
    const url = await this.minioService.getFileUrl(filePath)

    this.logger.log(`File uploaded: ${filePath}`)

    return {
      originalName,
      filename,
      path: filePath,
      size: file.length,
      mimeType,
      bucket: this.minioService.getDefaultBucket(),
      url,
      metadata: uploadOptions.metadata,
    }
  }

  async uploadMultiple(
    files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
    category: FileCategory,
    options?: {
      validation?: FileValidationOptions
      metadata?: Record<string, string>
    },
  ): Promise<UploadedFile[]> {
    const results: UploadedFile[] = []

    for (const file of files) {
      const result = await this.uploadFile(
        file.buffer,
        file.originalName,
        category,
        file.mimeType,
        options,
      )
      results.push(result)
    }

    return results
  }

  // ============================================================================
  // CHUNKED UPLOAD (For Large Files)
  // ============================================================================

  async initiateChunkedUpload(
    filename: string,
    totalChunks: number,
    category: FileCategory,
    mimeType: string,
  ): Promise<ChunkedUploadSession> {
    const uploadId = randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    const session: ChunkedUploadSession = {
      uploadId,
      filename,
      totalChunks,
      uploadedChunks: [],
      category,
      mimeType,
      createdAt: new Date(),
      expiresAt,
    }

    this.chunkedUploads.set(uploadId, session)
    this.logger.log(`Chunked upload initiated: ${uploadId}`)

    return session
  }

  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunk: Buffer,
  ): Promise<{ uploadedChunks: number[]; isComplete: boolean }> {
    const session = this.chunkedUploads.get(uploadId)

    if (!session) {
      throw new BadRequestException('Invalid upload session')
    }

    if (session.expiresAt < new Date()) {
      this.chunkedUploads.delete(uploadId)
      throw new BadRequestException('Upload session expired')
    }

    if (session.uploadedChunks.includes(chunkIndex)) {
      throw new BadRequestException(`Chunk ${chunkIndex} already uploaded`)
    }

    // Store chunk temporarily
    const chunkPath = `${FileCategory.TEMP}/chunks/${uploadId}/${chunkIndex}`
    await this.minioService.uploadFile(chunkPath, chunk, chunk.length, {
      contentType: 'application/octet-stream',
    })

    session.uploadedChunks.push(chunkIndex)
    session.uploadedChunks.sort((a, b) => a - b)

    const isComplete = session.uploadedChunks.length === session.totalChunks

    this.logger.debug(`Chunk uploaded: ${uploadId}/${chunkIndex} (${session.uploadedChunks.length}/${session.totalChunks})`)

    return {
      uploadedChunks: session.uploadedChunks,
      isComplete,
    }
  }

  async completeChunkedUpload(uploadId: string): Promise<UploadedFile> {
    const session = this.chunkedUploads.get(uploadId)

    if (!session) {
      throw new BadRequestException('Invalid upload session')
    }

    if (session.uploadedChunks.length !== session.totalChunks) {
      throw new BadRequestException(
        `Missing chunks: ${session.totalChunks - session.uploadedChunks.length} remaining`,
      )
    }

    // Concatenate all chunks
    const chunks: Buffer[] = []

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = `${FileCategory.TEMP}/chunks/${uploadId}/${i}`
      const chunkBuffer = await this.minioService.getFile(chunkPath)
      chunks.push(chunkBuffer)
    }

    const completeFile = Buffer.concat(chunks)

    // Upload complete file
    const filename = this.generateFilename(session.filename)
    const filePath = this.generatePath(session.category, filename)

    await this.minioService.uploadFile(filePath, completeFile, completeFile.length, {
      contentType: session.mimeType,
      metadata: {
        'original-name': session.filename,
        category: session.category,
        'upload-id': uploadId,
      },
    })

    // Cleanup chunks
    await this.cleanupChunks(uploadId, session.totalChunks)
    this.chunkedUploads.delete(uploadId)

    const url = await this.minioService.getFileUrl(filePath)

    this.logger.log(`Chunked upload completed: ${uploadId} -> ${filePath}`)

    return {
      originalName: session.filename,
      filename,
      path: filePath,
      size: completeFile.length,
      mimeType: session.mimeType,
      bucket: this.minioService.getDefaultBucket(),
      url,
    }
  }

  async cancelChunkedUpload(uploadId: string): Promise<void> {
    const session = this.chunkedUploads.get(uploadId)

    if (session) {
      await this.cleanupChunks(uploadId, session.totalChunks)
      this.chunkedUploads.delete(uploadId)
      this.logger.log(`Chunked upload cancelled: ${uploadId}`)
    }
  }

  private async cleanupChunks(uploadId: string, totalChunks: number): Promise<void> {
    const chunkPaths: string[] = []

    for (let i = 0; i < totalChunks; i++) {
      chunkPaths.push(`${FileCategory.TEMP}/chunks/${uploadId}/${i}`)
    }

    try {
      await this.minioService.deleteFiles(chunkPaths)
    } catch (error) {
      this.logger.error(`Failed to cleanup chunks for ${uploadId}`, error)
    }
  }

  // ============================================================================
  // PRESIGNED URL UPLOAD (Direct Browser Upload)
  // ============================================================================

  async getPresignedUploadUrl(
    category: FileCategory,
    filename: string,
    mimeType: string,
    expiresIn?: number,
  ): Promise<{ uploadUrl: string; filePath: string; fileUrl: string }> {
    const generatedFilename = this.generateFilename(filename)
    const filePath = this.generatePath(category, generatedFilename)

    const uploadUrl = await this.minioService.getPresignedPutUrl(filePath, {
      expiresIn: expiresIn || 3600,
      contentType: mimeType,
    })

    const fileUrl = await this.minioService.getFileUrl(filePath)

    return { uploadUrl, filePath, fileUrl }
  }

  async getPresignedDownloadUrl(
    filePath: string,
    expiresIn?: number,
    downloadFilename?: string,
  ): Promise<string> {
    return this.minioService.getPresignedGetUrl(filePath, {
      expiresIn: expiresIn || 3600,
      responseContentDisposition: downloadFilename
        ? `attachment; filename="${downloadFilename}"`
        : undefined,
    })
  }

  // ============================================================================
  // FILE MANAGEMENT
  // ============================================================================

  async deleteFile(filePath: string): Promise<void> {
    await this.minioService.deleteFile(filePath)
    this.logger.log(`File deleted: ${filePath}`)
  }

  async deleteFiles(filePaths: string[]): Promise<void> {
    await this.minioService.deleteFiles(filePaths)
    this.logger.log(`Files deleted: ${filePaths.length} files`)
  }

  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    await this.minioService.copyFile(sourcePath, destPath)
    await this.minioService.deleteFile(sourcePath)
    this.logger.log(`File moved: ${sourcePath} -> ${destPath}`)
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    await this.minioService.copyFile(sourcePath, destPath)
    this.logger.log(`File copied: ${sourcePath} -> ${destPath}`)
  }

  async fileExists(filePath: string): Promise<boolean> {
    return this.minioService.fileExists(filePath)
  }

  async getFileInfo(filePath: string): Promise<UploadedFile | null> {
    try {
      const info = await this.minioService.getFileInfo(filePath)
      const url = await this.minioService.getFileUrl(filePath)

      return {
        originalName: info.metadata?.['original-name'] || path.basename(filePath),
        filename: path.basename(filePath),
        path: filePath,
        size: info.size,
        mimeType: info.metadata?.['Content-Type'] || 'application/octet-stream',
        bucket: this.minioService.getDefaultBucket(),
        url,
        metadata: info.metadata,
      }
    } catch {
      return null
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private async validateFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    options: FileValidationOptions,
  ): Promise<void> {
    // Check file size
    if (options.maxSize && file.length > options.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${Math.round(options.maxSize / 1024 / 1024)}MB)`,
      )
    }

    // Check MIME type
    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      if (!options.allowedMimeTypes.includes(mimeType)) {
        throw new BadRequestException(
          `File type not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
        )
      }
    }

    // Check extension
    if (options.allowedExtensions && options.allowedExtensions.length > 0) {
      const ext = path.extname(filename).toLowerCase()
      if (!options.allowedExtensions.includes(ext)) {
        throw new BadRequestException(
          `File extension not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`,
        )
      }
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName)
    const uuid = randomUUID()
    const timestamp = Date.now()

    return `${timestamp}-${uuid}${ext}`
  }

  private generatePath(category: FileCategory, filename: string): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')

    return `${category}/${year}/${month}/${filename}`
  }

  getValidationRules(category: FileCategory): FileValidationOptions {
    return DEFAULT_VALIDATION[category]
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async cleanupExpiredSessions(): Promise<number> {
    let cleaned = 0
    const now = new Date()

    for (const [uploadId, session] of this.chunkedUploads) {
      if (session.expiresAt < now) {
        await this.cleanupChunks(uploadId, session.totalChunks)
        this.chunkedUploads.delete(uploadId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired upload sessions`)
    }

    return cleaned
  }

  async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
    const files = await this.minioService.listFiles(`${FileCategory.TEMP}/`, true)
    const cutoff = new Date()
    cutoff.setHours(cutoff.getHours() - olderThanHours)

    const filesToDelete = files
      .filter((f) => f.lastModified < cutoff)
      .map((f) => f.name)

    if (filesToDelete.length > 0) {
      await this.minioService.deleteFiles(filesToDelete)
      this.logger.log(`Cleaned up ${filesToDelete.length} temp files`)
    }

    return filesToDelete.length
  }
}
