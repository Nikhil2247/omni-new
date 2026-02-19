// ============================================================================
// JOBS MODULE - Background Job Processing with BullMQ
// ============================================================================
// Configures BullMQ queues and processors for background job processing
// Uses Dragonfly (Redis-compatible) as the queue backend
// ============================================================================

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { InsightsModule } from '../../domain/insights/insights.module';

// Queues
import { EmailQueue, EMAIL_QUEUE_NAME } from './queues/email.queue';
import { MediaQueue, MEDIA_QUEUE_NAME } from './queues/media.queue';
import { MetricsQueue } from './queues/metrics.queue';

// Processors
import { EmailProcessor } from './processors/email.processor';
import { MediaProcessingProcessor } from './processors/media-processing.processor';
import {
  NotificationProcessor,
  NOTIFICATION_QUEUE_NAME,
} from './processors/notification.processor';
import {
  SearchSyncProcessor,
  SEARCH_SYNC_QUEUE_NAME,
} from './processors/search-sync.processor';
import {
  MetricsAggregationProcessor,
  METRICS_QUEUE,
} from './processors/metrics-aggregation.processor';

@Module({
  imports: [
    ConfigModule,
    InsightsModule,

    // Configure BullMQ with Redis/Dragonfly connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('DRAGONFLY_HOST', 'localhost'),
          port: configService.get<number>('DRAGONFLY_PORT', 6379),
          password: configService.get<string>('DRAGONFLY_PASSWORD'),
          db: configService.get<number>('BULLMQ_DB', 1),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
      inject: [ConfigService],
    }),

    // Register queues
    BullModule.registerQueue(
      { name: EMAIL_QUEUE_NAME },
      { name: MEDIA_QUEUE_NAME },
      { name: NOTIFICATION_QUEUE_NAME },
      { name: SEARCH_SYNC_QUEUE_NAME },
      { name: METRICS_QUEUE },
    ),
  ],
  providers: [
    // Queue services
    EmailQueue,
    MediaQueue,
    MetricsQueue,

    // Processors (workers)
    EmailProcessor,
    MediaProcessingProcessor,
    NotificationProcessor,
    SearchSyncProcessor,
    MetricsAggregationProcessor,
  ],
  exports: [BullModule, EmailQueue, MediaQueue, MetricsQueue],
})
export class JobsModule {}
