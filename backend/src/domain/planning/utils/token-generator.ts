// ============================================================================
// TOKEN GENERATOR - Planning Domain Utilities
// ============================================================================
// Generates secure tokens for RSVP links and other guest-facing features
// ============================================================================

import { randomBytes } from 'crypto';

/**
 * Generate a secure, URL-safe RSVP token
 * Uses base64url encoding for safe use in URLs
 * 16 bytes = 22 characters after encoding (sufficient for uniqueness)
 */
export function generateRsvpToken(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * Generate a shorter token for display purposes (e.g., 6-char codes)
 */
export function generateShortCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars (0, O, 1, I)
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}
