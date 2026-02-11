// ============================================================================
// EMAIL VERIFICATION SERVICE - Email Verification & Confirmation
// ============================================================================
// Handles email verification token generation, validation, and user activation
// ============================================================================

import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as crypto from 'crypto'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../database/prisma.service'

export interface VerificationResult {
  success: boolean
  userId: string
  email: string
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name)
  private readonly TOKEN_EXPIRY_HOURS = 24
  private readonly RESEND_COOLDOWN_MINUTES = 2

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate and store email verification token
   * Called during user registration
   */
  async generateVerificationToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    })

    if (!user) {
      throw new BadRequestException('User not found')
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified')
    }

    // Generate secure token
    const token = this.generateSecureToken()
    const hashedToken = await bcrypt.hash(token, 10)

    // Store hashed token
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken: hashedToken,
      },
    })

    // Emit event for email sending
    this.eventEmitter.emit('email.verificationRequested', {
      userId,
      email: user.email,
      token,
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
    })

    this.logger.debug(`Verification token generated for user: ${userId}`)

    return token
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<VerificationResult> {
    // Find users with unverified emails
    const unverifiedUsers = await this.prisma.user.findMany({
      where: {
        emailVerified: false,
        emailVerifyToken: { not: null },
      },
      select: {
        id: true,
        email: true,
        emailVerifyToken: true,
      },
    })

    // Find matching user
    let matchedUser: typeof unverifiedUsers[0] | null = null
    for (const user of unverifiedUsers) {
      const isValid = await bcrypt.compare(token, user.emailVerifyToken || '')
      if (isValid) {
        matchedUser = user
        break
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired verification token')
    }

    // Mark email as verified and activate account
    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        status: 'ACTIVE', // Activate account on email verification
      },
    })

    // Emit verification success event
    this.eventEmitter.emit('email.verified', {
      userId: matchedUser.id,
      email: matchedUser.email,
      timestamp: new Date(),
    })

    this.logger.log(`Email verified for user: ${matchedUser.id}`)

    return {
      success: true,
      userId: matchedUser.id,
      email: matchedUser.email,
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim()

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        updatedAt: true,
      },
    })

    // Don't reveal whether user exists
    if (!user) {
      this.logger.debug(`Resend verification requested for non-existent email: ${normalizedEmail}`)
      return true
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified')
    }

    // Check cooldown
    const timeSinceLastUpdate = Date.now() - user.updatedAt.getTime()
    if (timeSinceLastUpdate < this.RESEND_COOLDOWN_MINUTES * 60 * 1000) {
      const remainingSeconds = Math.ceil(
        (this.RESEND_COOLDOWN_MINUTES * 60 * 1000 - timeSinceLastUpdate) / 1000,
      )
      throw new BadRequestException(
        `Please wait ${remainingSeconds} seconds before requesting another verification email`,
      )
    }

    // Generate new token
    await this.generateVerificationToken(user.id)

    return true
  }

  /**
   * Check if email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    })

    return user?.emailVerified ?? false
  }

  /**
   * Get email verification status
   */
  async getVerificationStatus(userId: string): Promise<{
    emailVerified: boolean
    emailVerifiedAt: Date | null
    canResend: boolean
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, emailVerifiedAt: true, updatedAt: true },
    })

    if (!user) {
      throw new BadRequestException('User not found')
    }

    if (user.emailVerified) {
      return {
        emailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt,
        canResend: false,
      }
    }

    const timeSinceLastUpdate = Date.now() - user.updatedAt.getTime()
    const canResend =
      timeSinceLastUpdate >= this.RESEND_COOLDOWN_MINUTES * 60 * 1000

    return {
      emailVerified: false,
      emailVerifiedAt: user.emailVerifiedAt,
      canResend,
    }
  }

  /**
   * Update email address (requires re-verification)
   */
  async updateEmail(userId: string, newEmail: string): Promise<string> {
    const normalizedEmail = newEmail.toLowerCase().trim()

    // Check if email is already in use
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException('Email is already in use')
    }

    // Generate verification token for new email
    const token = this.generateSecureToken()
    const hashedToken = await bcrypt.hash(token, 10)

    // Update user with new email and reset verification
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        emailVerified: false,
        emailVerifiedAt: null,
        emailVerifyToken: hashedToken,
      },
    })

    // Emit event for email sending
    this.eventEmitter.emit('email.changeRequested', {
      userId,
      newEmail: normalizedEmail,
      token,
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
    })

    this.logger.log(`Email change initiated for user: ${userId} to ${normalizedEmail}`)

    return token
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}
