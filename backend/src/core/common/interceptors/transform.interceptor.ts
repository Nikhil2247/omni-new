// ============================================================================
// TRANSFORM INTERCEPTOR - Response Transformation
// ============================================================================
// Wraps all responses in a consistent API response format
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Reflector } from '@nestjs/core'

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    timestamp: string
    requestId?: string
    [key: string]: any
  }
}

export const SKIP_TRANSFORM_KEY = 'skipTransform'

// Decorator to skip transformation for specific endpoints
export const SkipTransform = () => (
  target: any,
  propertyKey?: string,
  descriptor?: PropertyDescriptor,
) => {
  Reflect.defineMetadata(SKIP_TRANSFORM_KEY, true, descriptor?.value || target)
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // Check if transformation should be skipped
    const skipTransform = this.reflector.get<boolean>(
      SKIP_TRANSFORM_KEY,
      context.getHandler(),
    )

    if (skipTransform) {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const requestId = request.headers['x-request-id']

    return next.handle().pipe(
      map((data) => {
        // If data already has success property, don't wrap again
        if (data && typeof data === 'object' && 'success' in data) {
          return data
        }

        // Handle paginated responses
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            success: true,
            data: data.data,
            meta: {
              ...data.meta,
              timestamp: new Date().toISOString(),
              ...(requestId && { requestId }),
            },
          }
        }

        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            ...(requestId && { requestId }),
          },
        }
      }),
    )
  }
}
