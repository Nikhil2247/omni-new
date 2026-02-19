// ============================================================================
// STORAGE MODULE - Object Storage and CDN Services
// ============================================================================
// Provides MinIO storage, upload handling, and CDN integration
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioService } from './minio.service';
import { UploadService } from './upload.service';
import { CdnService } from './cdn.service';
import { CacheModule } from '../cache/cache.module';

@Global()
@Module({
  imports: [ConfigModule, CacheModule],
  providers: [MinioService, UploadService, CdnService],
  exports: [MinioService, UploadService, CdnService],
})
export class StorageModule {}
