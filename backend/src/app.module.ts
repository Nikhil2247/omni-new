// ============================================================================
// APP MODULE - Root Application Module
// ============================================================================
// Orchestrates all modules with proper dependency order and configuration
// ============================================================================

import { Module, ExecutionContext } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

// Core Modules (Foundation - must be first)
import { DatabaseModule } from './core/database/database.module';
import { CommonModule } from './core/common/common.module';
import { EventsModule } from './core/events/events.module';
import { AuthModule } from './core/auth/auth.module';
import { LookupModule } from './core/lookup/lookup.module';

// Infrastructure Modules (Services)
import { CacheModule } from './infrastructure/cache/cache.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { SearchModule } from './infrastructure/search/search.module';
import { JobsModule } from './infrastructure/jobs/jobs.module';
import { NotificationsModule } from './infrastructure/notifications/notifications.module';
import { WebsocketsModule } from './infrastructure/websockets/websockets.module';
import { ResilienceModule } from './infrastructure/resilience/resilience.module';
import { HealthModule } from './infrastructure/health/health.module';
import { IdempotencyModule } from './infrastructure/idempotency/idempotency.module';
import { RateLimitingModule } from './infrastructure/rate-limiting/rate-limiting.module';

// Domain Modules (Business Logic)
import { CatalogModule } from './domain/catalog/catalog.module';
import { LeadsModule } from './domain/leads/leads.module';
import { MessagingModule } from './domain/messaging/messaging.module';
import { PlanningModule } from './domain/planning/planning.module';
import { OperationsModule } from './domain/operations/operations.module';
import { ContentModule } from './domain/content/content.module';

// API Gateway Modules (Controllers - must be last)
import { AdminGatewayModule } from './api/admin-gateway/admin-gateway.module';
import { OpsGatewayModule } from './api/ops-gateway/ops-gateway.module';
import { MarketingGatewayModule } from './api/marketing-gateway/marketing-gateway.module';
import { SalesGatewayModule } from './api/sales-gateway/sales-gateway.module';
import { BusinessGatewayModule } from './api/business-gateway/business-gateway.module';
import { UserGatewayModule } from './api/user-gateway/user-gateway.module';
import { PublicGatewayModule } from './api/public-gateway/public-gateway.module';

// App-level components
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // ===========================================================================
    // CONFIGURATION MODULE
    // ===========================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),

    // ===========================================================================
    // RATE LIMITING (ADR-003: Per-Gateway Rate Limits)
    // ===========================================================================
    // Default rate limits - can be overridden per-controller using @Throttle()
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const defaultLimit = config.get<number>('RATE_LIMIT_PER_MINUTE') || 100;

        const getGatewayLimit = (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          const path: string = request?.originalUrl || request?.url || '';

          const normalized = path.startsWith('/api/')
            ? path.slice(5)
            : path.replace(/^\//, '');

          if (normalized.startsWith('admin')) return 1000;
          if (normalized.startsWith('ops')) return 500;
          if (normalized.startsWith('marketing')) return 300;
          if (normalized.startsWith('sales')) return 300;
          if (normalized.startsWith('business')) return 200;
          if (normalized.startsWith('user')) return 100;
          if (normalized.startsWith('public')) return 50;

          return defaultLimit;
        };

        return {
          throttlers: [
            {
              name: 'short',
              ttl: 1, // 1 second
              limit: 3, // 3 requests per second (burst protection)
            },
            {
              name: 'medium',
              ttl: 10, // 10 seconds
              limit: 20, // 20 requests per 10 seconds
            },
            {
              name: 'long',
              ttl: 60, // 1 minute
              limit: getGatewayLimit,
            },
          ],
        };
      },
    }),

    // ===========================================================================
    // SCHEDULED TASKS
    // ===========================================================================
    ScheduleModule.forRoot(),

    // ===========================================================================
    // CORE MODULES (Foundation Layer)
    // ===========================================================================
    // Order matters: Database → Common → Events → Auth → Lookup
    DatabaseModule,
    CommonModule,
    EventsModule,
    AuthModule,
    LookupModule,

    // ===========================================================================
    // INFRASTRUCTURE MODULES (Cross-Cutting Services)
    // ===========================================================================
    CacheModule,
    StorageModule,
    SearchModule,
    JobsModule,
    NotificationsModule,
    WebsocketsModule,
    ResilienceModule,
    HealthModule, // Comprehensive health checks for all dependencies
    IdempotencyModule, // Request deduplication for mutations
    RateLimitingModule, // Distributed rate limiting with Redis

    // ===========================================================================
    // DOMAIN MODULES (Business Logic)
    // ===========================================================================
    CatalogModule,
    LeadsModule,
    MessagingModule,
    PlanningModule,
    OperationsModule,
    ContentModule,

    // ==========================================================================
    // ROUTER PREFIXES (Gateway Mounts)
    // ==========================================================================
    RouterModule.register([
      { path: 'admin', module: AdminGatewayModule },
      { path: 'ops', module: OpsGatewayModule },
      { path: 'marketing', module: MarketingGatewayModule },
      { path: 'sales', module: SalesGatewayModule },
      { path: 'business', module: BusinessGatewayModule },
      { path: 'user', module: UserGatewayModule },
      { path: 'public', module: PublicGatewayModule },
    ]),

    // ===========================================================================
    // API GATEWAY MODULES (Presentation Layer)
    // ===========================================================================
    // Each gateway has its own rate limits and authorization rules (ADR-003)
    AdminGatewayModule, // /api/admin/*     - 1000/min - ADMIN_SYSTEM
    OpsGatewayModule, // /api/ops/*       - 500/min  - OPERATIONAL_*
    MarketingGatewayModule, // /api/marketing/* - 300/min  - MARKETING_*
    SalesGatewayModule, // /api/sales/*     - 300/min  - SALES_MANAGER
    BusinessGatewayModule, // /api/business/*  - 200/min  - BUSINESS_ADMIN
    UserGatewayModule, // /api/user/*      - 100/min  - USER
    PublicGatewayModule, // /api/public/*    - 50/min   - Anonymous
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ===========================================================================
    // GLOBAL GUARDS
    // ===========================================================================
    // ThrottlerGuard is applied globally - use @SkipThrottle() to bypass
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Note: JwtAuthGuard and RolesGuard are applied per-gateway for flexibility
  ],
})
export class AppModule {}
