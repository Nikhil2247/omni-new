// ============================================================================
// TOKEN SERVICE - JWT Token Management
// ============================================================================
// Handles access token and refresh token generation, validation, and rotation
// Supports enhanced session tracking with device and location information
// ============================================================================

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../database/prisma.service'
import { DeviceInfo, GeoLocation } from './login-activity.service'

export interface TokenPayload {
  sub: string
  email: string
  roles: string[]
  tenantId?: string
  sessionId?: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  sub: string
  type: 'refresh'
  sessionId: string
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  sessionId?: string
}

export interface SessionContext {
  ipAddress: string
  userAgent?: string
  deviceInfo?: DeviceInfo
  geoLocation?: GeoLocation
}

export interface SessionInfo {
  id: string
  deviceType: string | null
  deviceName: string | null
  browser: string | null
  os: string | null
  location: string | null
  ipAddress: string | null
  lastActiveAt: Date
  createdAt: Date
  expiresAt: Date
  isCurrent: boolean
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name)
  private readonly ACCESS_TOKEN_EXPIRY = '15m'
  private readonly REFRESH_TOKEN_EXPIRY = '7d'
  private readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate token pair with session tracking
   */
  async generateTokenPair(
    payload: Omit<TokenPayload, 'iat' | 'exp' | 'sessionId'>,
    context?: SessionContext,
  ): Promise<TokenPair> {
    // Create session first
    const session = await this.createSession(payload.sub, context)

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken({ ...payload, sessionId: session.id }),
      this.generateRefreshToken(payload.sub, session.id),
    ])

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      sessionId: session.id,
    }
  }

  /**
   * Generate access token
   */
  async generateAccessToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      secret: this.configService.get<string>('JWT_SECRET'),
    })
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(
    userId: string,
    sessionId: string,
  ): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      type: 'refresh',
      sessionId,
    }

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    })

    // Store hashed refresh token for additional security
    const hashedToken = await bcrypt.hash(refreshToken, 10)
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { refreshToken: hashedToken },
    })

    return refreshToken
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      })

      // Verify session is still valid (not revoked)
      if (payload.sessionId) {
        const session = await this.prisma.userSession.findUnique({
          where: { id: payload.sessionId },
        })

        if (!session || session.isRevoked) {
          throw new UnauthorizedException('Session has been revoked')
        }

        // Update last active time
        await this.prisma.userSession.update({
          where: { id: payload.sessionId },
          data: { lastActiveAt: new Date() },
        })
      }

      return payload
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      this.logger.warn('Access token verification failed', error)
      throw new UnauthorizedException('Invalid or expired token')
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      )

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type')
      }

      // Verify session exists and is valid
      const session = await this.prisma.userSession.findUnique({
        where: { id: payload.sessionId },
      })

      if (!session) {
        throw new UnauthorizedException('Session not found')
      }

      if (session.isRevoked) {
        throw new UnauthorizedException('Session has been revoked')
      }

      if (session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired')
      }

      // Verify token matches stored hash
      const isValidToken = await bcrypt.compare(
        token,
        session.refreshToken || '',
      )
      if (!isValidToken) {
        // Possible token reuse attack - invalidate all sessions for this user
        this.logger.warn(
          `Possible token reuse attack detected for user: ${payload.sub}`,
        )
        await this.invalidateAllUserSessions(payload.sub)
        throw new UnauthorizedException('Invalid refresh token')
      }

      return payload
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      this.logger.warn('Refresh token verification failed', error)
      throw new UnauthorizedException('Invalid or expired refresh token')
    }
  }

  /**
   * Rotate refresh token (get new token pair)
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    context?: SessionContext,
  ): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(oldRefreshToken)

    // Get existing session to preserve some data
    const existingSession = await this.prisma.userSession.findUnique({
      where: { id: payload.sessionId },
    })

    // Invalidate old session
    await this.prisma.userSession.update({
      where: { id: payload.sessionId },
      data: { isRevoked: true },
    })

    // Get user with roles for new token pair
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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
      throw new UnauthorizedException('User not found')
    }

    // Merge existing session context with new context
    const mergedContext: SessionContext = {
      ipAddress: context?.ipAddress || existingSession?.ipAddress || '',
      userAgent: context?.userAgent || existingSession?.userAgent || undefined,
      deviceInfo: context?.deviceInfo || {
        deviceType: existingSession?.deviceType || undefined,
        browser: undefined,
        os: undefined,
      },
      geoLocation: context?.geoLocation || {
        country: undefined,
        city: existingSession?.location || undefined,
      },
    }

    const newPayload: Omit<TokenPayload, 'iat' | 'exp' | 'sessionId'> = {
      sub: user.id,
      email: user.email,
      roles: user.userRoles.map((ur) => ur.role.name),
      tenantId: user.vendorProfile?.id,
    }

    return this.generateTokenPair(newPayload, mergedContext)
  }

  /**
   * Create a new session
   */
  private async createSession(
    userId: string,
    context?: SessionContext,
  ): Promise<{ id: string }> {
    // Build device name from device info
    const deviceName = this.buildDeviceName(context?.deviceInfo)
    const location = this.buildLocation(context?.geoLocation)

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_MS),
        userAgent: context?.userAgent || null,
        ipAddress: context?.ipAddress || null,
        deviceType: context?.deviceInfo?.deviceType || null,
        deviceName,
        location,
        lastActiveAt: new Date(),
        isRevoked: false,
      },
    })

    return { id: session.id }
  }

  /**
   * Build device name from device info
   */
  private buildDeviceName(deviceInfo?: DeviceInfo): string | null {
    if (!deviceInfo) return null

    const parts: string[] = []
    if (deviceInfo.browser) parts.push(deviceInfo.browser)
    if (deviceInfo.os) parts.push(`on ${deviceInfo.os}`)

    return parts.length > 0 ? parts.join(' ') : null
  }

  /**
   * Build location string from geo location
   */
  private buildLocation(geoLocation?: GeoLocation): string | null {
    if (!geoLocation) return null

    const parts: string[] = []
    if (geoLocation.city) parts.push(geoLocation.city)
    if (geoLocation.country) parts.push(geoLocation.country)

    return parts.length > 0 ? parts.join(', ') : null
  }

  /**
   * Invalidate a specific session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      })
      this.logger.debug(`Invalidated session: ${sessionId}`)
    } catch (error) {
      this.logger.warn(`Failed to invalidate session: ${sessionId}`, error)
    }
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    const result = await this.prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    })
    this.logger.debug(
      `Invalidated ${result.count} sessions for user: ${userId}`,
    )
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionInfo[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceType: true,
        deviceName: true,
        location: true,
        ipAddress: true,
        userAgent: true,
        lastActiveAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    })

    return sessions.map((session) => ({
      id: session.id,
      deviceType: session.deviceType,
      deviceName: session.deviceName,
      browser: this.extractBrowser(session.userAgent),
      os: this.extractOS(session.userAgent),
      location: session.location,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentSessionId,
    }))
  }

  /**
   * Get session count for a user
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    return this.prisma.userSession.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    })
  }

  /**
   * Revoke session by ID (for user to logout from specific device)
   */
  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    const result = await this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId, // Ensure user owns this session
        isRevoked: false,
      },
      data: { isRevoked: true },
    })

    return result.count > 0
  }

  /**
   * Cleanup expired sessions (run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            // Keep revoked sessions for 7 days for audit
            createdAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    })

    this.logger.log(`Cleaned up ${result.count} expired/old sessions`)
    return result.count
  }

  /**
   * Decode token without verification (for extracting claims)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.decode(token) as TokenPayload
    } catch {
      return null
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Extract browser from user agent
   */
  private extractBrowser(userAgent: string | null): string | null {
    if (!userAgent) return null

    if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
      return 'Chrome'
    } else if (/firefox/i.test(userAgent)) {
      return 'Firefox'
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      return 'Safari'
    } else if (/edg/i.test(userAgent)) {
      return 'Edge'
    } else if (/msie|trident/i.test(userAgent)) {
      return 'Internet Explorer'
    }

    return null
  }

  /**
   * Extract OS from user agent
   */
  private extractOS(userAgent: string | null): string | null {
    if (!userAgent) return null

    if (/windows/i.test(userAgent)) {
      return 'Windows'
    } else if (/macintosh|mac os/i.test(userAgent)) {
      return 'macOS'
    } else if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) {
      return 'Linux'
    } else if (/android/i.test(userAgent)) {
      return 'Android'
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      return 'iOS'
    }

    return null
  }
}
