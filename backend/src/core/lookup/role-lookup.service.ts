// ============================================================================
// ROLE LOOKUP SERVICE - Cached Role Data
// ============================================================================
// Provides fast lookup for user roles with in-memory caching
// ============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface RoleLookup {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

// Pre-defined role names for type safety
export const ROLE_NAMES = {
  ADMIN_SYSTEM: 'ADMIN_SYSTEM',
  ADMIN: 'ADMIN',
  OPERATIONAL_ADMIN: 'OPERATIONAL_ADMIN',
  OPERATIONAL_MANAGER: 'OPERATIONAL_MANAGER',
  OPERATIONAL_ASSISTANT: 'OPERATIONAL_ASSISTANT',
  MARKETING_SERVICES_ADMIN: 'MARKETING_SERVICES_ADMIN',
  CONTENT_WRITER: 'CONTENT_WRITER',
  MULTI_MEDIA_MANAGER: 'MULTI_MEDIA_MANAGER',
  SALES_MANAGER: 'SALES_MANAGER',
  BUSINESS_ADMIN: 'BUSINESS_ADMIN',
  USER: 'USER',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

@Injectable()
export class RoleLookupService implements OnModuleInit {
  private readonly logger = new Logger(RoleLookupService.name);

  private roles: Map<string, RoleLookup> = new Map();
  private rolesByName: Map<string, RoleLookup> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadAllData();
  }

  private async loadAllData(): Promise<void> {
    this.logger.log('Loading role lookup data...');

    try {
      const roleRecords = await this.prisma.role.findMany({});

      this.roles.clear();
      this.rolesByName.clear();

      for (const role of roleRecords) {
        const lookup: RoleLookup = {
          id: role.id,
          name: role.name,
          description: role.description || undefined,
          permissions: [], // Permissions are not stored in the current schema
        };

        this.roles.set(role.id, lookup);
        this.rolesByName.set(role.name, lookup);
      }

      this.logger.log(`Loaded ${this.roles.size} roles`);
    } catch (error) {
      this.logger.error('Failed to load role lookup data', error);
    }
  }

  async refresh(): Promise<void> {
    await this.loadAllData();
  }

  // Lookups
  getAllRoles(): RoleLookup[] {
    return Array.from(this.roles.values());
  }

  getRoleById(id: string): RoleLookup | undefined {
    return this.roles.get(id);
  }

  getRoleByName(name: string): RoleLookup | undefined {
    return this.rolesByName.get(name);
  }

  getRoleIdByName(name: string): string | undefined {
    return this.rolesByName.get(name)?.id;
  }

  // Get multiple roles by IDs
  getRolesByIds(ids: string[]): RoleLookup[] {
    return ids
      .map((id) => this.roles.get(id))
      .filter((r): r is RoleLookup => r !== undefined);
  }

  // Permission checks
  getRolePermissions(roleId: string): string[] {
    return this.roles.get(roleId)?.permissions || [];
  }

  roleHasPermission(roleId: string, permission: string): boolean {
    const role = this.roles.get(roleId);
    return role?.permissions.includes(permission) || false;
  }

  // Get all permissions for multiple roles
  getPermissionsForRoles(roleNames: string[]): string[] {
    const permissions = new Set<string>();

    for (const roleName of roleNames) {
      const role = this.rolesByName.get(roleName);
      if (role) {
        role.permissions.forEach((p) => permissions.add(p));
      }
    }

    return Array.from(permissions);
  }

  // Validation
  isValidRole(id: string): boolean {
    return this.roles.has(id);
  }

  isValidRoleName(name: string): boolean {
    return this.rolesByName.has(name);
  }

  // Get roles by type
  getOperationalRoles(): RoleLookup[] {
    const operationalRoleNames = [
      ROLE_NAMES.OPERATIONAL_ADMIN,
      ROLE_NAMES.OPERATIONAL_MANAGER,
      ROLE_NAMES.OPERATIONAL_ASSISTANT,
    ];
    return operationalRoleNames
      .map((name) => this.rolesByName.get(name))
      .filter((r): r is RoleLookup => r !== undefined);
  }

  getMarketingRoles(): RoleLookup[] {
    const marketingRoleNames = [
      ROLE_NAMES.MARKETING_SERVICES_ADMIN,
      ROLE_NAMES.CONTENT_WRITER,
      ROLE_NAMES.MULTI_MEDIA_MANAGER,
    ];
    return marketingRoleNames
      .map((name) => this.rolesByName.get(name))
      .filter((r): r is RoleLookup => r !== undefined);
  }
}
