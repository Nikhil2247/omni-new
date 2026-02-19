// ============================================================================
// RATE LIMITING MODULE - Distributed Rate Limiting with Redis
// ============================================================================
// Provides Redis-backed rate limiting for horizontal scaling
// Supports sliding window algorithm for accurate rate limiting
// ============================================================================

import { Module, Global } from '@nestjs/common';
import { RateLimitingService } from './rate-limiting.service';
import { RateLimitingGuard } from './rate-limiting.guard';

@Global()
@Module({
  providers: [RateLimitingService, RateLimitingGuard],
  exports: [RateLimitingService, RateLimitingGuard],
})
export class RateLimitingModule {}
