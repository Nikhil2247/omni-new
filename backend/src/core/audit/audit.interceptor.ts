// ============================================================================
// AUDIT INTERCEPTOR - Automatic Audit Logging for Controllers
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { Reflector } from '@nestjs/core'
import { AuditService } from './audit.service'
import { AuditMetadata, AuditCategory, AuditSeverity } from './audit.types'

export const AUDIT_METADATA_KEY = 'audit:metadata'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const explicitMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    )

    const metadata = explicitMetadata || this.getDefaultMetadata(context)

    // If no audit metadata, just pass through
    if (!metadata) {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const startTime = Date.now()

    // Capture old value if getter is provided
    let oldValue: any = null
    if (metadata.getOldValue) {
      try {
        oldValue = metadata.getOldValue(request)
      } catch (e) {
        this.logger.debug(`Failed to get old value: ${e.message}`)
      }
    }

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime

        try {
          const entityId = metadata.getEntityId
            ? metadata.getEntityId(request, response)
            : request.params?.id || response?.id

          await this.auditService.log({
            category: AuditCategory.DATA_CHANGE,
            action: metadata.action,
            entityType: metadata.entityType,
            entityId,
            oldValue,
            newValue: metadata.includeResponseBody ? this.sanitizeResponse(response) : undefined,
            metadata: {
              method: request.method,
              path: request.path,
              duration,
              ...(metadata.includeRequestBody && { requestBody: this.sanitizeRequest(request.body) }),
            },
            severity: metadata.severity || AuditSeverity.INFO,
            duration,
          })
        } catch (error) {
          this.logger.error(`Audit logging failed: ${error.message}`)
        }
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime

        try {
          await this.auditService.log({
            category: AuditCategory.DATA_CHANGE,
            action: `${metadata.action}_FAILED`,
            entityType: metadata.entityType,
            entityId: request.params?.id,
            metadata: {
              method: request.method,
              path: request.path,
              duration,
              error: error.message,
              errorCode: error.status || error.code,
            },
            severity: AuditSeverity.ERROR,
            duration,
          })
        } catch (auditError) {
          this.logger.error(`Audit logging for error failed: ${auditError.message}`)
        }

        throw error
      }),
    )
  }

  private getDefaultMetadata(context: ExecutionContext): AuditMetadata | null {
    const request = context.switchToHttp().getRequest()
    const method = request?.method?.toUpperCase?.() || ''

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return null
    }

    const controllerName = context.getClass()?.name || 'Controller'
    const path = request?.path || request?.url || ''

    return {
      action: `${method} ${path}`,
      entityType: controllerName,
      includeRequestBody: true,
      includeResponseBody: false,
      severity: AuditSeverity.INFO,
    }
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeRequest(body: any): any {
    if (!body) return null

    const sanitized = { ...body }
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard']

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  /**
   * Sanitize response for logging
   */
  private sanitizeResponse(response: any): any {
    if (!response) return null

    // Don't log large arrays
    if (Array.isArray(response) && response.length > 10) {
      return { _type: 'array', _count: response.length }
    }

    // For paginated responses, just log metadata
    if (response.data && response.total !== undefined) {
      return {
        _type: 'paginated',
        _count: response.data?.length,
        _total: response.total,
      }
    }

    return response
  }
}
