// ============================================================================
// STORAGE PATH HELPER - Centralized path generation for file storage
// ============================================================================
// Provides consistent folder structure across all file uploads
//
// Folder Structure:
// vendors/{vendorSlug}/
//   ├── profile/         - Profile photos
//   ├── banner/          - Banner images
//   ├── portfolio/       - Portfolio media items
//   │   └── thumbnails/  - Portfolio thumbnails
//   └── kyc/             - KYC documents
//
// blogs/{blogSlug}/
//   └── images/          - Blog post images
//
// users/{userId}/
//   └── avatar/          - User avatars
//
// events/{eventId}/
//   ├── banner/          - Event banners
//   └── gallery/         - Event gallery uploads
//       └── thumbnails/  - Gallery thumbnails
// ============================================================================

import { Injectable } from '@nestjs/common';
import slugify from 'slugify';

export interface VendorPathOptions {
  vendorSlug: string;
  vendorId?: string;
}

export interface BlogPathOptions {
  blogSlug: string;
  blogId?: string;
}

export interface UserPathOptions {
  userId: string;
}

export interface EventPathOptions {
  eventId: string;
  eventCode?: string;
}

@Injectable()
export class StoragePathHelper {
  /**
   * Generate a safe filename with timestamp
   */
  private generateFilename(originalName: string, extension?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = extension || this.getExtension(originalName);
    const safeName = slugify(this.getBasename(originalName), {
      lower: true,
      strict: true,
      trim: true,
    }).substring(0, 50);

    return `${timestamp}-${random}${safeName ? `-${safeName}` : ''}.${ext}`;
  }

  /**
   * Get file extension from filename
   */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
  }

  /**
   * Get basename without extension
   */
  private getBasename(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      parts.pop();
    }
    return parts.join('.');
  }

  /**
   * Sanitize slug for path usage
   */
  private sanitizeSlug(slug: string): string {
    return slugify(slug, { lower: true, strict: true, trim: true }) || 'unknown';
  }

  // ============================================================================
  // VENDOR PATHS
  // ============================================================================

  /**
   * Generate path for vendor profile photo
   * Path: vendors/{vendorSlug}/profile/{filename}.webp
   */
  vendorProfilePhoto(options: VendorPathOptions, originalName: string): string {
    const slug = this.sanitizeSlug(options.vendorSlug);
    const filename = this.generateFilename(originalName, 'webp');
    return `vendors/${slug}/profile/${filename}`;
  }

  /**
   * Generate path for vendor banner image
   * Path: vendors/{vendorSlug}/banner/{filename}.webp
   */
  vendorBanner(options: VendorPathOptions, originalName: string): string {
    const slug = this.sanitizeSlug(options.vendorSlug);
    const filename = this.generateFilename(originalName, 'webp');
    return `vendors/${slug}/banner/${filename}`;
  }

  /**
   * Generate path for vendor portfolio item
   * Path: vendors/{vendorSlug}/portfolio/{filename}.webp
   */
  vendorPortfolio(options: VendorPathOptions, originalName: string): string {
    const slug = this.sanitizeSlug(options.vendorSlug);
    const filename = this.generateFilename(originalName, 'webp');
    return `vendors/${slug}/portfolio/${filename}`;
  }

  /**
   * Generate path for vendor portfolio thumbnail
   * Path: vendors/{vendorSlug}/portfolio/thumbnails/{filename}.webp
   */
  vendorPortfolioThumbnail(options: VendorPathOptions, originalName: string): string {
    const slug = this.sanitizeSlug(options.vendorSlug);
    const filename = this.generateFilename(originalName, 'webp');
    return `vendors/${slug}/portfolio/thumbnails/${filename}`;
  }

  /**
   * Generate path for vendor KYC document
   * Path: vendors/{vendorSlug}/kyc/{documentType}_{filename}
   */
  vendorKycDocument(
    options: VendorPathOptions,
    documentType: string,
    originalName: string,
  ): string {
    const slug = this.sanitizeSlug(options.vendorSlug);
    const timestamp = Date.now();
    const safeOriginalName = slugify(originalName, { lower: true, strict: false, trim: true });
    return `vendors/${slug}/kyc/${documentType.toLowerCase()}_${timestamp}_${safeOriginalName}`;
  }

  // ============================================================================
  // BLOG PATHS
  // ============================================================================

  /**
   * Generate path for blog featured image
   * Path: blogs/{blogSlug}/featured/{filename}.webp
   */
  blogFeaturedImage(options: BlogPathOptions, originalName: string): string {
    const slug = this.sanitizeSlug(options.blogSlug);
    const filename = this.generateFilename(originalName, 'webp');
    return `blogs/${slug}/featured/${filename}`;
  }

  /**
   * Generate path for blog content image
   * Path: blogs/{blogSlug}/images/{filename}.webp
   */
  blogContentImage(options: BlogPathOptions, originalName: string): string {
    const slug = this.sanitizeSlug(options.blogSlug);
    const filename = this.generateFilename(originalName, 'webp');
    return `blogs/${slug}/images/${filename}`;
  }

  // ============================================================================
  // USER PATHS
  // ============================================================================

  /**
   * Generate path for user avatar
   * Path: users/{userId}/avatar/{filename}.webp
   */
  userAvatar(options: UserPathOptions, originalName: string): string {
    const filename = this.generateFilename(originalName, 'webp');
    return `users/${options.userId}/avatar/${filename}`;
  }

  // ============================================================================
  // EVENT PATHS
  // ============================================================================

  /**
   * Generate path for event banner
   * Path: events/{eventId}/banner/{filename}.webp
   */
  eventBanner(options: EventPathOptions, originalName: string): string {
    const filename = this.generateFilename(originalName, 'webp');
    return `events/${options.eventId}/banner/${filename}`;
  }

  /**
   * Generate path for event gallery image
   * Path: events/{eventId}/gallery/{filename}.webp
   */
  eventGallery(options: EventPathOptions, originalName: string): string {
    const filename = this.generateFilename(originalName, 'webp');
    return `events/${options.eventId}/gallery/${filename}`;
  }

  /**
   * Generate path for event gallery thumbnail
   * Path: events/{eventId}/gallery/thumbnails/{filename}.webp
   */
  eventGalleryThumbnail(options: EventPathOptions, originalName: string): string {
    const filename = this.generateFilename(originalName, 'webp');
    return `events/${options.eventId}/gallery/thumbnails/${filename}`;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Extract vendor slug from a storage path
   */
  extractVendorSlugFromPath(path: string): string | null {
    const match = path.match(/^vendors\/([^/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Extract blog slug from a storage path
   */
  extractBlogSlugFromPath(path: string): string | null {
    const match = path.match(/^blogs\/([^/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Check if path belongs to a vendor
   */
  isVendorPath(path: string): boolean {
    return path.startsWith('vendors/');
  }

  /**
   * Check if path belongs to a blog
   */
  isBlogPath(path: string): boolean {
    return path.startsWith('blogs/');
  }

  /**
   * Check if path belongs to a user
   */
  isUserPath(path: string): boolean {
    return path.startsWith('users/');
  }

  /**
   * Check if path belongs to an event
   */
  isEventPath(path: string): boolean {
    return path.startsWith('events/');
  }

  /**
   * Generate thumbnail path from main image path
   */
  getThumbnailPath(imagePath: string): string {
    const parts = imagePath.split('/');
    const filename = parts.pop()!;
    parts.push('thumbnails', `thumb-${filename}`);
    return parts.join('/');
  }
}
