// ============================================================================
// AUTH SERVICE - Authentication & Authorization
// ============================================================================
// Handles user authentication, password management, 2FA, and session management
// Integrates with TwoFactorService, LoginActivityService, EmailVerificationService
// ============================================================================

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LoginMethod } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { PrismaService } from '../database/prisma.service'
import { TokenService, TokenPayload, TokenPair } from './token.service'
import { TwoFactorService } from './two-factor.service'
import { LoginActivityService, DeviceInfo, GeoLocation } from './login-activity.service'
import { EmailVerificationService } from './email-verification.service'
import { RoleLookupService, ROLE_NAMES } from '../lookup/role-lookup.service'

export interface AuthUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  roles: string[]
  tenantId?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  hasCompletedOnboarding: boolean
}

export interface LoginResult {
  user: AuthUser
  tokens: TokenPair
  requiresTwoFactor?: boolean
}

export interface LoginContext {
  ipAddress: string
  userAgent?: string
  deviceInfo?: DeviceInfo
  geoLocation?: GeoLocation
}

export interface TwoFactorLoginResult {
  user: AuthUser
  tokens: TokenPair
}

export interface RegisterUserInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  accountType?: 'USER' | 'VENDOR'
}

export interface RegisterResult {
  user: AuthUser
  verificationToken: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly SALT_ROUNDS = 12
  private readonly MAX_LOGIN_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
  private readonly maintenanceCacheTtlMs = 10_000
  private maintenanceCache: { enabled: boolean; expiresAt: number } | null = null

  // Temporary store for pending 2FA verification (use Redis in production)
  private readonly pending2FALogins = new Map<
    string,
    { userId: string; expiresAt: number; context: LoginContext }
  >()

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly loginActivityService: LoginActivityService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly roleLookupService: RoleLookupService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Register a new user
   */
  async register(input: RegisterUserInput): Promise<RegisterResult> {
    await this.enforceMaintenanceAccess()
    const normalizedEmail = input.email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      throw new BadRequestException('Email is already registered')
    }

    // Validate password strength
    this.validatePasswordStrength(input.password)

    // Hash password
    const passwordHash = await this.hashPassword(input.password)

    const accountType = input.accountType === 'VENDOR' ? 'VENDOR' : 'USER'
    const roleName = accountType === 'VENDOR' ? ROLE_NAMES.BUSINESS_ADMIN : ROLE_NAMES.USER
    const roleId = this.roleLookupService.getRoleIdByName(roleName)

    if (!roleId) {
      this.logger.error(`Role lookup failed for registration role: ${roleName}`)
      throw new ServiceUnavailableException('Registration is temporarily unavailable')
    }

    // Create user with role assignment
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: 'PENDING', // Will be activated after email verification
        userRoles: {
          create: {
            roleId,
          },
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    })

    // Generate email verification token
    const verificationToken =
      await this.emailVerificationService.generateVerificationToken(user.id)

    // Emit registration event
    this.eventEmitter.emit('user.registered', {
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    })

    this.logger.log(`New user registered: ${user.email}`)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        roles: user.userRoles.map((ur) => ur.role.name),
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
      verificationToken,
    }
  }

  /**
   * Validate user credentials (step 1 of login)
   */
  async validateUser(
    email: string,
    password: string,
    context: LoginContext,
  ): Promise<AuthUser> {
    const normalizedEmail = email.toLowerCase().trim()

    // Check if IP is blocked due to too many failed attempts
    const isIPBlocked = await this.loginActivityService.isIPBlocked(
      context.ipAddress,
    )
    if (isIPBlocked) {
      await this.recordFailedLogin(normalizedEmail, null, 'ip_blocked', context)
      throw new UnauthorizedException(
        'Too many failed attempts. Please try again later.',
      )
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        userRoles: {
          include: { role: true },
        },
        vendorProfile: {
          select: { id: true },
        },
      },
    })

    if (!user) {
      await this.recordFailedLogin(
        normalizedEmail,
        null,
        'user_not_found',
        context,
      )
      throw new UnauthorizedException('Invalid credentials')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      )
      await this.recordFailedLogin(
        normalizedEmail,
        user.id,
        'account_locked',
        context,
      )
      throw new UnauthorizedException(
        `Account temporarily locked. Try again in ${remainingMinutes} minutes`,
      )
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      await this.recordFailedLogin(
        normalizedEmail,
        user.id,
        'account_suspended',
        context,
      )
      throw new UnauthorizedException('Account is suspended')
    }

    if (user.status === 'DELETED') {
      await this.recordFailedLogin(
        normalizedEmail,
        user.id,
        'account_deleted',
        context,
      )
      throw new UnauthorizedException('Account not found')
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, normalizedEmail, context)
      throw new UnauthorizedException('Invalid credentials')
    }

    // Reset failed attempts on successful password validation
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: user.userRoles.map((ur) => ur.role.name),
      tenantId: user.vendorProfile?.id,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    }
  }

  /**
   * Complete login process (handles both normal and 2FA login)
   */
  async login(
    email: string,
    password: string,
    context: LoginContext,
  ): Promise<LoginResult> {
    const user = await this.validateUser(email, password, context)

    await this.enforceMaintenanceAccess(user.roles)

    // Check if email is verified (optional - can be configurable)
    if (!user.emailVerified && user.status === 'PENDING') {
      throw new ForbiddenException(
        'Please verify your email address before logging in',
      )
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate temporary token for 2FA verification
      const tempToken = this.generateTemporary2FAToken()

      // Store pending 2FA login (expires in 5 minutes)
      this.pending2FALogins.set(tempToken, {
        userId: user.id,
        expiresAt: Date.now() + 5 * 60 * 1000,
        context,
      })

      return {
        user,
        tokens: {
          accessToken: tempToken, // Temporary token for 2FA completion
          refreshToken: '',
          expiresIn: 300, // 5 minutes to complete 2FA
        },
        requiresTwoFactor: true,
      }
    }

    // No 2FA - complete login
    return this.completeLogin(user, context)
  }

  /**
   * Complete 2FA verification and issue tokens
   */
  async verifyTwoFactorAndLogin(
    tempToken: string,
    code: string,
    context: LoginContext,
  ): Promise<TwoFactorLoginResult> {
    const pending = this.pending2FALogins.get(tempToken)

    if (!pending || pending.expiresAt < Date.now()) {
      this.pending2FALogins.delete(tempToken)
      throw new UnauthorizedException('Two-factor session expired')
    }

    // Verify 2FA code
    const result = await this.twoFactorService.verifyTwoFactorCode(
      pending.userId,
      code,
    )

    if (!result.success) {
      await this.recordFailedLogin(
        '',
        pending.userId,
        '2fa_failed',
        context,
        LoginMethod.TWO_FACTOR,
      )
      throw new UnauthorizedException('Invalid two-factor code')
    }

    // Clean up pending login
    this.pending2FALogins.delete(tempToken)

    // Get user for token generation
    const user = await this.getUserById(pending.userId)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    await this.enforceMaintenanceAccess(user.roles)

    // Complete login with 2FA context
    const loginResult = await this.completeLogin(user, context, {
      twoFactorUsed: true,
      twoFactorMethod: result.usedBackupCode ? 'backup_code' : 'totp',
    })

    return {
      user: loginResult.user,
      tokens: loginResult.tokens,
    }
  }

  /**
   * Complete login and issue tokens
   */
  private async completeLogin(
    user: AuthUser,
    context: LoginContext,
    twoFactorInfo?: { twoFactorUsed: boolean; twoFactorMethod: string },
  ): Promise<LoginResult> {
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      tenantId: user.tenantId,
    }

    const tokens = await this.tokenService.generateTokenPair(
      tokenPayload,
      context,
    )

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Record successful login
    await this.loginActivityService.recordLoginAttempt(
      {
        email: user.email,
        userId: user.id,
        success: true,
        loginMethod: twoFactorInfo?.twoFactorUsed
          ? LoginMethod.TWO_FACTOR
          : LoginMethod.EMAIL_PASSWORD,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        twoFactorUsed: twoFactorInfo?.twoFactorUsed,
        twoFactorMethod: twoFactorInfo?.twoFactorMethod,
      },
      context.deviceInfo,
      context.geoLocation,
    )

    // Emit login event
    this.eventEmitter.emit('user.loggedIn', {
      userId: user.id,
      email: user.email,
      ipAddress: context.ipAddress,
      timestamp: new Date(),
    })

    if (tokens.sessionId) {
      this.eventEmitter.emit('user.session.started', {
        userId: user.id,
        sessionId: tokens.sessionId,
        timestamp: new Date(),
      })
    }

    return { user, tokens }
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string, context: LoginContext): Promise<TokenPair> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken)
    const user = await this.getUserById(payload.sub)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    await this.enforceMaintenanceAccess(user.roles)

    const tokens = await this.tokenService.rotateRefreshToken(refreshToken, context)

    // Record token refresh
    await this.loginActivityService.recordLoginAttempt(
      {
        email: '',
        success: true,
        loginMethod: LoginMethod.REFRESH_TOKEN,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      context.deviceInfo,
      context.geoLocation,
    )

    return tokens
  }

  private async enforceMaintenanceAccess(roles?: string[]) {
    const isMaintenance = await this.isMaintenanceModeEnabled()

    if (!isMaintenance) {
      return
    }

    if (roles && roles.includes('ADMIN_SYSTEM')) {
      return
    }

    throw new ServiceUnavailableException('System is in maintenance mode')
  }

  private async isMaintenanceModeEnabled(): Promise<boolean> {
    const now = Date.now()
    if (this.maintenanceCache && now < this.maintenanceCache.expiresAt) {
      return this.maintenanceCache.enabled
    }

    const config = await this.prisma.systemConfig.findFirst({
      select: { maintenanceMode: true },
    })

    const enabled = config?.maintenanceMode ?? false
    this.maintenanceCache = {
      enabled,
      expiresAt: now + this.maintenanceCacheTtlMs,
    }

    return enabled
  }

  /**
   * Logout user
   */
  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.emitSessionEnded(userId, sessionId)
    } else {
      const sessions = await this.prisma.userSession.findMany({
        where: { userId, isRevoked: false },
      })
      for (const session of sessions) {
        await this.emitSessionEnded(userId, session.id, session.createdAt)
      }
    }

    if (sessionId) {
      await this.tokenService.invalidateSession(sessionId)
    } else {
      await this.tokenService.invalidateAllUserSessions(userId)
    }

    this.eventEmitter.emit('user.loggedOut', {
      userId,
      timestamp: new Date(),
    })
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId: string): Promise<void> {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, isRevoked: false },
    })
    for (const session of sessions) {
      await this.emitSessionEnded(userId, session.id, session.createdAt)
    }

    await this.tokenService.invalidateAllUserSessions(userId)

    this.eventEmitter.emit('user.loggedOutAllDevices', {
      userId,
      timestamp: new Date(),
    })
  }

  private async emitSessionEnded(userId: string, sessionId: string, startedAt?: Date): Promise<void> {
    const session = startedAt
      ? { createdAt: startedAt }
      : await this.prisma.userSession.findUnique({
          where: { id: sessionId },
          select: { createdAt: true },
        })

    if (!session) return

    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - session.createdAt.getTime()) / 1000),
    )

    this.eventEmitter.emit('user.session.ended', {
      userId,
      sessionId,
      durationSeconds,
      timestamp: new Date(),
    })
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  /**
   * Compare passwords
   */
  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    const minLength = 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const errors: string[] = []

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`)
    }
    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!hasNumber) {
      errors.push('Password must contain at least one number')
    }
    if (!hasSpecial) {
      errors.push('Password must contain at least one special character')
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors)
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new BadRequestException('User not found')
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    )

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect')
    }

    // Validate new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash)
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      )
    }

    // Validate password strength
    this.validatePasswordStrength(newPassword)

    const newPasswordHash = await this.hashPassword(newPassword)

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
      },
    })

    // Invalidate all sessions to force re-login
    await this.tokenService.invalidateAllUserSessions(userId)

    this.eventEmitter.emit('user.passwordChanged', {
      userId,
      timestamp: new Date(),
    })
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.enforceMaintenanceAccess()
    const normalizedEmail = email.toLowerCase().trim()

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.debug(
        `Password reset requested for non-existent email: ${normalizedEmail}`,
      )
      return
    }

    // Generate reset token
    const resetToken = this.generateSecureToken()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: await bcrypt.hash(resetToken, 10),
        passwordResetExpires: resetTokenExpiry,
      },
    })

    this.eventEmitter.emit('user.passwordResetRequested', {
      userId: user.id,
      email: user.email,
      resetToken, // Plain token to be sent via email
      expiresAt: resetTokenExpiry,
    })
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.enforceMaintenanceAccess()
    // Validate password strength
    this.validatePasswordStrength(newPassword)

    // Find users with non-expired reset tokens
    const users = await this.prisma.user.findMany({
      where: {
        passwordResetExpires: { gt: new Date() },
        passwordResetToken: { not: null },
      },
    })

    // Find user whose reset token matches
    let matchedUser: typeof users[0] | null = null
    for (const user of users) {
      const isValidToken = await bcrypt.compare(
        token,
        user.passwordResetToken || '',
      )
      if (isValidToken) {
        matchedUser = user
        break
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    const newPasswordHash = await this.hashPassword(newPassword)

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    // Invalidate all sessions
    await this.tokenService.invalidateAllUserSessions(matchedUser.id)

    this.eventEmitter.emit('user.passwordReset', {
      userId: matchedUser.id,
      timestamp: new Date(),
    })
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<AuthUser | null> {
    // Hash the API key to compare with stored hash
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    const key = await this.prisma.apiKey.findFirst({
      where: {
        key: keyHash,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    })

    if (!key) {
      return null
    }

    // Update last used timestamp
    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    })

    return {
      id: key.user.id,
      email: key.user.email,
      firstName: key.user.firstName,
      lastName: key.user.lastName,
      status: key.user.status,
      roles: key.user.userRoles.map((ur) => ur.role.name),
      emailVerified: key.user.emailVerified,
      twoFactorEnabled: key.user.twoFactorEnabled,
      hasCompletedOnboarding: key.user.hasCompletedOnboarding,
    }
  }

  /**
   * Create API key for user
   */
  async createApiKey(
    userId: string,
    name: string,
    scopes: string[] = [],
    expiresInDays?: number,
  ): Promise<{ key: string; keyPrefix: string }> {
    // Generate API key
    const rawKey = `oc_${crypto.randomBytes(32).toString('hex')}`
    const keyPrefix = rawKey.substring(0, 10)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        key: keyHash,
        keyPrefix,
        scopes,
        expiresAt,
      },
    })

    this.logger.log(`API key created for user: ${userId}`)

    return { key: rawKey, keyPrefix }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    await this.prisma.apiKey.updateMany({
      where: { id: keyId, userId },
      data: { isActive: false, revokedAt: new Date() },
    })

    this.logger.log(`API key revoked: ${keyId}`)
  }

  /**
   * Get user's API keys
   */
  async getUserApiKeys(userId: string): Promise<
    {
      id: string
      name: string
      keyPrefix: string
      scopes: string[]
      lastUsedAt: Date | null
      expiresAt: Date | null
      isActive: boolean
      createdAt: Date
    }[]
  > {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
        vendorProfile: {
          select: { id: true },
        },
      },
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: user.userRoles.map((ur) => ur.role.name),
      tenantId: user.vendorProfile?.id,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(
    userId: string,
    email: string,
    context: LoginContext,
  ): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    })

    await this.recordFailedLogin(email, userId, 'invalid_password', context)

    if (user.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION_MS) },
      })

      this.eventEmitter.emit('user.accountLocked', {
        userId,
        reason: 'Too many failed login attempts',
        timestamp: new Date(),
      })

      this.logger.warn(
        `Account locked due to too many failed attempts: ${userId}`,
      )
    }
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedLogin(
    email: string,
    userId: string | null,
    failureReason: string,
    context: LoginContext,
    loginMethod: LoginMethod = LoginMethod.EMAIL_PASSWORD,
  ): Promise<void> {
    await this.loginActivityService.recordLoginAttempt(
      {
        email,
        userId: userId || undefined,
        success: false,
        failureReason,
        loginMethod,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      context.deviceInfo,
      context.geoLocation,
    )
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Generate temporary token for 2FA verification
   */
  private generateTemporary2FAToken(): string {
    return `2fa_${crypto.randomBytes(32).toString('hex')}`
  }
}
