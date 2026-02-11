// ============================================================================
// TWO-FACTOR SERVICE - TOTP-based Two-Factor Authentication
// ============================================================================
// Handles 2FA setup, verification, and backup code management
// Uses TOTP (Time-based One-Time Password) algorithm (RFC 6238)
// ============================================================================

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as crypto from 'crypto'
import { PrismaService } from '../database/prisma.service'

export interface TwoFactorSetupResult {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface TwoFactorVerifyResult {
  success: boolean
  usedBackupCode?: boolean
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name)
  private readonly TOTP_DIGITS = 6
  private readonly TOTP_PERIOD = 30 // seconds
  private readonly TOTP_WINDOW = 1 // Allow 1 step before/after for clock drift
  private readonly BACKUP_CODES_COUNT = 10
  private readonly APP_NAME: string
  private readonly ENCRYPTION_KEY: Buffer

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.APP_NAME = 'Omnicassion'
    const encKey = this.configService.get<string>('ENCRYPTION_KEY')
    if (!encKey || encKey.length < 32) {
      this.logger.warn('ENCRYPTION_KEY not set or too short, using fallback')
      this.ENCRYPTION_KEY = crypto.scryptSync('default-key', 'salt', 32)
    } else {
      this.ENCRYPTION_KEY = Buffer.from(encKey.substring(0, 64), 'hex')
    }
  }

  /**
   * Initialize 2FA setup for a user
   * Returns secret and QR code URL for authenticator app
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    })

    if (!user) {
      throw new BadRequestException('User not found')
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled')
    }

    // Generate secret
    const secret = this.generateSecret()

    // Generate backup codes
    const backupCodes = this.generateBackupCodes()
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => this.hashBackupCode(code)),
    )

    // Encrypt secret for storage
    const encryptedSecret = this.encrypt(secret)

    // Store temporarily (not enabled yet, user must verify first)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedBackupCodes,
        twoFactorEnabled: false, // Will be enabled after verification
      },
    })

    // Generate QR code URL for authenticator apps
    const qrCodeUrl = this.generateQRCodeUrl(user.email, secret)

    this.logger.debug(`2FA setup initiated for user: ${userId}`)

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    }
  }

  /**
   * Verify TOTP code and enable 2FA
   * Called after user scans QR code and enters verification code
   */
  async verifyAndEnableTwoFactor(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })

    if (!user) {
      throw new BadRequestException('User not found')
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled')
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor setup not initiated')
    }

    // Decrypt secret
    const secret = this.decrypt(user.twoFactorSecret)

    // Verify code
    const isValid = this.verifyTOTP(secret, code)

    if (!isValid) {
      throw new BadRequestException('Invalid verification code')
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
      },
    })

    this.eventEmitter.emit('user.twoFactorEnabled', {
      userId,
      timestamp: new Date(),
    })

    this.logger.log(`2FA enabled for user: ${userId}`)

    return true
  }

  /**
   * Verify TOTP code during login
   */
  async verifyTwoFactorCode(
    userId: string,
    code: string,
  ): Promise<TwoFactorVerifyResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled')
    }

    // First try TOTP verification
    const secret = this.decrypt(user.twoFactorSecret)
    const isTOTPValid = this.verifyTOTP(secret, code)

    if (isTOTPValid) {
      return { success: true, usedBackupCode: false }
    }

    // Try backup code if TOTP fails
    const backupCodeResult = await this.verifyBackupCode(
      userId,
      code,
      user.twoFactorBackupCodes,
    )

    if (backupCodeResult) {
      return { success: true, usedBackupCode: true }
    }

    throw new UnauthorizedException('Invalid two-factor code')
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, code: string): Promise<boolean> {
    // Verify code first
    await this.verifyTwoFactorCode(userId, code)

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorVerifiedAt: null,
      },
    })

    this.eventEmitter.emit('user.twoFactorDisabled', {
      userId,
      timestamp: new Date(),
    })

    this.logger.log(`2FA disabled for user: ${userId}`)

    return true
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    // Verify current 2FA code first
    await this.verifyTwoFactorCode(userId, code)

    const backupCodes = this.generateBackupCodes()
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => this.hashBackupCode(code)),
    )

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: hashedBackupCodes,
      },
    })

    this.eventEmitter.emit('user.backupCodesRegenerated', {
      userId,
      timestamp: new Date(),
    })

    this.logger.log(`Backup codes regenerated for user: ${userId}`)

    return backupCodes
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    })

    return user?.twoFactorEnabled ?? false
  }

  /**
   * Get remaining backup codes count
   */
  async getBackupCodesCount(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorBackupCodes: true },
    })

    return user?.twoFactorBackupCodes?.length ?? 0
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Generate a random base32-encoded secret
   */
  private generateSecret(): string {
    const buffer = crypto.randomBytes(20)
    return this.base32Encode(buffer)
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // Format: XXXX-XXXX (8 characters with hyphen)
      const bytes = crypto.randomBytes(4)
      const code = bytes.toString('hex').toUpperCase()
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`)
    }
    return codes
  }

  /**
   * Hash a backup code for storage
   */
  private async hashBackupCode(code: string): Promise<string> {
    const normalizedCode = code.replace(/-/g, '').toUpperCase()
    return crypto.createHash('sha256').update(normalizedCode).digest('hex')
  }

  /**
   * Verify a backup code and remove it if valid
   */
  private async verifyBackupCode(
    userId: string,
    code: string,
    hashedCodes: string[],
  ): Promise<boolean> {
    const normalizedCode = code.replace(/-/g, '').toUpperCase()
    const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex')

    const index = hashedCodes.indexOf(codeHash)
    if (index === -1) {
      return false
    }

    // Remove used backup code
    const updatedCodes = [...hashedCodes]
    updatedCodes.splice(index, 1)

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: updatedCodes,
      },
    })

    this.eventEmitter.emit('user.backupCodeUsed', {
      userId,
      remainingCodes: updatedCodes.length,
      timestamp: new Date(),
    })

    this.logger.warn(
      `Backup code used for user: ${userId}, remaining: ${updatedCodes.length}`,
    )

    return true
  }

  /**
   * Generate TOTP code for current time
   */
  private generateTOTP(secret: string, counter?: number): string {
    const time = counter ?? Math.floor(Date.now() / 1000 / this.TOTP_PERIOD)
    const timeBuffer = Buffer.alloc(8)
    timeBuffer.writeBigInt64BE(BigInt(time))

    const key = this.base32Decode(secret)
    const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest()

    const offset = hmac[hmac.length - 1] & 0x0f
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)

    return (code % Math.pow(10, this.TOTP_DIGITS))
      .toString()
      .padStart(this.TOTP_DIGITS, '0')
  }

  /**
   * Verify TOTP code with time window for clock drift
   */
  private verifyTOTP(secret: string, code: string): boolean {
    const currentCounter = Math.floor(Date.now() / 1000 / this.TOTP_PERIOD)

    for (let i = -this.TOTP_WINDOW; i <= this.TOTP_WINDOW; i++) {
      const expectedCode = this.generateTOTP(secret, currentCounter + i)
      if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expectedCode))) {
        return true
      }
    }

    return false
  }

  /**
   * Generate otpauth URL for QR code
   */
  private generateQRCodeUrl(email: string, secret: string): string {
    const encodedEmail = encodeURIComponent(email)
    const encodedIssuer = encodeURIComponent(this.APP_NAME)
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&digits=${this.TOTP_DIGITS}&period=${this.TOTP_PERIOD}`
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private encrypt(data: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', this.ENCRYPTION_KEY, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.ENCRYPTION_KEY, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  /**
   * Base32 encode (RFC 4648)
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let result = ''
    let bits = 0
    let value = 0

    for (const byte of buffer) {
      value = (value << 8) | byte
      bits += 8

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31]
        bits -= 5
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31]
    }

    return result
  }

  /**
   * Base32 decode (RFC 4648)
   */
  private base32Decode(str: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    const bytes: number[] = []
    let bits = 0
    let value = 0

    for (const char of str.toUpperCase()) {
      const index = alphabet.indexOf(char)
      if (index === -1) continue

      value = (value << 5) | index
      bits += 5

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255)
        bits -= 8
      }
    }

    return Buffer.from(bytes)
  }
}
