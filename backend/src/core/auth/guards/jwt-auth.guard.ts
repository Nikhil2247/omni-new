// ============================================================================
// JWT AUTH GUARD - Authentication Guard
// ============================================================================
// Protects routes requiring JWT authentication
// For public routes, still attempts to extract user if token is provided
// ============================================================================

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable, of, from, catchError } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, still try to authenticate but don't require it
      // This allows us to extract user info if a token is provided
      const result = super.canActivate(context);

      if (typeof result === 'boolean') {
        return true;
      }

      if (result instanceof Promise) {
        return result.catch(() => true);
      }

      // Observable
      return from(result).pipe(catchError(() => of(true)));
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, return user if available, otherwise return undefined
      // Don't throw errors - just allow the request to continue
      return user;
    }

    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
