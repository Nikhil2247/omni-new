// ============================================================================
// MAINTENANCE MODE INTERCEPTOR - Global Maintenance Enforcement
// ============================================================================
// Blocks non-admin access when maintenance mode is enabled
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MaintenanceModeInterceptor implements NestInterceptor {
  private cachedMode: boolean | null = null;
  private cacheExpiresAt = 0;
  private readonly cacheTtlMs = 10_000;

  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const path: string = request?.originalUrl || request?.url || '';

    const maintenanceMode = await this.getMaintenanceMode();
    if (!maintenanceMode) {
      return next.handle();
    }

    if (this.isAllowedPath(path)) {
      return next.handle();
    }

    const roles = request?.user?.roles || [];
    if (Array.isArray(roles) && roles.includes('ADMIN_SYSTEM')) {
      return next.handle();
    }

    throw new ServiceUnavailableException({
      message: 'System is in maintenance mode',
      maintenanceMode: true,
    });
  }

  private async getMaintenanceMode(): Promise<boolean> {
    const now = Date.now();
    if (this.cachedMode !== null && now < this.cacheExpiresAt) {
      return this.cachedMode;
    }

    const config = await this.prisma.systemConfig.findFirst({
      select: { maintenanceMode: true },
    });

    this.cachedMode = config?.maintenanceMode ?? false;
    this.cacheExpiresAt = now + this.cacheTtlMs;
    return this.cachedMode;
  }

  private isAllowedPath(path: string): boolean {
    const normalized = path.split('?')[0];

    if (
      normalized === '/health' ||
      normalized === '/ready' ||
      normalized === '/docs'
    ) {
      return true;
    }

    if (normalized.startsWith('/api/admin')) {
      return true;
    }

    if (normalized.startsWith('/api/auth')) {
      return true;
    }

    if (normalized === '/api/public/health') {
      return true;
    }

    if (normalized === '/api/public/system/status') {
      return true;
    }

    return false;
  }
}
