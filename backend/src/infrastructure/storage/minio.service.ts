// ============================================================================
// MINIO SERVICE - S3-Compatible Object Storage
// ============================================================================
// Core storage service using MinIO (S3-compatible) for file storage
// Supports buckets, presigned URLs, streaming, and metadata
// ============================================================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Minio from 'minio'
import { Readable } from 'stream'

export interface BucketPolicy {
  Version: string
  Statement: Array<{
    Effect: 'Allow' | 'Deny'
    Principal: string | { AWS: string[] }
    Action: string[]
    Resource: string[]
  }>
}

export interface ObjectInfo {
  name: string
  size: number
  etag: string
  lastModified: Date
  metadata?: Record<string, string>
}

export interface UploadResult {
  etag: string
  versionId?: string
}

export interface CopyObjectResult {
  etag: string
  lastModified?: Date
}

export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  partSize?: number // For multipart uploads
}

export interface PresignedUrlOptions {
  expiresIn?: number // Seconds
  contentType?: string
  responseContentDisposition?: string
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name)
  private client: Minio.Client
  private readonly defaultBucket: string

  constructor(private readonly configService: ConfigService) {
    this.defaultBucket = this.configService.get<string>('MINIO_DEFAULT_BUCKET', 'omnicassion')
  }

  async onModuleInit(): Promise<void> {
    const endPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost')
    const port = this.configService.get<number>('MINIO_PORT', 9000)
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin')
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin')
    const useSSL = this.configService.get<boolean>('MINIO_USE_SSL', false)

    this.client = new Minio.Client({
      endPoint,
      port,
      accessKey,
      secretKey,
      useSSL,
    })

    try {
      // Verify connection by checking if default bucket exists
      const bucketExists = await this.client.bucketExists(this.defaultBucket)

      if (!bucketExists) {
        await this.createBucket(this.defaultBucket)
        this.logger.log(`Created default bucket: ${this.defaultBucket}`)
      }

      this.logger.log(`Connected to MinIO at ${endPoint}:${port}`)
    } catch (error) {
      this.logger.error('Failed to connect to MinIO', error)
      throw error
    }
  }

  // ============================================================================
  // BUCKET OPERATIONS
  // ============================================================================

  async createBucket(bucket: string, region?: string): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucket)

      if (!exists) {
        await this.client.makeBucket(bucket, region || 'us-east-1')
        this.logger.log(`Bucket created: ${bucket}`)
      }
    } catch (error) {
      this.logger.error(`Failed to create bucket: ${bucket}`, error)
      throw error
    }
  }

  async deleteBucket(bucket: string): Promise<void> {
    try {
      await this.client.removeBucket(bucket)
      this.logger.log(`Bucket deleted: ${bucket}`)
    } catch (error) {
      this.logger.error(`Failed to delete bucket: ${bucket}`, error)
      throw error
    }
  }

  async listBuckets(): Promise<Minio.BucketItemFromList[]> {
    return this.client.listBuckets()
  }

  async setBucketPolicy(bucket: string, policy: BucketPolicy): Promise<void> {
    try {
      await this.client.setBucketPolicy(bucket, JSON.stringify(policy))
      this.logger.log(`Bucket policy set for: ${bucket}`)
    } catch (error) {
      this.logger.error(`Failed to set bucket policy: ${bucket}`, error)
      throw error
    }
  }

  async setPublicReadPolicy(bucket: string): Promise<void> {
    const policy: BucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    }

    await this.setBucketPolicy(bucket, policy)
  }

  // ============================================================================
  // OBJECT OPERATIONS
  // ============================================================================

  async uploadFile(
    objectName: string,
    file: Buffer | Readable,
    size?: number,
    options?: UploadOptions,
    bucket?: string,
  ): Promise<UploadResult> {
    const targetBucket = bucket || this.defaultBucket

    try {
      const metaData: Record<string, string> = {
        'Content-Type': options?.contentType || 'application/octet-stream',
        ...options?.metadata,
      }

      const result = await this.client.putObject(
        targetBucket,
        objectName,
        file,
        size,
        metaData,
      )

      this.logger.debug(`File uploaded: ${targetBucket}/${objectName}`)

      return {
        ...result,
        versionId: result.versionId || undefined,
      }
    } catch (error) {
      this.logger.error(`Failed to upload file: ${objectName}`, error)
      throw error
    }
  }

  async uploadStream(
    objectName: string,
    stream: Readable,
    size: number,
    options?: UploadOptions,
    bucket?: string,
  ): Promise<UploadResult> {
    return this.uploadFile(objectName, stream, size, options, bucket)
  }

  async getFile(objectName: string, bucket?: string): Promise<Buffer> {
    const targetBucket = bucket || this.defaultBucket

    try {
      const stream = await this.client.getObject(targetBucket, objectName)
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    } catch (error) {
      this.logger.error(`Failed to get file: ${objectName}`, error)
      throw error
    }
  }

  async getFileStream(objectName: string, bucket?: string): Promise<Readable> {
    const targetBucket = bucket || this.defaultBucket

    try {
      return await this.client.getObject(targetBucket, objectName)
    } catch (error) {
      this.logger.error(`Failed to get file stream: ${objectName}`, error)
      throw error
    }
  }

  async getPartialFile(
    objectName: string,
    offset: number,
    length: number,
    bucket?: string,
  ): Promise<Readable> {
    const targetBucket = bucket || this.defaultBucket

    try {
      return await this.client.getPartialObject(targetBucket, objectName, offset, length)
    } catch (error) {
      this.logger.error(`Failed to get partial file: ${objectName}`, error)
      throw error
    }
  }

  async deleteFile(objectName: string, bucket?: string): Promise<void> {
    const targetBucket = bucket || this.defaultBucket

    try {
      await this.client.removeObject(targetBucket, objectName)
      this.logger.debug(`File deleted: ${targetBucket}/${objectName}`)
    } catch (error) {
      this.logger.error(`Failed to delete file: ${objectName}`, error)
      throw error
    }
  }

  async deleteFiles(objectNames: string[], bucket?: string): Promise<void> {
    const targetBucket = bucket || this.defaultBucket

    try {
      await this.client.removeObjects(targetBucket, objectNames)
      this.logger.debug(`Files deleted from ${targetBucket}: ${objectNames.length} files`)
    } catch (error) {
      this.logger.error(`Failed to delete files`, error)
      throw error
    }
  }

  async copyFile(
    sourceObject: string,
    destObject: string,
    sourceBucket?: string,
    destBucket?: string,
  ): Promise<CopyObjectResult> {
    const srcBucket = sourceBucket || this.defaultBucket
    const dstBucket = destBucket || this.defaultBucket

    try {
      const result = await this.client.copyObject(
        dstBucket,
        destObject,
        `/${srcBucket}/${sourceObject}`,
        new Minio.CopyConditions(),
      )

      this.logger.debug(`File copied: ${srcBucket}/${sourceObject} -> ${dstBucket}/${destObject}`)

      return {
        ...result,
        // lastModified may not exist on all response types
        lastModified: (result as any).lastModified instanceof Date 
          ? (result as any).lastModified 
          : (result as any).lastModified 
            ? new Date((result as any).lastModified) 
            : new Date(),
      } as any
    } catch (error) {
      this.logger.error(`Failed to copy file: ${sourceObject}`, error)
      throw error
    }
  }

  async fileExists(objectName: string, bucket?: string): Promise<boolean> {
    const targetBucket = bucket || this.defaultBucket

    try {
      await this.client.statObject(targetBucket, objectName)
      return true
    } catch {
      return false
    }
  }

  async getFileInfo(objectName: string, bucket?: string): Promise<ObjectInfo> {
    const targetBucket = bucket || this.defaultBucket

    try {
      const stat = await this.client.statObject(targetBucket, objectName)

      return {
        name: objectName,
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        metadata: stat.metaData,
      }
    } catch (error) {
      this.logger.error(`Failed to get file info: ${objectName}`, error)
      throw error
    }
  }

  // ============================================================================
  // LIST OPERATIONS
  // ============================================================================

  async listFiles(prefix?: string, recursive?: boolean, bucket?: string): Promise<ObjectInfo[]> {
    const targetBucket = bucket || this.defaultBucket
    const objects: ObjectInfo[] = []

    return new Promise((resolve, reject) => {
      const stream = this.client.listObjects(targetBucket, prefix, recursive)

      stream.on('data', (obj) => {
        if (obj.name) {
          objects.push({
            name: obj.name,
            size: obj.size ?? 0,
            etag: obj.etag || '',
            lastModified: obj.lastModified ?? new Date(0),
          })
        }
      })

      stream.on('end', () => resolve(objects))
      stream.on('error', reject)
    })
  }

  async listFilesV2(
    prefix?: string,
    recursive?: boolean,
    startAfter?: string,
    bucket?: string,
  ): Promise<ObjectInfo[]> {
    const targetBucket = bucket || this.defaultBucket
    const objects: ObjectInfo[] = []

    return new Promise((resolve, reject) => {
      const stream = this.client.listObjectsV2(targetBucket, prefix, recursive, startAfter)

      stream.on('data', (obj) => {
        if (obj.name) {
          objects.push({
            name: obj.name,
            size: obj.size ?? 0,
            etag: obj.etag || '',
            lastModified: obj.lastModified ?? new Date(0),
          })
        }
      })

      stream.on('end', () => resolve(objects))
      stream.on('error', reject)
    })
  }

  // ============================================================================
  // PRESIGNED URL OPERATIONS
  // ============================================================================

  async getPresignedGetUrl(
    objectName: string,
    options?: PresignedUrlOptions,
    bucket?: string,
  ): Promise<string> {
    const targetBucket = bucket || this.defaultBucket
    const expiresIn = options?.expiresIn || 3600 // 1 hour default

    try {
      const reqParams: Record<string, string> = {}

      if (options?.responseContentDisposition) {
        reqParams['response-content-disposition'] = options.responseContentDisposition
      }

      return await this.client.presignedGetObject(
        targetBucket,
        objectName,
        expiresIn,
        reqParams,
      )
    } catch (error) {
      this.logger.error(`Failed to get presigned GET URL: ${objectName}`, error)
      throw error
    }
  }

  async getPresignedPutUrl(
    objectName: string,
    options?: PresignedUrlOptions,
    bucket?: string,
  ): Promise<string> {
    const targetBucket = bucket || this.defaultBucket
    const expiresIn = options?.expiresIn || 3600

    try {
      return await this.client.presignedPutObject(targetBucket, objectName, expiresIn)
    } catch (error) {
      this.logger.error(`Failed to get presigned PUT URL: ${objectName}`, error)
      throw error
    }
  }

  async getPresignedPostPolicy(
    objectName: string,
    expiresIn?: number,
    conditions?: Array<[string, string, string] | [string, string] | Record<string, string>>,
    bucket?: string,
  ): Promise<{ postURL: string; formData: Record<string, string> }> {
    const targetBucket = bucket || this.defaultBucket
    const expires = new Date()
    expires.setSeconds(expires.getSeconds() + (expiresIn || 3600))

    const policy = this.client.newPostPolicy()
    policy.setBucket(targetBucket)
    policy.setKey(objectName)
    policy.setExpires(expires)

    if (conditions) {
      for (const condition of conditions) {
        if (Array.isArray(condition)) {
          if (condition.length === 3) {
            const [op, key, value] = condition
            if (op === 'starts-with') {
              policy.setKeyStartsWith(value)
            }
          } else if (condition.length === 2) {
            const [key, value] = condition
            if (key === 'content-type') {
              policy.setContentType(value)
            }
          }
        }
      }
    }

    try {
      return await this.client.presignedPostPolicy(policy)
    } catch (error) {
      this.logger.error(`Failed to get presigned POST policy: ${objectName}`, error)
      throw error
    }
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  async getFileUrl(objectName: string, bucket?: string): Promise<string> {
    const targetBucket = bucket || this.defaultBucket
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost')
    const port = this.configService.get<number>('MINIO_PORT', 9000)
    const useSSL = this.configService.get<boolean>('MINIO_USE_SSL', false)
    const protocol = useSSL ? 'https' : 'http'

    return `${protocol}://${endpoint}:${port}/${targetBucket}/${objectName}`
  }

  getClient(): Minio.Client {
    return this.client
  }

  getDefaultBucket(): string {
    return this.defaultBucket
  }

  // ============================================================================
  // MULTIPART UPLOAD OPERATIONS
  // ============================================================================

  async initiateMultipartUpload(
    objectName: string,
    contentType?: string,
    bucket?: string,
  ): Promise<string> {
    // MinIO SDK handles multipart internally, but this can be used
    // for tracking purposes
    const targetBucket = bucket || this.defaultBucket
    const uploadId = `${targetBucket}/${objectName}/${Date.now()}`

    this.logger.debug(`Multipart upload initiated: ${uploadId}`)

    return uploadId
  }

  async uploadLargeFile(
    objectName: string,
    filePath: string,
    options?: UploadOptions,
    bucket?: string,
  ): Promise<UploadResult> {
    const targetBucket = bucket || this.defaultBucket
    const partSize = options?.partSize || 64 * 1024 * 1024 // 64MB default

    try {
      const metaData: Record<string, string> = {
        'Content-Type': options?.contentType || 'application/octet-stream',
        ...options?.metadata,
      }

      const result = await this.client.fPutObject(
        targetBucket,
        objectName,
        filePath,
        metaData,
      )

      this.logger.debug(`Large file uploaded: ${targetBucket}/${objectName}`)

      return {
        ...result,
        versionId: result.versionId || undefined,
      }
    } catch (error) {
      this.logger.error(`Failed to upload large file: ${objectName}`, error)
      throw error
    }
  }

  async downloadLargeFile(objectName: string, filePath: string, bucket?: string): Promise<void> {
    const targetBucket = bucket || this.defaultBucket

    try {
      await this.client.fGetObject(targetBucket, objectName, filePath)
      this.logger.debug(`Large file downloaded: ${targetBucket}/${objectName} -> ${filePath}`)
    } catch (error) {
      this.logger.error(`Failed to download large file: ${objectName}`, error)
      throw error
    }
  }
}
