// ============================================================================
// AUTH MODULE - Authentication & Authorization Module
// ============================================================================
// Provides authentication services, strategies, guards, and decorators
// Includes 2FA, login activity tracking, and email verification
// ============================================================================

import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { LoginActivityService } from './login-activity.service';
import { EmailVerificationService } from './email-verification.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { EmailVerifiedGuard } from './guards/email-verified.guard';

// Scheduled Tasks
import { SessionCleanupTask } from './tasks/session-cleanup.task';
import { AuditService } from '../audit';
import { CacheModule } from '../../infrastructure/cache/cache.module';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule,
  ],
  controllers: [AuthController],
  providers: [
    // Core Services
    AuthService,
    AuditService,
    TokenService,
    TwoFactorService,
    LoginActivityService,
    EmailVerificationService,

    // Passport Strategies
    JwtStrategy,
    RefreshTokenStrategy,
    ApiKeyStrategy,

    // Guards
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    EmailVerifiedGuard,

    // Scheduled Tasks
    SessionCleanupTask,
  ],
  exports: [
    // Services
    AuthService,
    TokenService,
    TwoFactorService,
    LoginActivityService,
    EmailVerificationService,

    // Guards
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    EmailVerifiedGuard,

    // Modules
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
