// ============================================================================
// PUBLIC DECORATOR - Mark Routes as Public
// ============================================================================
// Decorator to bypass authentication for specific routes
// ============================================================================

import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

// Mark a route as public (no authentication required)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

// Alias for semantic clarity
export const SkipAuth = () => Public()
