// ============================================================================
// REFRESH TOKEN STRATEGY - Passport Strategy for Refresh Tokens
// ============================================================================
// Validates refresh tokens for token rotation
// ============================================================================

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { RefreshTokenPayload } from '../token.service'

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret',
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: RefreshTokenPayload) {
    const refreshToken = req.get('Authorization')?.replace('Bearer ', '').trim()

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided')
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type')
    }

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
      refreshToken,
    }
  }
}
