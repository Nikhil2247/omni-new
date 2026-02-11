// ============================================================================
// READ/WRITE DECORATORS - Route Queries to Primary or Replica
// ============================================================================
// Use these decorators to explicitly route queries
// ============================================================================

import { SetMetadata } from '@nestjs/common'

export const DATABASE_MODE_KEY = 'databaseMode'

export type DatabaseMode = 'read' | 'write'

/**
 * Mark a method as read-only (will use replica if available)
 *
 * @example
 * ```typescript
 * @ReadOnly()
 * async findAllVendors(): Promise<VendorProfile[]> {
 *   return this.prismaReplica.replica.vendorProfile.findMany();
 * }
 * ```
 */
export const ReadOnly = (): MethodDecorator => {
  return SetMetadata(DATABASE_MODE_KEY, 'read')
}

/**
 * Mark a method as write operation (will use primary)
 *
 * @example
 * ```typescript
 * @WriteOperation()
 * async createVendor(data: CreateVendorDto): Promise<VendorProfile> {
 *   return this.prismaReplica.primary.vendorProfile.create({ data });
 * }
 * ```
 */
export const WriteOperation = (): MethodDecorator => {
  return SetMetadata(DATABASE_MODE_KEY, 'write')
}
