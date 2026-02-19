// ============================================================================
// AUTH CONTROLLER - Authentication Endpoints
// ============================================================================
// Exposes login, register, token refresh, password reset, and email verification
// ============================================================================

import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  TwoFactorLoginDto,
  RefreshTokenDto,
  LogoutDto,
  GoogleLoginDto,
} from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/password.dto';
import {
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/email-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { UserId } from './decorators/current-user.decorator';
import { EmailVerificationService } from './email-verification.service';
import { Audited } from '../audit/audit.decorators';
import { AuditSeverity } from '../audit/audit.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('login')
  @Public()
  @Audited({
    action: 'LOGIN',
    entityType: 'User',
    getEntityId: (_req, res) => res?.user?.id,
    includeRequestBody: false,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const context = this.buildContext(req);
    const result = await this.authService.login(
      dto.email,
      dto.password,
      context,
    );

    return {
      success: true,
      requiresTwoFactor: !!result.requiresTwoFactor,
      tokens: result.tokens,
      user: result.user,
    };
  }

  @Post('google')
  @Public()
  @Audited({
    action: 'LOGIN_SOCIAL_GOOGLE',
    entityType: 'User',
    getEntityId: (_req, res) => res?.user?.id,
    includeRequestBody: false,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  async loginWithGoogle(@Body() dto: GoogleLoginDto, @Req() req: Request) {
    const context = this.buildContext(req);
    const result = await this.authService.loginWithGoogleIdToken(
      dto.idToken,
      context,
      dto.accountType,
    );

    return {
      success: true,
      requiresTwoFactor: !!result.requiresTwoFactor,
      tokens: result.tokens,
      user: result.user,
    };
  }

  @Post('2fa/verify')
  @Public()
  @Audited({
    action: 'MFA_VERIFY',
    entityType: 'User',
    getEntityId: (_req, res) => res?.user?.id,
    includeRequestBody: false,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  async verifyTwoFactor(@Body() dto: TwoFactorLoginDto, @Req() req: Request) {
    const context = this.buildContext(req);
    const result = await this.authService.verifyTwoFactorAndLogin(
      dto.tempToken,
      dto.code,
      context,
    );

    return {
      success: true,
      requiresTwoFactor: false,
      tokens: result.tokens,
      user: result.user,
    };
  }

  @Post('register')
  @Public()
  @Audited({
    action: 'REGISTER',
    entityType: 'User',
    getEntityId: (_req, res) => res?.userId,
    includeRequestBody: true,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);

    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
      userId: result.user.id,
      email: result.user.email,
    };
  }

  @Post('refresh')
  @Public()
  @Audited({
    action: 'TOKEN_REFRESH',
    entityType: 'UserSession',
    includeRequestBody: false,
    includeResponseBody: false,
    severity: AuditSeverity.DEBUG,
  })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const context = this.buildContext(req);
    const tokens = await this.authService.refreshTokens(
      dto.refreshToken,
      context,
    );

    return {
      success: true,
      requiresTwoFactor: false,
      tokens,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @Audited({
    action: 'LOGOUT',
    entityType: 'User',
    getEntityId: (req) => req.user?.id || req.user?.sub,
    includeRequestBody: true,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  async logout(@Body() dto: LogoutDto, @UserId() userId: string) {
    if (dto?.allDevices) {
      await this.authService.logoutAllDevices(userId);
    } else {
      await this.authService.logout(userId, dto?.sessionId);
    }

    return { success: true };
  }

  @Post('password/forgot')
  @Public()
  @Audited({
    action: 'PASSWORD_RESET_REQUEST',
    entityType: 'User',
    getEntityId: (req) => req.body?.email,
    includeRequestBody: true,
    includeResponseBody: false,
    severity: AuditSeverity.WARNING,
  })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    };
  }

  @Post('password/reset')
  @Public()
  @Audited({
    action: 'PASSWORD_RESET',
    entityType: 'User',
    includeRequestBody: true,
    includeResponseBody: false,
    severity: AuditSeverity.WARNING,
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { success: true, message: 'Password reset successful.' };
  }

  @Post('email/verify')
  @Public()
  @Audited({
    action: 'EMAIL_VERIFY',
    entityType: 'User',
    includeRequestBody: true,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.emailVerificationService.verifyEmail(dto.token);
    return {
      success: true,
      message: 'Email verified successfully.',
      email: result.email,
    };
  }

  @Post('email/resend')
  @Public()
  @Audited({
    action: 'EMAIL_VERIFICATION_RESEND',
    entityType: 'User',
    getEntityId: (req) => req.body?.email,
    includeRequestBody: true,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.emailVerificationService.resendVerificationEmail(dto.email);
    return {
      success: true,
      message: 'If the email exists, a verification link has been sent.',
    };
  }

  @Get('email/status')
  @UseGuards(JwtAuthGuard)
  async getEmailStatus(@UserId() userId: string) {
    return this.emailVerificationService.getVerificationStatus(userId);
  }

  private buildContext(req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim() || req.ip || 'unknown';

    return {
      ipAddress,
      userAgent: req.headers['user-agent'],
    };
  }
}
