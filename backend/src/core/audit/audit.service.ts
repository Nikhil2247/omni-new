// ============================================================================
// AUDIT SERVICE - Core Audit Logging Service
// ============================================================================
// Provides comprehensive audit logging for all system activities
// ============================================================================

import { Injectable, Scope, Inject, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';
import {
  AuditContext,
  AuditLogEntry,
  AuditCategory,
  AuditSeverity,
  DataChangeOptions,
  SecurityEventOptions,
  AuthEventOptions,
  SENSITIVE_FIELDS,
} from './audit.types';

@Injectable({ scope: Scope.REQUEST })
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private context: AuditContext = {};

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.initializeContext();
  }

  /**
   * Initialize audit context from request
   */
  private initializeContext(): void {
    if (!this.request) return;

    const user = (this.request as any).user;

    this.context = {
      userId: user?.id || user?.sub,
      userEmail: user?.email,
      userRoles: user?.roles,
      sessionId: (this.request as any).sessionId,
      ipAddress: this.getClientIp(),
      userAgent: this.request.headers['user-agent'],
      requestId:
        (this.request as any).id ||
        (this.request.headers['x-request-id'] as string),
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(): string | undefined {
    const forwarded = this.request?.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return this.request?.ip || this.request?.socket?.remoteAddress;
  }

  /**
   * Set context manually (useful for background jobs)
   */
  setContext(context: Partial<AuditContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const entityId = this.resolveEntityId(entry);
      if (!entityId) {
        this.logger.debug(
          `Skipping audit log: missing/invalid entityId for ${entry.category}:${entry.action}`,
        );
        return;
      }

      const auditLog = await this.prisma.auditLog.create({
        data: {
          userId: this.isValidUuid(this.context.userId)
            ? this.context.userId
            : undefined,
          action: `${entry.category}:${entry.action}`,
          entityType: entry.entityType,
          entityId,
          oldValue: entry.oldValue
            ? this.sanitizeSensitiveData(entry.oldValue)
            : undefined,
          newValue: entry.newValue
            ? this.sanitizeSensitiveData(entry.newValue)
            : undefined,
          ipAddress: this.context.ipAddress,
          userAgent: this.context.userAgent,
        },
      });

      // Emit event for real-time monitoring
      this.eventEmitter.emit('audit.logged', {
        ...auditLog,
        category: entry.category,
        severity: entry.severity || AuditSeverity.INFO,
        metadata: entry.metadata,
        context: this.context,
      });

      // Check for security concerns
      if (
        entry.severity === AuditSeverity.CRITICAL ||
        entry.severity === AuditSeverity.ERROR
      ) {
        this.eventEmitter.emit('audit.security_concern', {
          ...auditLog,
          severity: entry.severity,
          metadata: entry.metadata,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
      // Don't throw - audit failures shouldn't break the main operation
    }
  }

  /**
   * Log a data change event (create, update, delete)
   */
  async logDataChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
    entityType: string,
    entityId: string,
    options: DataChangeOptions = {},
  ): Promise<void> {
    // Detect changed fields for updates
    let changedFields = options.changedFields;
    if (!changedFields && options.oldValue && options.newValue) {
      changedFields = this.detectChangedFields(
        options.oldValue,
        options.newValue,
      );
    }

    await this.log({
      category: AuditCategory.DATA_CHANGE,
      action,
      entityType,
      entityId,
      oldValue: options.oldValue,
      newValue: options.newValue,
      changedFields,
      metadata: options.metadata,
      severity: AuditSeverity.INFO,
    });
  }

  /**
   * Log an authentication event
   */
  async logAuth(
    action:
      | 'LOGIN'
      | 'LOGOUT'
      | 'LOGIN_FAILED'
      | 'PASSWORD_RESET'
      | 'PASSWORD_CHANGED'
      | 'MFA_ENABLED'
      | 'MFA_DISABLED'
      | 'TOKEN_REFRESH',
    options: AuthEventOptions = {},
  ): Promise<void> {
    await this.log({
      category: AuditCategory.AUTHENTICATION,
      action,
      entityType: 'User',
      entityId: options.userId || this.context.userId,
      metadata: {
        ...options.metadata,
        userEmail: options.userEmail || this.context.userEmail,
      },
      severity:
        options.severity ||
        (action.includes('FAILED')
          ? AuditSeverity.WARNING
          : AuditSeverity.INFO),
    });
  }

  /**
   * Log a security event
   */
  async logSecurity(
    action: string,
    description: string,
    options: SecurityEventOptions = {},
  ): Promise<void> {
    await this.log({
      category: AuditCategory.SECURITY,
      action,
      actionDetail: description,
      entityType: 'Security',
      entityId: this.context.userId,
      metadata: {
        ...options.metadata,
        riskScore: options.riskScore,
        description,
      },
      severity: options.severity || AuditSeverity.WARNING,
    });
  }

  /**
   * Log an access event
   */
  async logAccess(
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      category: AuditCategory.ACCESS,
      action,
      entityType,
      entityId,
      metadata,
      severity: AuditSeverity.DEBUG,
    });
  }

  /**
   * Log an authorization event
   */
  async logAuthorization(
    action:
      | 'PERMISSION_GRANTED'
      | 'PERMISSION_DENIED'
      | 'ROLE_ASSIGNED'
      | 'ROLE_REMOVED',
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      category: AuditCategory.AUTHORIZATION,
      action,
      entityType,
      entityId,
      metadata,
      severity:
        action === 'PERMISSION_DENIED'
          ? AuditSeverity.WARNING
          : AuditSeverity.INFO,
    });
  }

  /**
   * Log a system event
   */
  async logSystem(
    action: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      category: AuditCategory.SYSTEM,
      action,
      actionDetail: description,
      entityType: 'System',
      metadata,
      severity: AuditSeverity.INFO,
    });
  }

  /**
   * Log a compliance event
   */
  async logCompliance(
    action:
      | 'DATA_EXPORT'
      | 'DATA_DELETION'
      | 'CONSENT_GIVEN'
      | 'CONSENT_WITHDRAWN'
      | 'GDPR_REQUEST',
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      category: AuditCategory.COMPLIANCE,
      action,
      entityType,
      entityId,
      metadata,
      severity: AuditSeverity.INFO,
    });
  }

  /**
   * Detect which fields changed between old and new values
   */
  private detectChangedFields(oldValue: any, newValue: any): string[] {
    if (!oldValue || !newValue) return [];

    const changedFields: string[] = [];
    const allKeys = new Set([
      ...Object.keys(oldValue),
      ...Object.keys(newValue),
    ]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Remove sensitive fields from audit data
   */
  private sanitizeSensitiveData(data: any): any {
    if (!data) return data;

    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeSensitiveData(item));
    }

    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();

      // Check if field name matches sensitive patterns
      if (
        SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null
      ) {
        sanitized[key] = this.sanitizeSensitiveData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Resolve a valid entityId for audit log entries
   */
  private resolveEntityId(entry: AuditLogEntry): string | null {
    const candidate = entry.entityId || this.context.userId;
    return this.isValidUuid(candidate) ? candidate! : null;
  }

  /**
   * Validate UUID format (v1-v5)
   */
  private isValidUuid(value?: string): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  /**
   * Get current audit context
   */
  getContext(): AuditContext {
    return { ...this.context };
  }
}
