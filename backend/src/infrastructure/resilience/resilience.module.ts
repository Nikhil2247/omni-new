// ============================================================================
// RESILIENCE MODULE - Fault Tolerance Patterns
// ============================================================================
// Provides circuit breaker, retry, and timeout services
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { TimeoutInterceptor, TimeoutService } from './timeout.interceptor';

@Global()
@Module({
  providers: [
    CircuitBreakerService,
    RetryService,
    TimeoutService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => {
        return new TimeoutInterceptor(reflector, 30000);
      },
      inject: [Reflector],
    },
  ],
  exports: [CircuitBreakerService, RetryService, TimeoutService],
})
export class ResilienceModule {}
