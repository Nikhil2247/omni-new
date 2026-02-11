// ============================================================================
// AUDIT DECORATORS - Declarative Audit Logging
// ============================================================================

import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common'
import { AuditInterceptor, AUDIT_METADATA_KEY } from './audit.interceptor'
import { AuditMetadata, AuditSeverity } from './audit.types'

/**
 * Mark a controller method for automatic audit logging
 *
 * @example
 * @Post()
 * @Audited({
 *   action: 'CREATE',
 *   entityType: 'User',
 *   getEntityId: (req, res) => res.id,
 * })
 * async createUser(@Body() dto: CreateUserDto) { ... }
 */
export const Audited = (metadata: AuditMetadata) => {
  return applyDecorators(
    SetMetadata(AUDIT_METADATA_KEY, metadata),
    UseInterceptors(AuditInterceptor),
  )
}

/**
 * Shorthand for auditing create operations
 */
export const AuditCreate = (entityType: string) => {
  return Audited({
    action: 'CREATE',
    entityType,
    getEntityId: (req, res) => res?.id,
    includeResponseBody: true,
  })
}

/**
 * Shorthand for auditing update operations
 */
export const AuditUpdate = (entityType: string) => {
  return Audited({
    action: 'UPDATE',
    entityType,
    getEntityId: (req) => req.params?.id,
    includeRequestBody: true,
  })
}

/**
 * Shorthand for auditing delete operations
 */
export const AuditDelete = (entityType: string) => {
  return Audited({
    action: 'DELETE',
    entityType,
    getEntityId: (req) => req.params?.id,
    severity: AuditSeverity.WARNING,
  })
}

/**
 * Shorthand for auditing read/access operations
 */
export const AuditRead = (entityType: string) => {
  return Audited({
    action: 'READ',
    entityType,
    getEntityId: (req) => req.params?.id,
    severity: AuditSeverity.DEBUG,
  })
}

/**
 * Shorthand for auditing sensitive operations
 */
export const AuditSensitive = (action: string, entityType: string) => {
  return Audited({
    action,
    entityType,
    getEntityId: (req) => req.params?.id,
    includeRequestBody: true,
    severity: AuditSeverity.WARNING,
  })
}

/**
 * Shorthand for auditing critical operations
 */
export const AuditCritical = (action: string, entityType: string) => {
  return Audited({
    action,
    entityType,
    getEntityId: (req) => req.params?.id,
    includeRequestBody: true,
    includeResponseBody: true,
    severity: AuditSeverity.CRITICAL,
  })
}
