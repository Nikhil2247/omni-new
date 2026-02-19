// ============================================================================
// AUDIT TYPES - Type Definitions for Audit Module
// ============================================================================

/**
 * Audit log categories for organizing different types of events
 */
export enum AuditCategory {
  DATA_CHANGE = 'DATA_CHANGE', // Create, Update, Delete operations
  AUTHENTICATION = 'AUTHENTICATION', // Login, logout, password changes
  AUTHORIZATION = 'AUTHORIZATION', // Permission checks, role changes
  ACCESS = 'ACCESS', // Resource access, API calls
  SYSTEM = 'SYSTEM', // Configuration changes, deployments
  COMPLIANCE = 'COMPLIANCE', // GDPR requests, data exports
  SECURITY = 'SECURITY', // Security events, threat detection
}

/**
 * Severity levels for audit events
 */
export enum AuditSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Context information captured for each audit event
 */
export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRoles?: string[];
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  impersonatedBy?: string;
  requestId?: string;
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  category: AuditCategory;
  action: string;
  actionDetail?: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  changedFields?: string[];
  metadata?: Record<string, any>;
  severity?: AuditSeverity;
  duration?: number;
}

/**
 * Options for logging data changes
 */
export interface DataChangeOptions {
  oldValue?: any;
  newValue?: any;
  changedFields?: string[];
  metadata?: Record<string, any>;
}

/**
 * Options for logging security events
 */
export interface SecurityEventOptions {
  metadata?: Record<string, any>;
  riskScore?: number;
  severity?: AuditSeverity;
}

/**
 * Options for logging authentication events
 */
export interface AuthEventOptions {
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
  severity?: AuditSeverity;
}

/**
 * Query options for retrieving audit logs
 */
export interface AuditQueryOptions {
  userId?: string;
  entityType?: string;
  entityId?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  action?: string;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Paginated audit log response
 */
export interface PaginatedAuditLogs<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Metadata for @Audited decorator
 */
export interface AuditMetadata {
  action: string;
  entityType: string;
  getEntityId?: (request: any, response: any) => string;
  getOldValue?: (request: any) => any;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  severity?: AuditSeverity;
}

/**
 * Sensitive fields that should be sanitized in audit logs
 */
export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'accessToken',
  'apiKey',
  'secret',
  'secretKey',
  'privateKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'pan',
  'pin',
];

/**
 * Models that should be automatically audited via middleware
 */
export const AUDITED_MODELS = [
  'User',
  'VendorProfile',
  'Portfolio',
  'Service',
  'Lead',
  'Booking',
  'Payment',
  'Dispute',
  'Subscription',
  'KycVerification',
  'VendorAgreement',
];
