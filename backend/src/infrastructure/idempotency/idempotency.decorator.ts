// ============================================================================
// IDEMPOTENCY DECORATOR - Mark Endpoints as Idempotent
// ============================================================================
// Use @Idempotent() decorator on POST/PUT/PATCH endpoints to enable
// automatic request deduplication
// ============================================================================

import { SetMetadata } from '@nestjs/common';
import { IdempotencyOptions } from './idempotency.service';

export const IDEMPOTENT_KEY = 'idempotent';

/**
 * Mark an endpoint as idempotent.
 * Requests with the same X-Idempotency-Key header will return cached results.
 *
 * @param options - Optional configuration for idempotency behavior
 *
 * @example
 * ```typescript
 * @Post()
 * @Idempotent({ ttl: 3600 }) // Cache results for 1 hour
 * async createPayment(@Body() dto: CreatePaymentDto) {
 *   return this.paymentService.create(dto);
 * }
 * ```
 */
export const Idempotent = (
  options: IdempotencyOptions = {},
): MethodDecorator => {
  return SetMetadata(IDEMPOTENT_KEY, {
    ttl: options.ttl ?? 86400,
    prefix: options.prefix ?? 'idempotency',
    lockTtl: options.lockTtl ?? 60,
  });
};
