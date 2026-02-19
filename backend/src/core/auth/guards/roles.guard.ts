// ============================================================================
// ROLES GUARD - Role-Based Access Control Guard
// ============================================================================
// Enforces role-based access control on routes
// ============================================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Role hierarchy for inheritance
const ROLE_HIERARCHY: Record<string, string[]> = {
  ADMIN_SYSTEM: [
    'ADMIN_SYSTEM',
    'ADMIN',
    'OPERATIONAL_ADMIN',
    'OPERATIONAL_MANAGER',
    'OPERATIONAL_ASSISTANT',
    'MARKETING_SERVICES_ADMIN',
    'CONTENT_WRITER',
    'MULTI_MEDIA_MANAGER',
    'SALES_MANAGER',
  ],
  ADMIN: ['ADMIN'],
  OPERATIONAL_ADMIN: [
    'OPERATIONAL_ADMIN',
    'OPERATIONAL_MANAGER',
    'OPERATIONAL_ASSISTANT',
  ],
  OPERATIONAL_MANAGER: ['OPERATIONAL_MANAGER', 'OPERATIONAL_ASSISTANT'],
  OPERATIONAL_ASSISTANT: ['OPERATIONAL_ASSISTANT'],
  MARKETING_SERVICES_ADMIN: [
    'MARKETING_SERVICES_ADMIN',
    'CONTENT_WRITER',
    'MULTI_MEDIA_MANAGER',
  ],
  CONTENT_WRITER: ['CONTENT_WRITER'],
  MULTI_MEDIA_MANAGER: ['MULTI_MEDIA_MANAGER'],
  SALES_MANAGER: ['SALES_MANAGER'],
  BUSINESS_ADMIN: ['BUSINESS_ADMIN'],
  USER: ['USER'],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: No user found');
    }

    const userRoles = user.roles || [];

    // Check if user has any of the required roles (with hierarchy)
    const hasAccess = requiredRoles.some((requiredRole) =>
      this.userHasRole(userRoles, requiredRole),
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied: Required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }

  private userHasRole(userRoles: string[], requiredRole: string): boolean {
    // Check direct role match
    if (userRoles.includes(requiredRole)) {
      return true;
    }

    // Check role hierarchy - if user has a higher role that includes the required role
    for (const userRole of userRoles) {
      const inheritedRoles = ROLE_HIERARCHY[userRole] || [];
      if (inheritedRoles.includes(requiredRole)) {
        return true;
      }
    }

    return false;
  }
}
