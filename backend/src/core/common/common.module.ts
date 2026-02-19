// ============================================================================
// COMMON MODULE - Shared Infrastructure Components
// ============================================================================
// Provides filters, interceptors, pipes, and utilities globally
// ============================================================================

import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './filters/http-exception.filter';
import {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
  PrismaInitializationExceptionFilter,
} from './filters/prisma-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { MaintenanceModeInterceptor } from './interceptors/maintenance-mode.interceptor';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { CustomValidationPipe } from './pipes/validation.pipe';
import { IdempotencyGuard } from './decorators/idempotent.decorator';

@Global()
@Module({
  providers: [
    // Global exception filters (order matters - most specific first)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaValidationExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaInitializationExceptionFilter,
    },
    // Global interceptors (order matters - executed in reverse order)
    {
      provide: APP_INTERCEPTOR,
      useClass: MaintenanceModeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global validation pipe
    {
      provide: APP_PIPE,
      useFactory: () =>
        new CustomValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          disableErrorMessages: false,
          skipMissingProperties: false,
        }),
    },
    // Guards
    IdempotencyGuard,
    // Interceptors as providers (for manual injection)
    CacheInterceptor,
  ],
  exports: [IdempotencyGuard, CacheInterceptor],
})
export class CommonModule {}
