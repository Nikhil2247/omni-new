// ============================================================================
// API KEY STRATEGY - Passport Strategy for API Key Authentication
// ============================================================================
// Validates API keys for service-to-service or public API access
// ============================================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Request } from 'express';
import { AuthService } from '../auth.service';

// Custom strategy for API key authentication
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'apiKey',
      passwordField: 'apiKey',
      passReqToCallback: true,
    });
  }

  async validate(req: Request): Promise<any> {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      throw new UnauthorizedException('API key not provided');
    }

    const user = await this.authService.validateApiKey(apiKey);

    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    return user;
  }

  private extractApiKey(req: Request): string | null {
    // Check X-API-Key header first
    const headerKey = req.headers['x-api-key'];
    if (headerKey && typeof headerKey === 'string') {
      return headerKey;
    }

    // Check Authorization header with ApiKey scheme
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }

    // Check query parameter (for webhooks etc.)
    const queryKey = req.query.api_key;
    if (queryKey && typeof queryKey === 'string') {
      return queryKey;
    }

    return null;
  }
}
