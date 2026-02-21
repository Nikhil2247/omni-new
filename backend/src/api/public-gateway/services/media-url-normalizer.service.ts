import { Injectable } from '@nestjs/common';
import { MinioService } from '../../../infrastructure/storage/minio.service';

@Injectable()
export class MediaUrlNormalizerService {
  private readonly mediaKeyPattern =
    /^(url|thumbnailUrl|cdnUrl|mediaUrl|profilePhotoUrl|featuredImage|ogImage|avatarUrl|bannerUrl|coverImage|logo|imageUrl)$/i;

  constructor(private readonly minioService: MinioService) {}

  async normalizeDeep<T>(value: T): Promise<T> {
    return (await this.normalizeValue(value, null, null)) as T;
  }

  private async normalizeValue(
    value: unknown,
    key: string | null,
    parentKey: string | null,
  ): Promise<unknown> {
    if (value == null) {
      return value;
    }

    if (typeof value === 'string') {
      if (!this.shouldNormalizeStringKey(key, parentKey)) {
        return value;
      }
      return this.normalizeMediaString(value);
    }

    if (Array.isArray(value)) {
      return Promise.all(
        value.map((item) => this.normalizeValue(item, null, key)),
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      const normalizedEntries = await Promise.all(
        entries.map(async ([entryKey, entryValue]) => [
          entryKey,
          await this.normalizeValue(entryValue, entryKey, key),
        ]),
      );

      return Object.fromEntries(normalizedEntries);
    }

    return value;
  }

  private shouldNormalizeStringKey(
    key: string | null,
    parentKey: string | null,
  ): boolean {
    if (!key) {
      return false;
    }

    if (this.mediaKeyPattern.test(key)) {
      return true;
    }

    if (key.toLowerCase() === 'path' && parentKey?.toLowerCase().includes('media')) {
      return true;
    }

    return false;
  }

  private async normalizeMediaString(value: string): Promise<string> {
    const objectPath = this.extractObjectPath(value);
    if (!objectPath) {
      return value;
    }

    return this.minioService.getFileUrl(objectPath);
  }

  private extractObjectPath(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      const normalizedPath = trimmed.replace(/^\/+/, '');
      if (!normalizedPath.includes('/') || normalizedPath.includes(' ')) {
        return null;
      }
      return this.stripBucketPrefix(normalizedPath);
    }

    try {
      const parsed = new URL(trimmed);
      const hostname = parsed.hostname.toLowerCase();
      const pathname = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));

      if (hostname === 'files.omnicassion.com') {
        return null;
      }

      const mediaPathParam = parsed.searchParams.get('path');
      if (mediaPathParam) {
        return this.stripBucketPrefix(
          decodeURIComponent(mediaPathParam).replace(/^\/+/, ''),
        );
      }

      const segments = pathname.split('/').filter(Boolean);
      if (segments.length === 0) {
        return null;
      }

      const isMinioLikeHost =
        hostname === 'infra-minio' ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.includes('minio') ||
        parsed.port === '9000' ||
        pathname.includes('/public/media/view');

      if (!isMinioLikeHost && hostname !== 'files.omnicassion.com') {
        return null;
      }

      return this.stripBucketPrefix(segments.slice(1).join('/'));
    } catch {
      return null;
    }
  }

  private stripBucketPrefix(path: string): string {
    const bucket = this.minioService.getDefaultBucket();
    const normalized = path.replace(/^\/+/, '');

    if (normalized.startsWith(`${bucket}/`)) {
      return normalized.slice(bucket.length + 1);
    }

    return normalized;
  }
}
