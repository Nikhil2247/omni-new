// ============================================================================
// HEALTH MODULE - Comprehensive Health Checks for All Dependencies
// ============================================================================
// Provides detailed health status for database, cache, search, storage, and jobs
// ============================================================================

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { HealthService } from './health.service';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { CacheHealthIndicator } from './indicators/cache.health';
import { SearchHealthIndicator } from './indicators/search.health';
import { StorageHealthIndicator } from './indicators/storage.health';
import { JobsHealthIndicator } from './indicators/jobs.health';
import { DatabaseModule } from '../../core/database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TerminusModule, ConfigModule, DatabaseModule, CacheModule],
  providers: [
    HealthService,
    DatabaseHealthIndicator,
    CacheHealthIndicator,
    SearchHealthIndicator,
    StorageHealthIndicator,
    JobsHealthIndicator,
  ],
  exports: [
    HealthService,
    DatabaseHealthIndicator,
    CacheHealthIndicator,
    SearchHealthIndicator,
    StorageHealthIndicator,
    JobsHealthIndicator,
  ],
})
export class HealthModule {}
