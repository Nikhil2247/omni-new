// ============================================================================
// EMAIL VERIFIED GUARD - Ensure User Has Verified Email
// ============================================================================
// Protects routes that require verified email addresses
// Skips check for Google OAuth users (already verified by Google)
// ============================================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const SKIP_EMAIL_VERIFICATION = 'skipEmailVerification';

/**
 * Decorator to skip email verification check on specific routes
 */
export const SkipEmailVerification = () =>
  Reflect.metadata(SKIP_EMAIL_VERIFICATION, true);

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route has @SkipEmailVerification() decorator
    const skipVerification = this.reflector.getAllAndOverride<boolean>(
      SKIP_EMAIL_VERIFICATION,
      [context.getHandler(), context.getClass()],
    );

    if (skipVerification) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // User not authenticated (should be caught by JwtAuthGuard first)
      return false;
    }

    // Skip verification for Google OAuth users (Google already verified them)
    if (user.emailVerified || user.loginMethod === 'SOCIAL_GOOGLE') {
      return true;
    }

    throw new ForbiddenException({
      statusCode: 403,
      message: 'Please verify your email address to continue',
      error: 'EmailNotVerified',
      action: 'resend_verification',
    });
  }
}
