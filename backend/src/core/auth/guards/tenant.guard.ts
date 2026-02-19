// ============================================================================
// TENANT GUARD - Multi-Tenancy Access Control Guard
// ============================================================================
// Ensures users can only access resources within their tenant (vendor profile)
// ============================================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const TENANT_KEY = 'tenantCheck';
export const TENANT_PARAM_KEY = 'tenantParam';

// Decorator to mark routes that need tenant validation
export const RequireTenant = (paramName = 'vendorProfileId') => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(TENANT_KEY, true, descriptor?.value || target);
    Reflect.defineMetadata(
      TENANT_PARAM_KEY,
      paramName,
      descriptor?.value || target,
    );
  };
};

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresTenant = this.reflector.getAllAndOverride<boolean>(
      TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If tenant check not required, allow access
    if (!requiresTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: No user found');
    }

    // System admins can access any tenant
    if (user.roles?.includes('ADMIN_SYSTEM')) {
      return true;
    }

    // Operations staff can access any tenant
    const opsRoles = [
      'OPERATIONAL_ADMIN',
      'OPERATIONAL_MANAGER',
      'OPERATIONAL_ASSISTANT',
    ];
    if (user.roles?.some((role: string) => opsRoles.includes(role))) {
      return true;
    }

    // Get the tenant ID parameter name
    const tenantParamName =
      this.reflector.get<string>(TENANT_PARAM_KEY, context.getHandler()) ||
      'vendorProfileId';

    // Get tenant ID from request params, query, or body
    const requestTenantId =
      request.params?.[tenantParamName] ||
      request.query?.[tenantParamName] ||
      request.body?.[tenantParamName];

    if (!requestTenantId) {
      // No tenant specified in request, allow if user has a tenant
      return !!user.tenantId;
    }

    // Verify user belongs to the requested tenant
    if (user.tenantId !== requestTenantId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own vendor profile',
      );
    }

    return true;
  }
}
