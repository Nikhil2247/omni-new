// ============================================================================
// AUDIT MODULE - Core Audit Logging Module
// ============================================================================
// Provides comprehensive audit logging capabilities across the application
// Can be imported in any module that needs audit functionality
// ============================================================================

import { Module, Global } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { AuditService } from './audit.service'
import { AuditQueryService } from './audit-query.service'
import { AuditInterceptor } from './audit.interceptor'

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    AuditService,
    AuditQueryService,
    AuditInterceptor,
  ],
  exports: [
    AuditService,
    AuditQueryService,
    AuditInterceptor,
  ],
})
export class AuditModule {}
