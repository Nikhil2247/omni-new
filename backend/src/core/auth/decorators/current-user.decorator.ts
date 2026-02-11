// ============================================================================
// CURRENT USER DECORATOR - Extract User from Request
// ============================================================================
// Parameter decorator to easily access the authenticated user
// ============================================================================

import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface CurrentUserData {
  id: string
  email: string
  roles: string[]
  tenantId?: string
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as CurrentUserData

    if (!user) {
      return null
    }

    // If specific property requested, return just that property
    if (data) {
      return user[data]
    }

    return user
  },
)

// Shorthand decorators for common user properties
export const UserId = () => CurrentUser('id')
export const UserEmail = () => CurrentUser('email')
export const UserRoles = () => CurrentUser('roles')
export const TenantId = () => CurrentUser('tenantId')
