// ============================================================================
// STORAGE HEALTH INDICATOR - MinIO S3 Health Check
// ============================================================================

import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  private readonly minioUrl: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const host = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<number>('MINIO_PORT', 9000);
    const useSSL = this.configService.get<boolean>('MINIO_USE_SSL', false);
    this.minioUrl = `${useSSL ? 'https' : 'http'}://${host}:${port}`;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Call MinIO health endpoint
      const response = await fetch(`${this.minioUrl}/minio/health/live`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`MinIO returned status ${response.status}`);
      }

      return this.getStatus(key, true, {
        latency,
        connected: true,
        status: 'available',
      });
    } catch (error) {
      throw new HealthCheckError(
        'Storage health check failed',
        this.getStatus(key, false, {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}
