import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { MinioService } from '../../../infrastructure/storage/minio.service';
import { Public } from '../../../core/auth/decorators/public.decorator';
import * as path from 'path';

@Public()
@Controller('media')
export class MediaController {
  constructor(private readonly minioService: MinioService) {}

  @Get('presigned')
  async getPresignedMediaUrl(
    @Query('path') path: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    if (!path) {
      throw new BadRequestException('path is required');
    }

    const objectPath = await this.resolveObjectPath(path);
    const ttl = expiresIn ? Number(expiresIn) : 3600;

    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new BadRequestException('expiresIn must be a positive number');
    }

    const url = await this.minioService.getPresignedGetUrl(objectPath, {
      expiresIn: Math.floor(ttl),
    });

    return {
      path: objectPath,
      url,
      expiresIn: Math.floor(ttl),
    };
  }

  @Get('view')
  async viewMedia(
    @Query('path') path: string,
    @Res() res: Response,
    @Query('expiresIn') expiresIn?: string,
  ) {
    if (!path) {
      throw new BadRequestException('path is required');
    }

    const objectPath = await this.resolveObjectPath(path);
    const ttl = expiresIn ? Number(expiresIn) : undefined;

    try {
      const [stream, info] = await Promise.all([
        this.minioService.getFileStream(objectPath),
        this.minioService.getFileInfo(objectPath).catch(() => null),
      ]);

      const contentType =
        info?.metadata?.['content-type'] ||
        info?.metadata?.['Content-Type'] ||
        this.guessContentType(objectPath) ||
        'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      if (info?.size) {
        res.setHeader('Content-Length', info.size.toString());
      }
      if (info?.etag) {
        res.setHeader('ETag', info.etag);
      }
      if (info?.lastModified) {
        res.setHeader('Last-Modified', info.lastModified.toUTCString());
      }
      if (ttl) {
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      stream.pipe(res);
    } catch (error) {
      throw new BadRequestException('Unable to load media');
    }
  }

  private async resolveObjectPath(pathOrUrl: string): Promise<string> {
    const candidates = this.buildObjectPathCandidates(pathOrUrl);

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      const exists = await this.minioService.fileExists(candidate);
      if (exists) {
        return candidate;
      }
    }

    return candidates[0] || this.extractObjectPath(pathOrUrl);
  }

  private buildObjectPathCandidates(pathOrUrl: string): string[] {
    const values = new Set<string>();
    const bucket = this.minioService.getDefaultBucket();

    const addCandidate = (value?: string | null) => {
      if (!value) {
        return;
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }

      const normalized = trimmed.replace(/^\/+/, '');
      if (!normalized) {
        return;
      }

      values.add(normalized);
      if (normalized.startsWith(`${bucket}/`)) {
        values.add(normalized.slice(bucket.length + 1));
      }
    };

    const decodeSafe = (input: string): string => {
      try {
        return decodeURIComponent(input);
      } catch {
        return input;
      }
    };

    addCandidate(pathOrUrl);
    const decoded = decodeSafe(pathOrUrl);
    addCandidate(decoded);
    addCandidate(decodeSafe(decoded));

    for (const candidate of Array.from(values)) {
      if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
        try {
          const url = new URL(candidate);
          const mediaParam = url.searchParams.get('path');
          if (mediaParam) {
            addCandidate(mediaParam);
          }
          addCandidate(decodeURIComponent(url.pathname.replace(/^\/+/, '')));
        } catch {
          continue;
        }
      }
    }

    const extracted = this.extractObjectPath(pathOrUrl);
    addCandidate(extracted);

    return Array.from(values);
  }

  private extractObjectPath(pathOrUrl: string): string {
    const trimmed = pathOrUrl.trim();

    if (!trimmed) {
      return trimmed;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
        const segments = pathname.split('/').filter(Boolean);

        if (segments.length <= 1) {
          return segments.join('/');
        }

        return segments.slice(1).join('/');
      } catch {
        return trimmed;
      }
    }

    return trimmed.replace(/^\/+/, '');
  }

  private guessContentType(objectPath: string): string | null {
    const ext = path.extname(objectPath).toLowerCase();

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      case '.svg':
        return 'image/svg+xml';
      case '.mp4':
        return 'video/mp4';
      case '.webm':
        return 'video/webm';
      default:
        return null;
    }
  }
}
