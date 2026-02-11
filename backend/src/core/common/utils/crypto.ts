// ============================================================================
// CRYPTO UTILITIES - Cryptographic Helper Functions
// ============================================================================
// Utilities for hashing, encryption, and secure token generation
// ============================================================================

import * as crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

export interface EncryptedData {
  iv: string
  encryptedData: string
  authTag: string
}

export class CryptoUtils {
  /**
   * Generate a cryptographically secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate a URL-safe token
   */
  static generateUrlSafeToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url')
  }

  /**
   * Generate a short numeric OTP
   */
  static generateOTP(length: number = 6): string {
    const max = Math.pow(10, length)
    const randomNum = crypto.randomInt(0, max)
    return randomNum.toString().padStart(length, '0')
  }

  /**
   * Create SHA256 hash of data
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Create SHA512 hash of data
   */
  static sha512(data: string): string {
    return crypto.createHash('sha512').update(data).digest('hex')
  }

  /**
   * Create HMAC signature
   */
  static hmac(data: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex')
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  static encrypt(plaintext: string, key?: string): EncryptedData {
    const encryptionKey = key || ENCRYPTION_KEY
    const keyBuffer = Buffer.from(encryptionKey.slice(0, 64), 'hex')
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv)
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: cipher.getAuthTag().toString('hex'),
    }
  }

  /**
   * Decrypt data encrypted with encrypt()
   */
  static decrypt(encryptedData: EncryptedData, key?: string): string {
    const encryptionKey = key || ENCRYPTION_KEY
    const keyBuffer = Buffer.from(encryptionKey.slice(0, 64), 'hex')
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const authTag = Buffer.from(encryptedData.authTag, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Simple string encryption (for storing in single DB field)
   */
  static encryptString(plaintext: string, key?: string): string {
    const encrypted = this.encrypt(plaintext, key)
    return `${encrypted.iv}:${encrypted.authTag}:${encrypted.encryptedData}`
  }

  /**
   * Decrypt string encrypted with encryptString()
   */
  static decryptString(encryptedString: string, key?: string): string {
    const [iv, authTag, encryptedData] = encryptedString.split(':')
    return this.decrypt({ iv, authTag, encryptedData }, key)
  }

  /**
   * Compare two strings in constant time (prevents timing attacks)
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  }

  /**
   * Generate API key with prefix
   */
  static generateApiKey(prefix: string = 'ok'): string {
    const key = this.generateSecureToken(24)
    const checksum = this.sha256(key).slice(0, 6)
    return `${prefix}_${key}${checksum}`
  }

  /**
   * Validate API key format and checksum
   */
  static validateApiKeyFormat(apiKey: string, prefix: string = 'ok'): boolean {
    const regex = new RegExp(`^${prefix}_[a-f0-9]{48}[a-f0-9]{6}$`)
    if (!regex.test(apiKey)) {
      return false
    }

    const key = apiKey.slice(prefix.length + 1, -6)
    const providedChecksum = apiKey.slice(-6)
    const expectedChecksum = this.sha256(key).slice(0, 6)

    return this.constantTimeCompare(providedChecksum, expectedChecksum)
  }

  /**
   * Mask sensitive data for display
   */
  static maskString(value: string, visibleChars: number = 4): string {
    if (value.length <= visibleChars * 2) {
      return '*'.repeat(value.length)
    }

    const start = value.slice(0, visibleChars)
    const end = value.slice(-visibleChars)
    const masked = '*'.repeat(value.length - visibleChars * 2)

    return `${start}${masked}${end}`
  }

  /**
   * Mask email address
   */
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@')
    if (!domain) return email

    const maskedLocal =
      localPart.length <= 2
        ? '*'.repeat(localPart.length)
        : localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1)

    return `${maskedLocal}@${domain}`
  }
}
