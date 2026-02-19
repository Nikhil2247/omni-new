// ============================================================================
// IDEMPOTENCY MODULE - Request Deduplication System
// ============================================================================
// Prevents duplicate processing of mutating requests using idempotency keys
// Stores results in Redis/Dragonfly for fast lookup
// ============================================================================

import { Module, Global } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyInterceptor } from './idempotency.interceptor';

@Global()
@Module({
  providers: [IdempotencyService, IdempotencyInterceptor],
  exports: [IdempotencyService, IdempotencyInterceptor],
})
export class IdempotencyModule {}
